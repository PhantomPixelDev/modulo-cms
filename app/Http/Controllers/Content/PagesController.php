<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\PostType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PagesController extends Controller
{
    protected ?PostType $pageType = null;

    public function __construct()
    {
        // Do not hit the database in the constructor to avoid errors during app boot
        // or when the post_types table hasn't been seeded yet. Resolve lazily.
    }

    private function resolvePageType(): PostType
    {
        if ($this->pageType) {
            return $this->pageType;
        }
        $pageType = PostType::where('name', 'page')->first()
            ?? PostType::where('slug', 'pages')->first()
            ?? PostType::where(function($q){
                $q->whereNull('route_prefix')
                  ->orWhere('route_prefix','')
                  ->orWhere('route_prefix','/');
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

    public function index()
    {
        $pageType = $this->resolvePageType();
        $pages = Page::with('author')
            ->where('post_type_id', $pageType->id)
            ->orderByDesc('created_at')
            ->paginate(15);

        return Inertia::render('Dashboard', [
            'adminSection' => 'pages',
            'posts' => $pages, // reuse posts prop name to avoid large UI changes
            'postTypes' => [],
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard', [
            'adminSection' => 'pages.create',
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:posts,slug',
            'status' => 'required|in:draft,published,private,archived',
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'featured_image' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
        ]);

        $pageType = $this->resolvePageType();
        $page = new Page($data);
        $page->post_type_id = $pageType->id;
        $page->author_id = auth()->id();
        if (empty($page->slug)) {
            $page->slug = str()->slug($page->title);
        }
        // Auto-set published_at when publishing
        if (($page->status ?? null) === 'published' && empty($page->published_at)) {
            $page->published_at = now();
        }
        $page->save();

        return redirect()->route('dashboard.admin.pages.index')
            ->with('success', 'Page created successfully.');
    }

    public function edit(Page $page)
    {
        // Ensure it's a page
        $pageType = $this->resolvePageType();
        abort_unless($page->post_type_id === $pageType->id, 404);

        return Inertia::render('Dashboard', [
            'adminSection' => 'pages.edit',
            'post' => $page, // reuse prop name expected by PostForm/PageForm consumer
        ]);
    }

    public function update(Request $request, Page $page)
    {
        $pageType = $this->resolvePageType();
        abort_unless($page->post_type_id === $pageType->id, 404);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:posts,slug,' . $page->id,
            'status' => 'required|in:draft,published,private,archived',
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'featured_image' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
        ]);

        $page->fill($data);
        if (empty($page->slug)) {
            $page->slug = str()->slug($page->title);
        }
        // Auto-set published_at when moving to published
        if (($page->status ?? null) === 'published' && empty($page->published_at)) {
            $page->published_at = now();
        }
        $page->save();

        return redirect()->route('dashboard.admin.pages.index')
            ->with('success', 'Page updated successfully.');
    }

    public function destroy(Page $page)
    {
        $pageType = $this->resolvePageType();
        abort_unless($page->post_type_id === $pageType->id, 404);
        $page->delete();

        return redirect()->route('dashboard.admin.pages.index')
            ->with('success', 'Page deleted successfully.');
    }
}
