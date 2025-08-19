<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostType;
use App\Services\TemplateRenderingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;

class FrontendController extends Controller
{
    protected $templateService;

    public function __construct(TemplateRenderingService $templateService)
    {
        $this->templateService = $templateService;
    }

    /**
     * Render the site home page using the active theme's index template when available.
     */
    public function home(Request $request)
    {
        // If migrations haven't run (e.g., in simple smoke tests), avoid querying non-existent tables
        if (! Schema::hasTable('posts')) {
            return Inertia::render('welcome');
        }

        // Fetch latest public content for the index template
        $posts = Post::with(['postType', 'author'])
            ->published()
            ->orderBy('published_at', 'desc')
            ->paginate(12);

        // If use_template=true (or a theme index exists), render through the theme system
        $rendered = $this->templateService->renderIndex($posts, null, [
            'title' => config('app.name'),
            'site_name' => config('app.name'),
            'description' => config('app.description', ''),
            'prefer_index' => true,
        ]);

        if ($rendered) {
            // renderIndex already returns content wrapped by layout via renderLayout
            return response($rendered)->header('Content-Type', 'text/html');
        }

        // Fallback to default Inertia posts list page
        return Inertia::render('frontend/posts', [
            'posts' => $posts->through(function ($post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'slug' => $post->slug,
                    'excerpt' => $post->excerpt,
                    'featured_image' => $post->featured_image,
                    'published_at' => $post->published_at,
                    'author' => $post->author ? [
                        'id' => $post->author->id,
                        'name' => $post->author->name,
                    ] : null,
                    'post_type' => [
                        'id' => $post->postType->id,
                        'name' => $post->postType->name,
                        'label' => $post->postType->label,
                        'slug' => $post->postType->slug,
                        'route_prefix' => $post->postType->route_prefix,
                    ],
                ];
            }),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
                'has_more_pages' => $posts->hasMorePages(),
            ],
            'basePath' => '/',
            'pageTitle' => 'Home',
            'showFilters' => false,
        ]);
    }
    public function showContent(Request $request)
    {
        // Read params strictly by name to avoid positional misbinding
        $slug = $request->route('slug');
        $postTypeSlug = $request->route('postTypeSlug');
        \Log::info('showContent:start', ['slug' => $slug, 'postTypeSlug' => $postTypeSlug]);

        // Helper to apply published visibility for guests; allow preview for authenticated users
        $applyVisibility = function ($query) {
            if (!auth()->check()) {
                $query->published();
            }
            return $query;
        };

        // If no post type slug provided, try to find content by slug alone
        if (!$postTypeSlug) {
            // First try to find a page with empty route_prefix or route_prefix = '/'
            $pagePostType = PostType::where(function($query) {
                $query->whereNull('route_prefix')
                      ->orWhere('route_prefix', '')
                      ->orWhere('route_prefix', '/');
            })->first();
            \Log::info('showContent:pageType', ['pageTypeId' => $pagePostType?->id]);

            if ($pagePostType) {
                $content = Post::with(['postType', 'author', 'taxonomyTerms.taxonomy'])
                    ->where('slug', $slug)
                    ->where('post_type_id', $pagePostType->id);
                $applyVisibility($content);
                $content = $content->first();
                \Log::info('showContent:pageLookup', ['foundId' => $content?->id]);

                if ($content) {
                    // Increment view count once inside renderContent
                    return $this->renderContent($content, null, null);
                }
            }

            // If not found as page, try to find any published content
            $content = Post::with(['postType', 'author', 'taxonomyTerms.taxonomy'])
                ->where('slug', $slug);
            $applyVisibility($content);
            $content = $content->firstOrFail();
            \Log::info('showContent:genericLookup', ['foundId' => $content?->id]);
        } else {
            // Find post type by route prefix
            $postType = PostType::where('route_prefix', $postTypeSlug)->firstOrFail();
            
            $content = Post::with(['postType', 'author', 'taxonomyTerms.taxonomy'])
                ->where('slug', $slug)
                ->where('post_type_id', $postType->id);
            $applyVisibility($content);
            $content = $content->firstOrFail();
            \Log::info('showContent:typedLookup', ['foundId' => $content?->id]);
        }

        return $this->renderContent($content, null, null);
    }

    private function renderContent($content, $template, $dataKey)
    {
        // Increment view count once per render
        try { $content->increment('view_count'); } catch (\Throwable $e) {}

        // Determine whether content is a page (route_prefix empty/null/'/')
        $isPage = in_array(($content->postType->route_prefix ?? null), [null, '', '/'], true);
        $template = $template ?? ($isPage ? 'frontend/page' : 'frontend/post');
        $dataKey = $dataKey ?? ($isPage ? 'page' : 'post');

        // Always try theme templates first; fallback to Inertia if not available
        if ($isPage) {
            $renderedContent = $this->templateService->renderPage($content);
        } else {
            $renderedContent = $this->templateService->renderPost($content);
        }

        if ($renderedContent) {
            return response($renderedContent)->header('Content-Type', 'text/html');
        }

        // Default Inertia rendering
        return Inertia::render($template, [
            $dataKey => [
                'id' => $content->id,
                'title' => $content->title,
                'slug' => $content->slug,
                'content' => $content->content,
                'excerpt' => $content->excerpt,
                'featured_image' => $content->featured_image,
                'published_at' => $content->published_at,
                'updated_at' => $content->updated_at,
                'view_count' => $content->view_count,
                'meta_title' => $content->meta_title,
                'meta_description' => $content->meta_description,
                'author' => $content->author ? [
                    'id' => $content->author->id,
                    'name' => $content->author->name,
                    'email' => $content->author->email,
                ] : null,
                'post_type' => [
                    'id' => $content->postType->id,
                    'name' => $content->postType->name,
                    'label' => $content->postType->label,
                    'slug' => $content->postType->slug,
                    'route_prefix' => $content->postType->route_prefix,
                ],
                'taxonomy_terms' => $content->taxonomyTerms->map(function ($term) {
                    return [
                        'id' => $term->id,
                        'name' => $term->name,
                        'slug' => $term->slug,
                        'taxonomy' => [
                            'id' => $term->taxonomy->id,
                            'name' => $term->taxonomy->name,
                            'label' => $term->taxonomy->label,
                            'slug' => $term->taxonomy->slug,
                        ],
                    ];
                }),
            ],
        ]);
    }

    public function listPosts(Request $request, $postTypeSlug = null)
    {
        \Log::info('listPosts:start', [
            'routeName' => optional($request->route())->getName(),
            'routeParams' => optional($request->route())->parameters(),
            'postTypeSlugParam' => $postTypeSlug,
            'queryType' => $request->get('type'),
        ]);

        $query = Post::with(['postType', 'author', 'taxonomyTerms'])
            ->published()
            ->orderBy('published_at', 'desc');

        // Use route-provided postTypeId when available (set as a route default in routes/web.php)
        $routeName = $request->route()->getName();
        $routePostTypeId = $request->route('postTypeId');

        if ($routePostTypeId) {
            $query->where('post_type_id', $routePostTypeId);
            \Log::info('listPosts:filterByRouteDefaultPostTypeId', ['postTypeId' => $routePostTypeId]);
        } elseif ($postTypeSlug) {
            // Backward-compatible: allow explicit route prefix param
            $pt = PostType::where('route_prefix', $postTypeSlug)->first();
            if ($pt) {
                $query->where('post_type_id', $pt->id);
                \Log::info('listPosts:filterBySlug', ['route_prefix' => $postTypeSlug, 'postTypeId' => $pt->id]);
            }
        }

        // Filter by post type slug if specified in query params
        if ($request->has('type')) {
            $postType = PostType::where('slug', $request->type)->first();
            if ($postType) {
                $query->where('post_type_id', $postType->id);
                \Log::info('listPosts:filterByQueryParamType', ['slug' => $request->type, 'postTypeId' => $postType->id]);
            }
        }

        $posts = $query->paginate(12);

        // Determine post type for template/UI from route default or inferred filter
        $postType = null;
        if ($routePostTypeId) {
            $postType = PostType::find($routePostTypeId);
        } elseif ($postTypeSlug) {
            $postType = PostType::where('route_prefix', $postTypeSlug)->first();
        }
        
        // Normalize route_prefix (treat '/' as empty)
        $normalizedPrefix = null;
        if ($postType && $postType->route_prefix) {
            $trimmed = ltrim($postType->route_prefix, '/');
            $normalizedPrefix = $trimmed === '' ? null : $trimmed;
        }

        // Use the post type specific template if it exists, otherwise fall back to the default posts template
        $template = $postType && $normalizedPrefix && view()->exists("frontend/{$normalizedPrefix}")
            ? "frontend/{$normalizedPrefix}"
            : 'frontend/posts';
        \Log::info('listPosts:templateSelection', [
            'postTypeId' => $postType?->id,
            'route_prefix' => $postType?->route_prefix,
            'normalizedPrefix' => $normalizedPrefix,
            'inertiaTemplate' => $template,
        ]);
        
        // Determine basePath and pageTitle for frontend routing/UI
        $basePath = '/posts';
        $pageTitle = 'Posts';
        if ($postType) {
            $basePath = $normalizedPrefix ? '/' . $normalizedPrefix : '/pages';
            $pageTitle = $postType->plural_label ?: ($normalizedPrefix ? ucfirst($normalizedPrefix) : 'Pages');
        }
        \Log::info('listPosts:uiMeta', [ 'basePath' => $basePath, 'pageTitle' => $pageTitle ]);

        // Try rendering via active theme using TemplateRenderingService
        $rendered = $this->templateService->renderIndex($posts, $postType, [
            'title' => $pageTitle,
            'description' => $postType?->description ?? '',
        ]);
        if ($rendered) {
            \Log::info('listPosts:renderedByTheme');
            return response($rendered)->header('Content-Type', 'text/html');
        }

        \Log::warning('listPosts:themeRenderingMissingOrError_fallingBackToInertia');
        return Inertia::render($template, [
            'posts' => $posts->through(function ($post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'slug' => $post->slug,
                    'excerpt' => $post->excerpt,
                    'featured_image' => $post->featured_image,
                    'published_at' => $post->published_at,
                    'view_count' => $post->view_count,
                    'author' => $post->author ? [
                        'id' => $post->author->id,
                        'name' => $post->author->name,
                    ] : null,
                    'post_type' => [
                        'id' => $post->postType->id,
                        'name' => $post->postType->name,
                        'label' => $post->postType->label,
                        'slug' => $post->postType->slug,
                        'route_prefix' => $post->postType->route_prefix,
                    ],
                    'taxonomy_terms' => $post->taxonomyTerms->take(3)->map(function ($term) {
                        return [
                            'id' => $term->id,
                            'name' => $term->name,
                            'slug' => $term->slug,
                        ];
                    }),
                ];
            }),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
                'has_more_pages' => $posts->hasMorePages(),
            ],
            'debug' => [
                'count' => $posts->count(),
                'total' => $posts->total(),
            ],
            'filters' => [
                'type' => $request->type,
                'postTypeSlug' => $postTypeSlug,
            ],
            // UI helpers
            'basePath' => $basePath,
            'pageTitle' => $pageTitle,
            'showFilters' => false,
            'postTypes' => PostType::where('is_public', true)->get(['id', 'name', 'label', 'slug', 'route_prefix']),
        ]);
    }
}
