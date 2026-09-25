<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PostResource;
use App\Models\Post;
use App\Models\PostType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Posts and pages. Anyone may read what is published; a token whose user
 * may view posts also sees drafts and scheduled posts (status filter).
 * Writing needs a token with the "write" ability and the user's permission.
 */
class ContentController extends Controller
{
    public function posts(Request $request): AnonymousResourceCollection
    {
        return $this->list($request, pages: false);
    }

    public function pages(Request $request): AnonymousResourceCollection
    {
        return $this->list($request, pages: true);
    }

    public function post(Request $request, string $slug): PostResource
    {
        return $this->single($request, $slug, pages: false);
    }

    public function page(Request $request, string $slug): PostResource
    {
        return $this->single($request, $slug, pages: true);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Post::class);

        $data = $this->validated($request);
        $type = PostType::where('name', $data['type'] ?? 'post')->orWhere('slug', $data['type'] ?? 'post')->firstOrFail();

        $post = Post::create([
            'post_type_id' => $type->id,
            'author_id' => $request->user()->id,
            'title' => $data['title'],
            'slug' => Post::uniqueSlug(Str::slug($data['slug'] ?? $data['title'])),
            'excerpt' => $data['excerpt'] ?? null,
            'content' => $data['content'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'published_at' => $this->publishedAt($data, null),
            'featured_image' => $data['featured_image'] ?? null,
            'meta_title' => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
        ]);

        if (array_key_exists('terms', $data)) {
            $post->taxonomyTerms()->sync($data['terms'] ?? []);
        }

        return (new PostResource($post->load(['postType', 'author', 'taxonomyTerms.taxonomy'])))->withContent()
            ->response()->setStatusCode(201);
    }

    public function update(Request $request, int $id): PostResource
    {
        $post = Post::findOrFail($id);
        $this->authorize('update', $post);

        $data = $this->validated($request, $post);
        $changes = collect($data)->only(['title', 'excerpt', 'content', 'status', 'featured_image', 'meta_title', 'meta_description'])->all();

        if (array_key_exists('slug', $data) && $data['slug'] !== null) {
            $changes['slug'] = Post::uniqueSlug(Str::slug($data['slug']), $post->id);
        }

        if (array_key_exists('status', $data) || array_key_exists('published_at', $data)) {
            $changes['published_at'] = $this->publishedAt($data, $post);
        }

        $post->update($changes);

        if (array_key_exists('terms', $data)) {
            $post->taxonomyTerms()->sync($data['terms'] ?? []);
        }

        return (new PostResource($post->fresh(['postType', 'author', 'taxonomyTerms.taxonomy'])))->withContent();
    }

    public function destroy(int $id): JsonResponse
    {
        $post = Post::findOrFail($id);
        $this->authorize('delete', $post);

        $post->delete();

        return response()->json(['message' => 'Moved to the trash.']);
    }

    protected function list(Request $request, bool $pages): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'type' => ['nullable', 'string', 'max:100'],
            'term' => ['nullable', 'string', 'max:255'],
            'search' => ['nullable', 'string', 'max:200'],
            'status' => ['nullable', Rule::in(['draft', 'published', 'private', 'archived', 'scheduled', 'any'])],
            'sort' => ['nullable', Rule::in(['published_at', '-published_at', 'title', '-title', 'updated_at', '-updated_at'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.(int) config('api.max_per_page')],
        ]);

        $query = $this->baseQuery($request, $pages, $filters['status'] ?? null)
            ->with(['postType', 'author', 'taxonomyTerms.taxonomy'])
            ->when(! $pages && ($filters['type'] ?? null), fn (Builder $q) => $q->whereHas('postType', fn ($t) => $t->where('name', $filters['type'])->orWhere('slug', $filters['type'])))
            ->when($filters['term'] ?? null, fn (Builder $q, $term) => $q->whereHas('taxonomyTerms', fn ($t) => $t->where('slug', $term)))
            ->when($filters['search'] ?? null, fn (Builder $q, $search) => $q->where(fn ($w) => $w
                ->where('title', 'like', '%'.$search.'%')
                ->orWhere('excerpt', 'like', '%'.$search.'%')));

        $sort = $filters['sort'] ?? '-published_at';
        $query->orderBy(ltrim($sort, '-'), str_starts_with($sort, '-') ? 'desc' : 'asc')->orderByDesc('id');

        return PostResource::collection($query->paginate((int) ($filters['per_page'] ?? 15))->withQueryString());
    }

    protected function single(Request $request, string $slug, bool $pages): PostResource
    {
        $post = $this->baseQuery($request, $pages, 'any')
            ->with(['postType', 'author', 'taxonomyTerms.taxonomy'])
            ->where('slug', $slug)
            ->firstOrFail();

        return (new PostResource($post))->withContent();
    }

    /**
     * @return Builder<Post>
     */
    protected function baseQuery(Request $request, bool $pages, ?string $status): Builder
    {
        $query = Post::query()->whereHas('postType', fn ($t) => $pages ? $t->where('name', 'page') : $t->where('name', '!=', 'page'));

        // Unpublished content only for a token whose user may see it.
        $privileged = $request->user() !== null && $request->user()->can('view posts');

        if (! $privileged || $status === null || $status === 'published') {
            return $query->published();
        }

        return match ($status) {
            'any' => $query,
            'scheduled' => $query->where('status', 'published')->where('published_at', '>', now()),
            default => $query->where('status', $status),
        };
    }

    /**
     * @return array<string, mixed>
     */
    protected function validated(Request $request, ?Post $post = null): array
    {
        $required = $post === null ? 'required' : 'sometimes';

        return $request->validate([
            'type' => ['sometimes', 'string', 'max:100'],
            'title' => [$required, 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255', 'regex:/^[a-z0-9-]+$/'],
            'excerpt' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'content' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', Rule::in(['draft', 'published', 'private', 'archived'])],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'featured_image' => ['sometimes', 'nullable', 'string', 'max:1000', 'regex:#^(/|https?://)#i'],
            'meta_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'meta_description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'terms' => ['sometimes', 'array'],
            'terms.*' => ['integer', 'exists:taxonomy_terms,id'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function publishedAt(array $data, ?Post $post): mixed
    {
        if (! empty($data['published_at'])) {
            return $data['published_at'];
        }

        $status = $data['status'] ?? $post?->status;

        if ($status !== 'published') {
            return $post?->published_at;
        }

        return $post->published_at ?? now();
    }
}
