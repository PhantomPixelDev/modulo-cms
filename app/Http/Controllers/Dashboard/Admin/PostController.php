<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PostRequest;
use App\Models\Post;
use App\Models\PostType;
use App\Models\Locale;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PostController extends Controller
{
    public function index(Request $request)
    {
        // Select lighter columns for listing; eager load relations to avoid N+1
        $query = Post::query()
            ->select(['id','post_type_id','author_id','title','slug','status','published_at','menu_order','created_at'])
            ->with(['postType:id,label','author:id,name','translations:id,post_id,locale']);

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
            'locales' => Locale::getActive(),
        ]);
    }

    public function create(Request $request)
    {
        $locale = $request->query('locale', Locale::getDefault()?->code ?? 'en');
        
        return Inertia::render('Dashboard/Admin/Posts/Create', [
            'postTypes' => PostType::all(),
            'locales' => Locale::getActive(),
            'currentLocale' => $locale,
        ]);
    }

    public function store(PostRequest $request)
    {
        $validated = $request->validated();
        $locale = $request->input('locale', Locale::getDefault()?->code ?? 'en');
        
        // Extract translation fields
        $translationFields = [
            'title' => $validated['title'] ?? '',
            'slug' => $validated['slug'] ?? '',
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $validated['content'] ?? null,
            'seo_title' => $validated['meta_title'] ?? null,
            'seo_description' => $validated['meta_description'] ?? null,
        ];
        
        // Remove translation fields from main post data
        unset($validated['title'], $validated['slug'], $validated['excerpt'], $validated['content']);
        
        $post = Post::create($validated);
        
        // Create the translation
        $post->setTranslation($locale, $translationFields);
        
        return redirect()->route('dashboard.admin.posts.show', $post->id)
                         ->with('success', 'Post created successfully.');
    }

    public function show(Post $post, Request $request)
    {
        $locale = $request->query('locale', Locale::getDefault()?->code ?? 'en');
        $post->load('translations');
        
        return Inertia::render('Dashboard/Admin/Posts/Show', [
            'post' => $post,
            'translation' => $post->translation($locale),
            'locales' => Locale::getActive(),
            'currentLocale' => $locale,
        ]);
    }

    public function edit(Post $post, Request $request)
    {
        $locale = $request->query('locale', Locale::getDefault()?->code ?? 'en');
        $post->load('translations');
        
        return Inertia::render('Dashboard/Admin/Posts/Edit', [
            'post' => $post,
            'translation' => $post->translation($locale),
            'postTypes' => PostType::all(),
            'locales' => Locale::getActive(),
            'currentLocale' => $locale,
        ]);
    }

    public function update(PostRequest $request, Post $post)
    {
        $validated = $request->validated();
        $locale = $request->input('locale', Locale::getDefault()?->code ?? 'en');
        
        // Extract translation fields
        $translationFields = [
            'title' => $validated['title'] ?? '',
            'slug' => $validated['slug'] ?? '',
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $validated['content'] ?? null,
            'seo_title' => $validated['meta_title'] ?? null,
            'seo_description' => $validated['meta_description'] ?? null,
        ];
        
        // Remove translation fields from main post data
        unset($validated['title'], $validated['slug'], $validated['excerpt'], $validated['content']);
        
        $post->update($validated);
        
        // Update or create the translation
        $post->setTranslation($locale, $translationFields);
        
        return redirect()->route('dashboard.admin.posts.show', $post->id)
                         ->with('success', 'Post updated successfully.');
    }

    public function destroy(Post $post)
    {
        $post->delete();
        return redirect()->route('dashboard.admin.posts.index')
                         ->with('success', 'Post deleted successfully.');
    }

    /**
     * Store a translation for a specific locale
     */
    public function storeTranslation(Request $request, Post $post)
    {
        $validated = $request->validate([
            'locale' => 'required|string|max:8',
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'excerpt' => 'nullable|string|max:512',
            'content' => 'nullable|string',
            'seo_title' => 'nullable|string|max:255',
            'seo_description' => 'nullable|string',
        ]);

        $locale = $validated['locale'];
        unset($validated['locale']);

        $post->setTranslation($locale, $validated);

        return back()->with('success', 'Translation saved successfully.');
    }

    /**
     * Delete a translation for a specific locale
     */
    public function destroyTranslation(Post $post, string $locale)
    {
        $post->translations()->where('locale', $locale)->delete();
        
        return back()->with('success', 'Translation deleted successfully.');
    }
}
