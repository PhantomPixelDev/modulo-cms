<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\EditorDraft;
use App\Models\Locale;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EditorDraftController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $drafts = EditorDraft::where('user_id', $request->user()?->id)->latest('updated_at')->get()
            ->filter(fn (EditorDraft $draft) => $this->allowed($request, $draft));

        return response()->json(['drafts' => $drafts->values()]);
    }

    public function show(Request $request, string $draft): JsonResponse
    {
        return response()->json(['draft' => $this->owned($request, $draft)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['nullable', 'uuid'], 'revision' => ['required', 'integer', 'min:0'],
            'post_id' => ['nullable', 'integer', 'exists:posts,id'],
            'content_type' => ['required', Rule::in(['post', 'page'])],
            'locale' => ['required', 'string', Rule::in(Locale::getActive()->pluck('code')->all())],
            'payload' => ['required', 'array:title,slug,content,excerpt,status,post_type_id,parent_id,author_id,featured_image,published_at,meta_data,taxonomy_terms,meta_title,meta_description'],
            'payload.title' => ['nullable', 'string', 'max:255'],
            'payload.content' => ['nullable', 'string', 'max:2000000'],
            'payload.excerpt' => ['nullable', 'string', 'max:65535'],
            'payload.slug' => ['nullable', 'string', 'max:255'],
            'payload.status' => ['nullable', Rule::in(['draft', 'published', 'private', 'archived'])],
            'payload.post_type_id' => ['nullable', 'integer'],
            'payload.parent_id' => ['nullable', 'integer'],
            'payload.author_id' => ['nullable', 'integer'],
            'payload.featured_image' => ['nullable', 'string', 'max:2048'],
            'payload.published_at' => ['nullable', 'string', 'max:40'],
            'payload.meta_title' => ['nullable', 'string', 'max:255'],
            'payload.meta_description' => ['nullable', 'string', 'max:500'],
            'payload.meta_data' => ['nullable', 'array'],
            'payload.taxonomy_terms' => ['nullable', 'array'],
        ]);
        foreach (['title', 'slug', 'content', 'excerpt', 'published_at', 'meta_title', 'meta_description'] as $field) {
            if (array_key_exists($field, $data['payload'])) {
                $data['payload'][$field] = (string) ($data['payload'][$field] ?? '');
            }
        }
        $id = $data['id'] ?? (string) Str::uuid();
        $draft = isset($data['id']) ? $this->owned($request, $id) : new EditorDraft([
            'id' => $id, 'user_id' => $request->user()?->id,
            'post_id' => $data['post_id'] ?? null, 'content_type' => $data['content_type'], 'locale' => $data['locale'],
        ]);
        abort_unless($this->allowed($request, $draft), 403);
        abort_unless($draft->post_id === ($data['post_id'] ?? null)
            && $draft->content_type === $data['content_type'] && $draft->locale === $data['locale'], 422);

        if ($draft->exists) {
            // Compare and swap is atomic even when two tabs save simultaneously.
            $updated = EditorDraft::whereKey($id)->where('revision', $data['revision'])->update([
                'payload' => json_encode($data['payload'], JSON_THROW_ON_ERROR),
                'revision' => $data['revision'] + 1, 'updated_at' => now(),
            ]);
            if (! $updated) {
                return response()->json(['message' => __('This draft changed in another tab. Reload its saved version before retrying.'), 'draft' => $draft->fresh()], 409);
            }
        } else {
            abort_unless($data['revision'] === 0, 409);
            $draft->fill(['payload' => $data['payload'], 'revision' => 1])->save();
        }

        return response()->json(['draft' => $draft->fresh()]);
    }

    public function destroy(Request $request, string $draft): JsonResponse
    {
        $this->owned($request, $draft)->delete();

        return response()->json(['ok' => true]);
    }

    private function owned(Request $request, string $id): EditorDraft
    {
        $draft = EditorDraft::where('user_id', $request->user()?->id)->findOrFail($id);
        abort_unless($this->allowed($request, $draft), 403);

        return $draft;
    }

    private function allowed(Request $request, EditorDraft $draft): bool
    {
        if ($draft->post_id) {
            $post = Post::find($draft->post_id);
            if (! $post || ($post->postType?->name === 'page') !== ($draft->content_type === 'page')) {
                return false;
            }
        }

        return (bool) $request->user()?->can(($draft->post_id ? 'edit ' : 'create ').($draft->content_type === 'page' ? 'pages' : 'posts'));
    }
}
