<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\PostType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class PostTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $postTypes = PostType::orderBy('menu_position')->paginate(15);

        return Inertia::render('dashboard', [
            'adminSection' => 'post-types',
            'postTypes' => $postTypes,
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => \App\Models\Post::count(),
                'postTypes' => PostType::count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('dashboard', [
            'adminSection' => 'post-types.create',
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => \App\Models\Post::count(),
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
            'name' => 'required|string|max:255|unique:post_types',
            'label' => 'required|string|max:255',
            'plural_label' => 'required|string|max:255',
            'description' => 'nullable|string',
            'has_taxonomies' => 'boolean',
            'has_featured_image' => 'boolean',
            'has_excerpt' => 'boolean',
            'has_comments' => 'boolean',
            'supports' => 'array',
            'taxonomies' => 'array',
            'is_public' => 'boolean',
            'is_hierarchical' => 'boolean',
            'menu_icon' => 'nullable|string',
            'menu_position' => 'integer',
        ]);

        PostType::create([
            'name' => $request->name,
            'label' => $request->label,
            'plural_label' => $request->plural_label,
            'description' => $request->description,
            'has_taxonomies' => $request->has_taxonomies ?? true,
            'has_featured_image' => $request->has_featured_image ?? true,
            'has_excerpt' => $request->has_excerpt ?? true,
            'has_comments' => $request->has_comments ?? true,
            'supports' => $request->supports ?? ['title', 'editor'],
            'taxonomies' => $request->taxonomies ?? [],
            'slug' => Str::slug($request->name),
            'is_public' => $request->is_public ?? true,
            'is_hierarchical' => $request->is_hierarchical ?? false,
            'menu_icon' => $request->menu_icon,
            'menu_position' => $request->menu_position ?? 5,
        ]);

        return redirect()->route('dashboard.admin.post-types.index')->with('success', 'Post type created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(PostType $postType)
    {
        $postType->load('posts');
        
        return Inertia::render('dashboard', [
            'adminSection' => 'post-types.show',
            'postType' => $postType,
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => \App\Models\Post::count(),
                'postTypes' => PostType::count(),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(PostType $postType)
    {
        return Inertia::render('dashboard', [
            'adminSection' => 'post-types.edit',
            'editPostType' => $postType,
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => \App\Models\Post::count(),
                'postTypes' => PostType::count(),
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PostType $postType)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:post_types,name,' . $postType->id,
            'label' => 'required|string|max:255',
            'plural_label' => 'required|string|max:255',
            'description' => 'nullable|string',
            'has_taxonomies' => 'boolean',
            'has_featured_image' => 'boolean',
            'has_excerpt' => 'boolean',
            'has_comments' => 'boolean',
            'supports' => 'array',
            'taxonomies' => 'array',
            'is_public' => 'boolean',
            'is_hierarchical' => 'boolean',
            'menu_icon' => 'nullable|string',
            'menu_position' => 'integer',
        ]);

        $postType->update([
            'name' => $request->name,
            'label' => $request->label,
            'plural_label' => $request->plural_label,
            'description' => $request->description,
            'has_taxonomies' => $request->has_taxonomies ?? true,
            'has_featured_image' => $request->has_featured_image ?? true,
            'has_excerpt' => $request->has_excerpt ?? true,
            'has_comments' => $request->has_comments ?? true,
            'supports' => $request->supports ?? ['title', 'editor'],
            'taxonomies' => $request->taxonomies ?? [],
            'slug' => Str::slug($request->name),
            'is_public' => $request->is_public ?? true,
            'is_hierarchical' => $request->is_hierarchical ?? false,
            'menu_icon' => $request->menu_icon,
            'menu_position' => $request->menu_position ?? 5,
        ]);

        return redirect()->route('dashboard.admin.post-types.index')->with('success', 'Post type updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PostType $postType)
    {
        // Prevent deleting default post types
        if (in_array($postType->name, ['post', 'page'])) {
            return back()->with('error', 'Cannot delete default post types.');
        }

        $postType->delete();
        return back()->with('success', 'Post type deleted successfully.');
    }
}
