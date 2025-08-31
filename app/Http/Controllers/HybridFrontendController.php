<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostType;
use App\Services\TemplateRenderingService;
use App\Services\ReactTemplateRenderer;
use App\Services\ThemeManager;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HybridFrontendController extends Controller
{
    protected $templateService;
    protected $reactRenderer;
    protected $themeManager;

    public function __construct(
        TemplateRenderingService $templateService, 
        ReactTemplateRenderer $reactRenderer,
        ThemeManager $themeManager
    ) {
        $this->templateService = $templateService;
        $this->reactRenderer = $reactRenderer;
        $this->themeManager = $themeManager;
    }

    /**
     * Render homepage with hybrid template support
     */
    public function index(Request $request)
    {
        $posts = Post::with(['postType', 'author', 'taxonomyTerms'])
            ->published()
            ->orderBy('published_at', 'desc')
            ->paginate(12);

        // Try React template first
        if ($this->reactRenderer->canRender('index')) {
            return $this->reactRenderer->render('index', [
                'posts' => $this->transformPostsForReact($posts),
                'pagination' => $this->transformPaginationForReact($posts),
            ]);
        }

        // Fallback to Blade template
        $rendered = $this->templateService->renderIndex($posts);
        if ($rendered) {
            return response($rendered)->header('Content-Type', 'text/html');
        }

        // Final fallback to default Inertia
        return Inertia::render('frontend/posts', [
            'posts' => $this->transformPostsForReact($posts),
            'pagination' => $this->transformPaginationForReact($posts),
        ]);
    }

    /**
     * Show single post with hybrid template support
     */
    public function showPost(Request $request, string $postTypeSlug, string $slug)
    {
        $postType = PostType::where('route_prefix', $postTypeSlug)
            ->where('is_public', true)
            ->firstOrFail();

        $post = Post::with(['postType', 'author', 'taxonomyTerms.taxonomy'])
            ->where('slug', $slug)
            ->where('post_type_id', $postType->id)
            ->published()
            ->firstOrFail();

        // Try React template first
        if ($this->reactRenderer->canRender('post')) {
            return $this->reactRenderer->render('post', [
                'post' => $this->transformPostForReact($post),
                'relatedPosts' => $this->getRelatedPosts($post),
            ]);
        }

        // Fallback to Blade template
        $rendered = $this->templateService->renderPost($post);
        if ($rendered) {
            return response($rendered)->header('Content-Type', 'text/html');
        }

        // Final fallback to default Inertia
        return Inertia::render('frontend/post', [
            'post' => $this->transformPostForReact($post),
        ]);
    }

    /**
     * Show page with hybrid template support
     */
    public function showPage(Request $request, string $slug)
    {
        $page = Post::with(['postType', 'author'])
            ->whereHas('postType', function($q) {
                $q->where('name', 'page');
            })
            ->where('slug', $slug)
            ->published()
            ->firstOrFail();

        // Try React template first
        if ($this->reactRenderer->canRender('page')) {
            return $this->reactRenderer->render('page', [
                'page' => $this->transformPostForReact($page),
            ]);
        }

        // Fallback to Blade template
        $rendered = $this->templateService->renderPage($page);
        if ($rendered) {
            return response($rendered)->header('Content-Type', 'text/html');
        }

        // Final fallback to default Inertia
        return Inertia::render('frontend/page', [
            'page' => $this->transformPostForReact($page),
        ]);
    }

    /**
     * Transform posts collection for React components
     */
    protected function transformPostsForReact($posts)
    {
        return $posts->through(function ($post) {
            return $this->transformPostForReact($post);
        });
    }

    /**
     * Transform single post for React components
     */
    protected function transformPostForReact($post): array
    {
        return [
            'id' => $post->id,
            'title' => $post->title,
            'slug' => $post->slug,
            'content' => $post->content,
            'excerpt' => $post->excerpt,
            'featured_image' => $post->featured_image,
            'published_at' => $post->published_at,
            'updated_at' => $post->updated_at,
            'meta_title' => $post->meta_title,
            'meta_description' => $post->meta_description,
            'author' => $post->author ? [
                'id' => $post->author->id,
                'name' => $post->author->name,
                'email' => $post->author->email,
                'avatar' => $post->author->avatar,
            ] : null,
            'post_type' => [
                'id' => $post->postType->id,
                'name' => $post->postType->name,
                'label' => $post->postType->label,
                'slug' => $post->postType->slug,
                'route_prefix' => $post->postType->route_prefix,
            ],
            'terms' => $post->taxonomyTerms ? $post->taxonomyTerms->map(function ($term) {
                return [
                    'id' => $term->id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                    'taxonomy' => $term->taxonomy ? [
                        'name' => $term->taxonomy->name,
                        'label' => $term->taxonomy->label,
                    ] : null,
                ];
            })->toArray() : [],
        ];
    }

    /**
     * Transform pagination for React components
     */
    protected function transformPaginationForReact($posts): array
    {
        return [
            'current_page' => $posts->currentPage(),
            'last_page' => $posts->lastPage(),
            'per_page' => $posts->perPage(),
            'total' => $posts->total(),
            'prev_page_url' => $posts->previousPageUrl(),
            'next_page_url' => $posts->nextPageUrl(),
        ];
    }

    /**
     * Get related posts for a given post
     */
    protected function getRelatedPosts($post, int $limit = 3): array
    {
        $related = Post::with(['postType', 'author'])
            ->where('id', '!=', $post->id)
            ->where('post_type_id', $post->post_type_id)
            ->published()
            ->inRandomOrder()
            ->limit($limit)
            ->get();

        return $related->map(function ($post) {
            return $this->transformPostForReact($post);
        })->toArray();
    }
}
