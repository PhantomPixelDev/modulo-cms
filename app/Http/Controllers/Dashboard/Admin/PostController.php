<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PostRequest;
use App\Models\Post;
use App\Models\PostType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PostController extends Controller
{
    public function index(Request $request)
    {
        // Select lighter columns for listing; eager load relations to avoid N+1
        $query = Post::query()
            ->select(['id','post_type_id','author_id','title','slug','status','published_at','menu_order','created_at'])
            ->with(['postType:id,label','author:id,name']);

        // Apply search filter (grouped to not break additional where conditions)
        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%$search%")
                  ->orWhere('slug', 'like', "%$search%");
            });
        }

        // Apply sorting (whitelist sortable columns for safety)
        $sortable = ['created_at','published_at','title','status','menu_order'];
        $sort = in_array($request->input('sort'), $sortable, true) ? $request->input('sort') : 'created_at';
        $direction = $request->input('direction') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sort, $direction);

        // Apply pagination
        $perPage = (int) ($request->input('per_page', 10));
        $posts = $query->paginate($perPage)->appends($request->only(['search','sort','direction','per_page']));

        return Inertia::render('Dashboard/Admin/Posts/Index', [
            'posts' => $posts,
            'postTypes' => PostType::select(['id','label','name'])->orderBy('label')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Admin/Posts/Create', [
            'postTypes' => PostType::all(),
        ]);
    }

    public function store(PostRequest $request)
    {
        $post = Post::create($request->validated());
        return redirect()->route('dashboard.admin.posts.show', $post->id)
                         ->with('success', 'Post created successfully.');
    }

    public function show(Post $post)
    {
        return Inertia::render('Dashboard/Admin/Posts/Show', [
            'post' => $post,
        ]);
    }

    public function edit(Post $post)
    {
        return Inertia::render('Dashboard/Admin/Posts/Edit', [
            'post' => $post,
            'postTypes' => PostType::all(),
        ]);
    }

    public function update(PostRequest $request, Post $post)
    {
        $post->update($request->validated());
        return redirect()->route('dashboard.admin.posts.show', $post->id)
                         ->with('success', 'Post updated successfully.');
    }

    public function destroy(Post $post)
    {
        $post->delete();
        return redirect()->route('dashboard.admin.posts.index')
                         ->with('success', 'Post deleted successfully.');
    }
}
