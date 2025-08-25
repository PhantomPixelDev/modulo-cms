<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostType;
use App\Models\TaxonomyTerm;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function __construct()
    {
        // Laravel 12 uses route middleware instead of controller middleware
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Post::with(['postType', 'author', 'taxonomyTerms.taxonomy'])
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

        $posts = $query->paginate(15);

        return Inertia::render('Dashboard', [
            'adminSection' => 'posts',
            'posts' => $posts->through(function ($post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'slug' => $post->slug,
                    'status' => $post->status,
                    'author_id' => $post->author_id,
                    'published_at' => $post->published_at?->format('Y-m-d H:i:s'),
                    'created_at' => $post->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $post->updated_at->format('Y-m-d H:i:s'),
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
            }),
            // Exclude 'page' from selectable post types in the Posts area
            'postTypes' => PostType::where('name', '!=', 'page')->get(),
            'authors' => User::orderBy('name')->get(['id','name']),
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => Post::count(),
                'postTypes' => PostType::count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
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

        // Return empty post data for the create form
        $postData = [
            'id' => null,
            'post_type_id' => $postTypes->first()?->id,
            'title' => '',
            'slug' => '',
            'excerpt' => '',
            'content' => '',
            'status' => 'draft',
            'featured_image' => null,
            'published_at' => null,
            'meta_title' => '',
            'meta_description' => '',
            'parent_id' => null,
            'menu_order' => 0,
            'meta_data' => new \stdClass(),
            'post_type' => $postTypes->first() ? [
                'id' => $postTypes->first()->id,
                'name' => $postTypes->first()->name,
                'label' => $postTypes->first()->label,
            ] : null,
            'author' => [
                'id' => auth()->id(),
                'name' => auth()->user()->name,
            ],
            'taxonomy_terms' => [],
            'selected_terms' => [],
        ];

        return Inertia::render('Dashboard', [
            'adminSection' => 'posts.create',
            'editPost' => $postData,
            'postTypes' => $postTypes,
            'groupedTerms' => $groupedTerms,
            'authors' => $authors,
            'parentsByType' => $parentsByType,
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => Post::count(),
                'postTypes' => PostType::count(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'post_type_id' => 'required|exists:post_types,id',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:posts,slug',
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'status' => 'required|in:draft,published,private,archived',
            'featured_image' => 'nullable|string',
            'taxonomy_terms' => 'array',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'published_at' => 'nullable|date',
            'author_id' => 'nullable|exists:users,id',
            'parent_id' => 'nullable|exists:posts,id',
            'menu_order' => 'nullable|integer',
            'meta_data' => 'nullable|array',
        ]);

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

        $post = Post::create([
            'post_type_id' => $request->post_type_id,
            'author_id' => $request->author_id ?: auth()->id(),
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

        return redirect()->route('dashboard.admin.posts.index')->with('success', 'Post created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Post $post)
    {
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
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => Post::count(),
                'postTypes' => PostType::count(),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Post $post)
    {
        $post->load(['postType', 'author', 'taxonomyTerms.taxonomy']);
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
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => Post::count(),
                'postTypes' => PostType::count(),
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Post $post)
    {
        $request->validate([
            'post_type_id' => 'required|exists:post_types,id',
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:posts,slug,' . $post->id,
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'status' => 'required|in:draft,published,private,archived',
            'featured_image' => 'nullable|string',
            'taxonomy_terms' => 'array',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'published_at' => 'nullable|date',
            'author_id' => 'nullable|exists:users,id',
            'parent_id' => 'nullable|exists:posts,id',
            'menu_order' => 'nullable|integer',
            'meta_data' => 'nullable|array',
        ]);

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

        $post->update([
            'post_type_id' => $request->post_type_id,
            'author_id' => $request->author_id ?: $post->author_id,
            'title' => $request->title,
            // Preserve or update slug: use provided slug if present; otherwise derive from title
            'slug' => Str::slug($request->slug ?: $request->title),
            'excerpt' => $request->excerpt,
            'content' => $request->content,
            'featured_image' => $request->featured_image,
            'status' => $newStatus,
            'published_at' => $publishedAt,
            'meta_title' => $request->meta_title,
            'meta_description' => $request->meta_description,
            'parent_id' => $request->parent_id,
            'menu_order' => $request->menu_order ?? $post->menu_order,
            'meta_data' => $request->meta_data ?? $post->meta_data,
        ]);

        // Sync taxonomy terms
        $post->taxonomyTerms()->sync($request->taxonomy_terms ?? []);

        return redirect()->route('dashboard.admin.posts.index')->with('success', 'Post updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post)
    {
        $post->delete();
        return back()->with('success', 'Post deleted successfully.');
    }
}
