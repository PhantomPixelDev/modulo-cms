<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostType;
use App\Models\TaxonomyTerm;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Post::with(['postType', 'author', 'taxonomyTerms.taxonomy'])
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

        return Inertia::render('dashboard', [
            'adminSection' => 'posts',
            'posts' => $posts,
            'postTypes' => PostType::all(),
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
        $postTypes = PostType::all();
        $taxonomyTerms = TaxonomyTerm::with('taxonomy')->get();
        
        // Group taxonomy terms by taxonomy
        $groupedTerms = $taxonomyTerms->groupBy('taxonomy.name');

        return Inertia::render('dashboard', [
            'adminSection' => 'posts.create',
            'postTypes' => $postTypes,
            'groupedTerms' => $groupedTerms,
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
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'status' => 'required|in:draft,published,private,archived',
            'featured_image' => 'nullable|string',
            'taxonomy_terms' => 'array',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
        ]);

        $post = Post::create([
            'post_type_id' => $request->post_type_id,
            'author_id' => auth()->id(),
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'excerpt' => $request->excerpt,
            'content' => $request->content,
            'featured_image' => $request->featured_image,
            'status' => $request->status,
            'published_at' => $request->status === 'published' ? now() : null,
            'meta_title' => $request->meta_title,
            'meta_description' => $request->meta_description,
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
        
        return Inertia::render('dashboard', [
            'adminSection' => 'posts.show',
            'post' => $post,
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
        $postTypes = PostType::all();
        $taxonomyTerms = TaxonomyTerm::with('taxonomy')->get();
        
        // Group taxonomy terms by taxonomy
        $groupedTerms = $taxonomyTerms->groupBy('taxonomy.name');

        return Inertia::render('dashboard', [
            'adminSection' => 'posts.edit',
            'editPost' => $post,
            'postTypes' => $postTypes,
            'groupedTerms' => $groupedTerms,
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
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'status' => 'required|in:draft,published,private,archived',
            'featured_image' => 'nullable|string',
            'taxonomy_terms' => 'array',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
        ]);

        $post->update([
            'post_type_id' => $request->post_type_id,
            'title' => $request->title,
            'slug' => Str::slug($request->title),
            'excerpt' => $request->excerpt,
            'content' => $request->content,
            'featured_image' => $request->featured_image,
            'status' => $request->status,
            'published_at' => $request->status === 'published' ? now() : null,
            'meta_title' => $request->meta_title,
            'meta_description' => $request->meta_description,
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
