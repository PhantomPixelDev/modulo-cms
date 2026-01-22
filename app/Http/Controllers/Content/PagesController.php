<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Admin\AdminBaseController;
use App\Models\Post;
use App\Models\PostType;
use App\Services\SiteSettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PagesController extends AdminBaseController
{
    protected string $resourceName = 'posts';
    
    protected ?PostType $pageType = null;

    public function __construct(
        protected SiteSettingsService $settings
    ) {
        parent::__construct();
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
        $perPage = $this->settings->get('posts_per_page', 15);
        $pages = Post::with(['author', 'postType'])
            ->where('post_type_id', $pageType->id)
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->through(function ($page) {
                return [
                    'id' => $page->id,
                    'title' => $page->title,
                    'slug' => $page->slug,
                    'status' => $page->status,
                    'published_at' => $this->settings->formatDateTime($page->published_at),
                    'created_at' => $this->settings->formatDateTime($page->created_at),
                    'updated_at' => $this->settings->formatDateTime($page->updated_at),
                    'author' => $page->author ? [
                        'id' => $page->author->id,
                        'name' => $page->author->name,
                    ] : null,
                    'featured_image' => $page->featured_image,
                    'featured_image_id' => $page->featured_image_id,
                ];
            });

        return Inertia::render('Dashboard', [
            'adminSection' => 'pages',
            'posts' => $pages,
            'postTypes' => [],
            'adminStats' => [
                'pages' => Post::where('post_type_id', $pageType->id)->count(),
            ],
        ]);
    }

    public function create()
    {
        $defaultStatus = $this->settings->get('default_post_status', 'draft');
        
        return Inertia::render('Dashboard', [
            'adminSection' => 'pages.create',
            'defaultStatus' => $defaultStatus,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:posts,slug',
            'status' => 'required|in:draft,published,private,archived',
            'content' => 'required', // Content can be string or array
            'excerpt' => 'nullable|string',
            'featured_image' => 'nullable|string',
            'featured_image_id' => 'nullable|integer|exists:media,id',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'author_id' => 'nullable|exists:users,id',
        ]);

        // Ensure content is properly formatted as JSON string
        if (is_array($data['content']) || is_object($data['content'])) {
            $data['content'] = json_encode($data['content'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        $pageType = $this->resolvePageType();
        
        // Set published_at if status is published and not set
        $publishedAt = null;
        if (($data['status'] ?? null) === 'published' && empty($data['published_at'])) {
            $publishedAt = now();
        }
        
        // Generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = \Illuminate\Support\Str::slug($data['title']);
        }
        
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
            'featured_image_id' => $data['featured_image_id'] ?? null,
            'meta_title' => $data['meta_title'] ?? null,
            'meta_description' => $data['meta_description'] ?? null,
        ]);

        return redirect()->route('dashboard.admin.pages.index')
            ->with('success', 'Page created successfully.');
    }

    public function edit(Post $page)
    {
        // Ensure it's a page
        $pageType = $this->resolvePageType();
        abort_unless($page->post_type_id === $pageType->id, 404);

        return Inertia::render('Dashboard', [
            'adminSection' => 'pages.edit',
            'post' => $page,
        ]);
    }

    public function update(Request $request, Post $page)
    {
        $pageType = $this->resolvePageType();
        abort_unless($page->post_type_id === $pageType->id, 404);

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:posts,slug,' . $page->id,
            'status' => 'required|in:draft,published,private,archived',
            'content' => 'required', // Content can be string or array
            'excerpt' => 'nullable|string',
            'featured_image' => 'nullable|string',
            'featured_image_id' => 'nullable|integer|exists:media,id',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'author_id' => 'nullable|exists:users,id',
        ]);

        // Ensure content is properly formatted as JSON string
        if (is_array($data['content']) || is_object($data['content'])) {
            $data['content'] = json_encode($data['content'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }

        // Handle published_at based on status
        if (($data['status'] ?? null) === 'published' && empty($page->published_at)) {
            $data['published_at'] = now();
        } elseif (($data['status'] ?? null) !== 'published') {
            $data['published_at'] = null;
        }

        // Generate slug if not provided
        if (empty($data['slug'])) {
            $data['slug'] = \Illuminate\Support\Str::slug($data['title']);
        }

        // Log the data before update for debugging
        \Log::info('Updating page content', [
            'page_id' => $page->id,
            'content_type' => gettype($data['content']),
            'content_length' => is_string($data['content']) ? strlen($data['content']) : null,
            'content_sample' => is_string($data['content']) ? substr($data['content'], 0, 100) . '...' : null,
        ]);

        // Update the page
        $page->update([
            'title' => $data['title'],
            'slug' => $data['slug'],
            'content' => $data['content'],
            'excerpt' => $data['excerpt'] ?? '',
            'status' => $data['status'],
            'published_at' => $data['published_at'] ?? $page->published_at,
            'featured_image' => $data['featured_image'] ?? $page->featured_image,
            'featured_image_id' => $data['featured_image_id'] ?? $page->featured_image_id,
            'meta_title' => $data['meta_title'] ?? $page->meta_title,
            'meta_description' => $data['meta_description'] ?? $page->meta_description,
            'author_id' => $data['author_id'] ?? $page->author_id,
        ]);

        // Log after update to verify
        $updatedPage = $page->fresh();
        \Log::info('Page updated', [
            'page_id' => $updatedPage->id,
            'content_stored' => $updatedPage->content ? 'yes' : 'no',
            'content_length' => $updatedPage->content ? strlen($updatedPage->content) : 0,
        ]);

        return redirect()->route('dashboard.admin.pages.index')
            ->with('success', 'Page updated successfully.');
    }

    public function destroy(Post $page)
    {
        $pageType = $this->resolvePageType();
        abort_unless($page->post_type_id === $pageType->id, 404);
        $page->delete();

        return redirect()->route('dashboard.admin.pages.index')
            ->with('success', 'Page deleted successfully.');
    }
}
