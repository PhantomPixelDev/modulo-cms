<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Models\Post;
use App\Models\PostType;
use App\Models\TaxonomyTerm;
use App\Models\User;
use App\Models\Locale;
use App\Services\SiteSettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    public function __construct(
        protected SiteSettingsService $settings
    ) {
        $this->middleware('permission:view posts')->only(['index', 'show']);
        $this->middleware('permission:create posts')->only(['create', 'store']);
        $this->middleware('permission:edit posts')->only(['edit', 'update']);
        $this->middleware('permission:delete posts')->only(['destroy']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Post::with(['postType', 'author', 'taxonomyTerms.taxonomy', 'translations'])
            ->whereHas('postType', function ($q) {
                $q->where('name', '!=', 'page');
            })
            ->orderBy('created_at', 'desc');

        // Filter by post type
        if ($request->has('post_type_id')) {
            $query->where('post_type_id', $request->post_type_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by author
        if ($request->has('author_id')) {
            $query->where('author_id', $request->author_id);
        }

        $perPage = $this->settings->get('posts_per_page', 15);
        $posts = $query->paginate($perPage);

        return Inertia::render('Dashboard', [
            'adminSection' => 'posts',
            'posts' => $posts->through(fn ($post) => $this->formatPostForList($post)),
            // Exclude 'page' from selectable post types in the Posts area
            'postTypes' => PostType::where('name', '!=', 'page')->get(),
            'authors' => User::orderBy('name')->get(['id','name']),
            'locales' => Locale::getActive(),
        ]);
    }

    /**
     * Display a listing of posts by post type.
     */
    public function indexByType(Request $request, string $postTypeSlug)
    {
        // Find the post type by slug
        $postType = PostType::where('slug', $postTypeSlug)->firstOrFail();
        
        // Check permission for this post type
        $this->authorize('view', Post::class);

        $query = Post::with(['postType', 'author', 'taxonomyTerms.taxonomy', 'translations'])
            ->where('post_type_id', $postType->id)
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by author
        if ($request->has('author_id')) {
            $query->where('author_id', $request->author_id);
        }

        $perPage = $this->settings->get('posts_per_page', 15);
        $posts = $query->paginate($perPage);

        return Inertia::render('Dashboard', [
            'adminSection' => 'posts',
            'posts' => $posts->through(fn ($post) => $this->formatPostForList($post)),
            'postTypes' => PostType::where('name', '!=', 'page')->get(),
            'currentPostType' => $postType,
            'authors' => User::orderBy('name')->get(['id','name']),
            'locales' => Locale::getActive(),
        ]);
    }

    private function formatPostForList(Post $post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'status' => $post->status,
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
        $authors = User::orderBy('name')->get(['id','name']);

        // Build parentsByType map for hierarchical selection
        $allPosts = Post::orderBy('title')->get(['id','title','post_type_id']);
        $parentsByType = $allPosts->groupBy('post_type_id')->map(function ($items) {
            return $items->map(function ($p) {
                return ['id' => $p->id, 'title' => $p->title];
            })->values();
        });
        
        // Group taxonomy terms by taxonomy
        $groupedTerms = $taxonomyTerms->groupBy('taxonomy.name');

        $defaultStatus = \App\Models\SiteSetting::get('default_post_status', 'draft');
        $defaultTypeName = \App\Models\SiteSetting::get('default_post_type', 'post');
        $defaultType = $postTypes->where('name', $defaultTypeName)->first() ?: $postTypes->first();
        $currentUser = $request->user();

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
            'meta_data' => new \stdClass(),
            'post_type' => $defaultType ? [
                'id' => $defaultType->id,
                'name' => $defaultType->name,
                'label' => $defaultType->label,
            ] : null,
            'author' => [
                'id' => $currentUser?->id,
                'name' => $currentUser?->name,
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
                $publishedAt = \Carbon\Carbon::parse($request->published_at);
            } catch (\Exception $e) {
                $publishedAt = null;
            }
        } else {
            $publishedAt = $request->status === 'published' ? now() : null;
        }

        DB::transaction(function () use ($request, $publishedAt) {
            $authorId = $request->author_id ?: $request->user()?->id;

            $post = Post::create([
                'post_type_id' => $request->post_type_id,
                'author_id' => $authorId,
                'title' => $request->title,
                // Use provided slug if present; otherwise derive from title
                'slug' => Str::slug($request->slug ?: $request->title),
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
        });

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
                    ]
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
        $authors = User::orderBy('name')->get(['id','name']);
        // Build parentsByType map
        $allPosts = Post::orderBy('title')->get(['id','title','post_type_id']);
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
                    ]
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
                $publishedAt = \Carbon\Carbon::parse($request->published_at);
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
                'slug' => Str::slug($request->slug ?: $request->title),
                'excerpt' => $request->excerpt,
                'content' => $request->content,
                'meta_title' => $request->meta_title,
                'meta_description' => $request->meta_description,
            ]);
        }

        DB::transaction(function () use ($post, $baseUpdate, $request, $locale) {
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
        });

        return redirect()->route('dashboard.admin.posts.index')->with('success', 'Post updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post)
    {
        $this->authorize('delete', $post);
        $post->delete();
        return back()->with('success', 'Post deleted successfully.');
    }
}
