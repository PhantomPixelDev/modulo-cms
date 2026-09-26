<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Locale;
use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use App\Models\TaxonomyTerm;
use App\Models\User;
use App\Presenters\PostPresenter;
use App\Rules\CanPublish;
use App\Services\SiteSettingsService;
use App\Support\ContentListFilters;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PostController extends Controller
{
    public function __construct(
        protected SiteSettingsService $settings
    ) {
        $this->middleware('permission:view posts')->only(['index', 'show', 'bulk']);
        $this->middleware('permission:create posts')->only(['create', 'store']);
        $this->middleware('permission:edit posts')->only(['edit', 'update']);
        $this->middleware('permission:delete posts')->only(['destroy']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        return $this->renderList($request, Post::whereHas('postType', fn ($q) => $q->where('name', '!=', 'page')));
    }

    /**
     * Display a listing of posts by post type.
     */
    public function indexByType(Request $request, string $postTypeSlug)
    {
        $postType = PostType::where('slug', $postTypeSlug)->firstOrFail();

        $this->authorize('view', Post::class);

        return $this->renderList($request, Post::where('post_type_id', $postType->id), $postType);
    }

    /**
     * The list screen, with its search, filters and pagination.
     *
     * @param  Builder<Post>  $query
     */
    protected function renderList(Request $request, $query, ?PostType $postType = null)
    {
        $filters = ContentListFilters::fromRequest($request);
        ContentListFilters::apply($query, $filters);

        $posts = $query->with(['postType', 'author', 'taxonomyTerms.taxonomy', 'translations'])
            ->orderByDesc('created_at')
            ->paginate((int) $this->settings->get('posts_per_page', 15))
            ->withQueryString();

        return Inertia::render('Dashboard', [
            'adminSection' => 'posts',
            'posts' => $posts->through(fn ($post) => $this->formatPostForList($post)),
            // Exclude 'page' from selectable post types in the Posts area
            'postTypes' => PostType::where('name', '!=', 'page')->get(),
            'currentPostType' => $postType,
            'authors' => User::orderBy('name')->get(['id', 'name']),
            'locales' => Locale::getActive(),
            'filters' => $filters,
        ]);
    }

    /**
     * Publish, unpublish or trash several posts at once. Each post is checked
     * against the same permissions as editing it one by one; the ones the
     * user may not touch are skipped and counted.
     */
    public function bulk(Request $request)
    {
        $data = $request->validate([
            'action' => ['required', 'in:publish,draft,trash'],
            'ids' => ['required', 'array', 'max:200'],
            'ids.*' => ['integer'],
        ]);

        $user = $request->user();
        $action = (string) $data['action'];
        $done = 0;
        $skipped = 0;

        foreach (Post::whereIn('id', $data['ids'])->get() as $post) {
            $allowed = match ($action) {
                'trash' => $user->can('delete', $post),
                'publish' => $user->can('update', $post) && $user->can(CanPublish::permissionFor($post->postType?->name === 'page')),
                default => $user->can('update', $post),
            };

            if (! $allowed) {
                $skipped++;

                continue;
            }

            match ($action) {
                'trash' => $post->delete(),
                'publish' => $post->update(['status' => 'published', 'published_at' => $post->published_at ?? now()]),
                default => $post->update(['status' => 'draft']),
            };
            $done++;
        }

        $message = trans_choice(
            "dashboard.posts.bulk.done_{$action}",
            $done,
            ['count' => $done],
        );

        if ($skipped > 0) {
            $message .= ' '.trans_choice('dashboard.posts.bulk.skipped', $skipped, ['count' => $skipped]);
        }

        return back()->with($skipped > 0 ? 'warning' : 'success', $message);
    }

    private function formatPostForList(Post $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'status' => $post->status,
            // Published, but with a date still to come: goes live then.
            'is_scheduled' => $post->status === 'published' && $post->published_at?->isFuture() === true,
            'author_id' => $post->author_id,
            'published_at' => $this->settings->formatDateTime($post->published_at),
            'created_at' => $this->settings->formatDateTime($post->created_at),
            'updated_at' => $this->settings->formatDateTime($post->updated_at),
            'post_type' => [
                'id' => $post->postType->id,
                'name' => $post->postType->name,
                'label' => $post->postType->label,
            ],
            'author' => $post->author ? [
                'id' => $post->author->id,
                'name' => $post->author->name,
            ] : null,
            'taxonomy_terms' => $post->taxonomyTerms->map(fn ($term) => [
                'id' => $term->id,
                'name' => $term->name,
                'taxonomy' => [
                    'id' => $term->taxonomy->id,
                    'name' => $term->taxonomy->name,
                ],
            ]),
            'translations' => $post->translations->map(fn ($translation) => [
                'id' => $translation->id,
                'locale' => $translation->locale,
            ]),
        ];
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $this->authorize('create', Post::class);
        // Exclude 'page' from Posts create form options
        $postTypes = PostType::where('name', '!=', 'page')->get();
        $taxonomyTerms = TaxonomyTerm::with('taxonomy')->get();
        $authors = User::orderBy('name')->get(['id', 'name']);

        // Build parentsByType map for hierarchical selection
        $allPosts = Post::orderBy('title')->get(['id', 'title', 'post_type_id']);
        $parentsByType = $allPosts->groupBy('post_type_id')->map(function ($items) {
            return $items->map(function ($p) {
                return ['id' => $p->id, 'title' => $p->title];
            })->values();
        });

        // Group taxonomy terms by taxonomy
        $groupedTerms = $taxonomyTerms->groupBy('taxonomy.name');

        $defaultStatus = SiteSetting::get('default_post_status', 'draft');
        $defaultTypeName = SiteSetting::get('default_post_type', 'post');
        $defaultType = $postTypes->where('name', $defaultTypeName)->first() ?: $postTypes->first();

        // Return empty post data for the create form
        $postData = [
            'id' => null,
            'post_type_id' => $defaultType?->id,
            'title' => '',
            'slug' => '',
            'excerpt' => '',
            'content' => '',
            'status' => $defaultStatus,
            'featured_image' => null,
            'published_at' => null,
            'meta_title' => '',
            'meta_description' => '',
            'parent_id' => null,
            'menu_order' => 0,
            'meta_data' => new \stdClass,
            'post_type' => $defaultType ? [
                'id' => $defaultType->id,
                'name' => $defaultType->name,
                'label' => $defaultType->label,
            ] : null,
            'author' => [
                'id' => auth()->id(),
                'name' => auth()->user()->name,
            ],
            'taxonomy_terms' => [],
            'selected_terms' => [],
        ];

        $currentLocale = $request->query('locale', Locale::getDefault()?->code ?? 'en');

        return Inertia::render('Dashboard', [
            'adminSection' => 'posts.create',
            'editPost' => $postData,
            'postTypes' => $postTypes,
            'groupedTerms' => $groupedTerms,
            'authors' => $authors,
            'parentsByType' => $parentsByType,
            'locales' => Locale::getActive(),
            'currentLocale' => $currentLocale,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePostRequest $request)
    {

        // Determine published_at
        $publishedAt = null;
        if ($request->filled('published_at')) {
            try {
                $publishedAt = Carbon::parse($request->published_at);
            } catch (\Exception $e) {
                $publishedAt = null;
            }
        } else {
            $publishedAt = $request->status === 'published' ? now() : null;
        }

        $post = Post::create([
            'post_type_id' => $request->post_type_id,
            'author_id' => $request->author_id ?: auth()->id(),
            'title' => $request->title,
            // Use provided slug if present; otherwise derive from title
            'slug' => Post::uniqueSlug(Str::slug($request->slug ?: $request->title)),
            'excerpt' => $request->excerpt,
            'content' => $request->content,
            'featured_image' => $request->featured_image,
            'status' => $request->status,
            'published_at' => $publishedAt,
            'meta_title' => $request->meta_title,
            'meta_description' => $request->meta_description,
            'parent_id' => $request->parent_id,
            'menu_order' => $request->menu_order ?? 0,
            'meta_data' => $request->meta_data ?? [],
        ]);

        // Attach taxonomy terms
        if ($request->taxonomy_terms) {
            $post->taxonomyTerms()->attach($request->taxonomy_terms);
        }

        return redirect()->route('dashboard.admin.posts.index')->with('success', 'Post created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Post $post)
    {
        $this->authorize('view', $post);
        $post->load(['postType', 'author', 'taxonomyTerms.taxonomy']);

        $postData = [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'excerpt' => $post->excerpt,
            'content' => $post->content,
            'content_html' => app(PostPresenter::class)->renderContent($post),
            'status' => $post->status,
            'featured_image' => $post->featured_image,
            'published_at' => $post->published_at?->format('Y-m-d H:i:s'),
            'created_at' => $post->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $post->updated_at->format('Y-m-d H:i:s'),
            'meta_title' => $post->meta_title,
            'meta_description' => $post->meta_description,
            'parent_id' => $post->parent_id,
            'menu_order' => $post->menu_order,
            'meta_data' => $post->meta_data,
            'post_type' => [
                'id' => $post->postType->id,
                'name' => $post->postType->name,
                'label' => $post->postType->label,
            ],
            'author' => $post->author ? [
                'id' => $post->author->id,
                'name' => $post->author->name,
            ] : null,
            'taxonomy_terms' => $post->taxonomyTerms->map(function ($term) {
                return [
                    'id' => $term->id,
                    'name' => $term->name,
                    'taxonomy' => [
                        'id' => $term->taxonomy->id,
                        'name' => $term->taxonomy->name,
                    ],
                ];
            }),
        ];

        return Inertia::render('Dashboard', [
            'adminSection' => 'posts.show',
            'post' => $postData,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, Post $post)
    {
        $this->authorize('update', $post);
        $post->load(['postType', 'author', 'taxonomyTerms.taxonomy', 'translations']);
        $currentLocale = $request->query('locale', Locale::getDefault()?->code ?? 'en');
        $translation = $post->translations->firstWhere('locale', $currentLocale);
        // Exclude 'page' from Posts edit form options
        $postTypes = PostType::where('name', '!=', 'page')->get();
        $taxonomyTerms = TaxonomyTerm::with('taxonomy')->get();
        $authors = User::orderBy('name')->get(['id', 'name']);
        // Build parentsByType map
        $allPosts = Post::orderBy('title')->get(['id', 'title', 'post_type_id']);
        $parentsByType = $allPosts->groupBy('post_type_id')->map(function ($items) use ($post) {
            return $items->filter(fn ($p) => $p->id !== $post->id)->map(function ($p) {
                return ['id' => $p->id, 'title' => $p->title];
            })->values();
        });

        // Group taxonomy terms by taxonomy
        $groupedTerms = $taxonomyTerms->groupBy('taxonomy.name');

        $postData = [
            'id' => $post->id,
            'post_type_id' => $post->post_type_id,
            'title' => $translation?->title ?? $post->title,
            'slug' => $translation?->slug ?? $post->slug,
            'excerpt' => $translation?->excerpt ?? $post->excerpt,
            'content' => $translation?->content ?? $post->content,
            'status' => $post->status,
            'featured_image' => $post->featured_image,
            'published_at' => $post->published_at?->format('Y-m-d H:i:s'),
            'created_at' => $post->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $post->updated_at->format('Y-m-d H:i:s'),
            'meta_title' => $translation?->seo_title ?? $post->meta_title,
            'meta_description' => $translation?->seo_description ?? $post->meta_description,
            'post_type' => [
                'id' => $post->postType->id,
                'name' => $post->postType->name,
                'label' => $post->postType->label,
            ],
            'author' => $post->author ? [
                'id' => $post->author->id,
                'name' => $post->author->name,
            ] : null,
            'taxonomy_terms' => $post->taxonomyTerms->map(function ($term) {
                return [
                    'id' => $term->id,
                    'name' => $term->name,
                    'taxonomy' => [
                        'id' => $term->taxonomy->id,
                        'name' => $term->taxonomy->name,
                    ],
                ];
            }),
            'selected_terms' => $post->taxonomyTerms->pluck('id')->toArray(),
        ];

        return Inertia::render('Dashboard', [
            'adminSection' => 'posts.edit',
            'editPost' => $postData,
            'postTypes' => $postTypes,
            'groupedTerms' => $groupedTerms,
            'authors' => $authors,
            'parentsByType' => $parentsByType,
            'locales' => Locale::getActive(),
            'currentLocale' => $currentLocale,
            'translation' => $translation,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePostRequest $request, Post $post)
    {
        $defaultLocale = Locale::getDefault()?->code ?? 'en';
        $locale = $request->input('locale', $defaultLocale);
        $isDefaultLocale = $locale === $defaultLocale;

        // Determine published_at based on input or status transition
        $newStatus = $request->status;
        $publishedAt = $post->published_at;
        if ($request->filled('published_at')) {
            try {
                $publishedAt = Carbon::parse($request->published_at);
            } catch (\Exception $e) {
                // ignore parse error, keep previous
            }
        } else {
            if ($post->status !== 'published' && $newStatus === 'published') {
                $publishedAt = now();
            } elseif ($post->status === 'published' && $newStatus !== 'published') {
                $publishedAt = null;
            }
        }

        $baseUpdate = [
            'post_type_id' => $request->post_type_id,
            'author_id' => $request->author_id ?: $post->author_id,
            'featured_image' => $request->featured_image,
            'status' => $newStatus,
            'published_at' => $publishedAt,
            'parent_id' => $request->parent_id,
            'menu_order' => $request->menu_order ?? $post->menu_order,
            'meta_data' => $request->meta_data ?? $post->meta_data,
        ];

        if ($isDefaultLocale) {
            $baseUpdate = array_merge($baseUpdate, [
                'title' => $request->title,
                'slug' => Post::uniqueSlug(Str::slug($request->slug ?: $request->title), $post->id),
                'excerpt' => $request->excerpt,
                'content' => $request->content,
                'meta_title' => $request->meta_title,
                'meta_description' => $request->meta_description,
            ]);
        }

        $post->update($baseUpdate);

        // Sync taxonomy terms
        $post->taxonomyTerms()->sync($request->taxonomy_terms ?? []);

        // Update translation data for the selected locale
        $post->setTranslation($locale, [
            'title' => $request->title,
            'slug' => Str::slug($request->slug ?: $request->title),
            'excerpt' => $request->excerpt,
            'content' => $request->content,
            'seo_title' => $request->meta_title,
            'seo_description' => $request->meta_description,
        ]);

        return redirect()->route('dashboard.admin.posts.index')->with('success', 'Post updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post)
    {
        $this->authorize('delete', $post);
        $post->delete();

        return back()->with('success', 'Post moved to the trash.');
    }
}
