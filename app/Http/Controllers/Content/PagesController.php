<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostType;
use App\Models\User;
use App\Rules\CanPublish;
use App\Services\SiteSettingsService;
use App\Support\ContentListFilters;
use App\Support\CustomFields;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PagesController extends Controller
{
    protected ?PostType $pageType = null;

    public function __construct(
        protected SiteSettingsService $settings
    ) {
        // Pages are posts of the "page" type and share their permissions
        $this->middleware('permission:view posts')->only(['index', 'show']);
        $this->middleware('permission:create posts')->only(['create', 'store']);
        $this->middleware('permission:edit posts')->only(['edit', 'update']);
        $this->middleware('permission:delete posts')->only(['destroy']);
    }

    private function resolvePageType(): PostType
    {
        if ($this->pageType) {
            return $this->pageType;
        }
        $pageType = PostType::where('name', 'page')->first()
            ?? PostType::where('slug', 'pages')->first()
            ?? PostType::where(function ($q) {
                $q->whereNull('route_prefix')
                    ->orWhere('route_prefix', '')
                    ->orWhere('route_prefix', '/');
            })->first();

        if (! $pageType) {
            // Auto-create a reasonable default 'page' post type
            $pageType = PostType::create([
                'name' => 'page',
                'label' => 'Page',
                'plural_label' => 'Pages',
                'description' => 'Static pages',
                'has_taxonomies' => false,
                'has_featured_image' => true,
                'has_excerpt' => false,
                'has_comments' => false,
                'supports' => ['title', 'editor', 'thumbnail'],
                'taxonomies' => [],
                'slug' => 'pages',
                // No route_prefix so single pages live at root-level `/{slug}`
                'route_prefix' => null,
                'is_public' => true,
                'is_hierarchical' => true,
                'menu_icon' => 'file',
                'menu_position' => 6,
            ]);
        }

        return $this->pageType = $pageType;
    }

    public function index(Request $request)
    {
        $pageType = $this->resolvePageType();
        $filters = ContentListFilters::fromRequest($request);
        unset($filters['post_type_id']);

        $pages = ContentListFilters::apply(Post::with(['author', 'postType', 'translations']), $filters)
            ->where('post_type_id', $pageType->id)
            ->orderByDesc('created_at')
            ->paginate((int) $this->settings->get('posts_per_page', 15))
            ->withQueryString()
            ->through(function (Post $page) {
                return [
                    'id' => $page->id,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'status' => $page->status,
                    'published_at' => $this->settings->formatDateTime($page->published_at),
                    'is_scheduled' => $page->status === 'published' && $page->published_at?->isFuture(),
                    'created_at' => $this->settings->formatDateTime($page->created_at),
                    'updated_at' => $this->settings->formatDateTime($page->updated_at),
                    'author' => $page->author ? [
                        'id' => $page->author->id,
                        'name' => $page->author->name,
                    ] : null,
                    'translations' => $page->translations->pluck('locale')->map(fn ($locale) => ['locale' => $locale])->values(),
                    'featured_image' => $page->featured_image,
                ];
            });

        return Inertia::render('Dashboard', [
            'adminSection' => 'pages',
            'posts' => $pages,
            'postTypes' => [],
            'authors' => User::orderBy('name')->get(['id', 'name']),
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        $defaultStatus = $this->settings->get('default_post_status', 'draft');

        return Inertia::render('Dashboard', [
            'adminSection' => 'pages.create',
            'defaultStatus' => $defaultStatus,
        ] + $this->formProps());
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules($request), [], CustomFields::attributes($this->resolvePageType()));

        // Ensure content is properly formatted as JSON string
        if (is_array($data['content']) || is_object($data['content'])) {
            $data['content'] = json_encode($data['content'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        $pageType = $this->resolvePageType();

        // A chosen date wins (a future one schedules the page); publishing without one means now
        $publishedAt = $data['published_at'] ?? (($data['status'] ?? null) === 'published' ? now() : null);

        // Generate slug if not provided
        $data['slug'] = Post::uniqueSlug(Str::slug(empty($data['slug']) ? $data['title'] : $data['slug']));

        // Create the page/post
        $page = Post::create([
            'title' => $data['title'],
            'slug' => $data['slug'],
            'content' => $data['content'],
            'excerpt' => $data['excerpt'] ?? '',
            'status' => $data['status'],
            'post_type_id' => $pageType->id,
            'author_id' => $data['author_id'] ?? auth()->id(),
            'published_at' => $publishedAt,
            'featured_image' => $data['featured_image'] ?? null,
            'meta_title' => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
            'parent_id' => $data['parent_id'] ?? null,
            'meta_data' => $data['meta_data'] ?? [],
        ]);

        return redirect()->route('dashboard.admin.pages.index')
            ->with('success', __('dashboard.pages.messages.created'));
    }

    public function edit(Post $page)
    {
        // Ensure it's a page
        $pageType = $this->resolvePageType();
        abort_unless($page->post_type_id === $pageType->id, 404);

        return Inertia::render('Dashboard', [
            'adminSection' => 'pages.edit',
            'post' => $page,
        ] + $this->formProps($page));
    }

    public function update(Request $request, Post $page)
    {
        $pageType = $this->resolvePageType();
        abort_unless($page->post_type_id === $pageType->id, 404);

        $data = $request->validate($this->rules($request, $page), [], CustomFields::attributes($this->resolvePageType()));

        // Ensure content is properly formatted as JSON string
        if (is_array($data['content']) || is_object($data['content'])) {
            $data['content'] = json_encode($data['content'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        // A chosen date wins; publishing without one keeps the first publish date, or now
        $data['published_at'] = $data['published_at']
            ?? (($data['status'] ?? null) === 'published' ? ($page->published_at ?? now()) : $page->published_at);

        // Generate slug if not provided
        $data['slug'] = Post::uniqueSlug(Str::slug(empty($data['slug']) ? $data['title'] : $data['slug']), $page->id);

        // Update the page
        $page->update([
            'title' => $data['title'],
            'slug' => $data['slug'],
            'content' => $data['content'],
            'excerpt' => $data['excerpt'] ?? '',
            'status' => $data['status'],
            'published_at' => $data['published_at'] ?? $page->published_at,
            'featured_image' => $data['featured_image'] ?? $page->featured_image,
            'meta_title' => $data['meta_title'] ?? $page->meta_title,
            'meta_description' => $data['meta_description'] ?? $page->meta_description,
            'author_id' => $data['author_id'] ?? $page->author_id,
            'parent_id' => array_key_exists('parent_id', $data) ? $data['parent_id'] : $page->parent_id,
            'meta_data' => $data['meta_data'] ?? $page->meta_data,
        ]);

        return redirect()->route('dashboard.admin.pages.index')
            ->with('success', __('dashboard.pages.messages.updated'));
    }

    /**
     * @return array<string, mixed>
     */
    protected function rules(Request $request, ?Post $page = null): array
    {
        return [
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:posts,slug'.($page ? ','.$page->id : ''),
            'status' => ['required', 'in:draft,published,private,archived', new CanPublish($request->user(), $page, isPage: true)],
            'content' => 'required', // Content can be string or array
            'excerpt' => 'nullable|string',
            'featured_image' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'author_id' => 'nullable|exists:users,id',
            'published_at' => 'nullable|date',
            'parent_id' => ['nullable', 'integer', Rule::in($this->possibleParents($page)->pluck('id')->all())],
            'meta_data' => 'nullable|array',
        ] + CustomFields::valueRules($this->resolvePageType());
    }

    /**
     * Pages another page can sit under: any page but itself and the pages
     * below it, which would make a loop.
     *
     * @return Collection<int, Post>
     */
    protected function possibleParents(?Post $page = null): Collection
    {
        $pages = Post::where('post_type_id', $this->resolvePageType()->id)->orderBy('title')->get(['id', 'title', 'parent_id']);
        if (! $page) {
            return $pages;
        }

        $excluded = [$page->id];
        do {
            $before = count($excluded);
            $excluded = array_values(array_unique(array_merge($excluded, $pages->whereIn('parent_id', $excluded)->pluck('id')->all())));
        } while (count($excluded) > $before);

        return $pages->whereNotIn('id', $excluded)->values();
    }

    /**
     * What the page form needs besides the page itself.
     *
     * @return array<string, mixed>
     */
    protected function formProps(?Post $page = null): array
    {
        return [
            'pageParents' => $this->possibleParents($page)->map->only(['id', 'title'])->values(),
            'pageFields' => (array) $this->resolvePageType()->fields,
            'authors' => User::orderBy('name')->get(['id', 'name']),
        ];
    }

    public function destroy(Post $page)
    {
        $pageType = $this->resolvePageType();
        abort_unless($page->post_type_id === $pageType->id, 404);
        $page->delete();

        return redirect()->route('dashboard.admin.pages.index')
            ->with('success', __('dashboard.pages.messages.trashed'));
    }
}
