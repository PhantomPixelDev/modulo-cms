<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostType;
use App\Services\PostService;
use App\Services\TemplateRenderingService;
use App\Services\ReactTemplateRenderer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;

class FrontendController extends Controller
{
    protected $templateService;
    protected $reactRenderer;
    protected $postService;

    public function __construct(
        TemplateRenderingService $templateService, 
        ReactTemplateRenderer $reactRenderer,
        PostService $postService
    ) {
        $this->templateService = $templateService;
        $this->reactRenderer = $reactRenderer;
        $this->postService = $postService;
    }

    /**
     * Check if we should use React rendering
     */
    protected function shouldUseReact(): bool
    {
        return $this->reactRenderer->isReactTheme();
    }



    /**
     * List posts by taxonomy term (e.g., /tag/{slug}, /category/{slug}).
     */
    public function listByTaxonomyTerm(Request $request, string $slug)
    {
        \Log::info('listByTaxonomyTerm called', [
            'slug' => $slug,
            'routeParams' => $request->route()->parameters(),
            'request' => $request->all(),
        ]);
        
        $taxonomySlug = strtolower((string) $request->route('taxonomySlug'));
        \Log::info('Taxonomy slug', ['taxonomySlug' => $taxonomySlug]);
        
        // Find public taxonomy by slug
        $taxonomy = Taxonomy::where('slug', $taxonomySlug)
            ->where('is_public', true)
            ->firstOrFail();
            
        // Find term by slug within taxonomy
        $term = TaxonomyTerm::with('taxonomy')
            ->where('slug', $slug)
            ->where('taxonomy_id', $taxonomy->id)
            ->firstOrFail();

        // Get paginated posts for this term
        $perPage = 10; // Adjust as needed
        $posts = $term->posts()
            ->published()
            ->orderBy('published_at', 'desc')
            ->with(['author', 'postType'])
            ->paginate($perPage);


        // If using React rendering
        if ($this->shouldUseReact()) {
            return Inertia::render('TaxonomyTerm', [
                'term' => [
                    'id' => $term->id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                    'description' => $term->description,
                    'taxonomy' => [
                        'id' => $term->taxonomy->id,
                        'name' => $term->taxonomy->name,
                        'slug' => $term->taxonomy->slug,
                        'label' => $term->taxonomy->label,
                    ],
                ],
                'posts' => $posts->map(function ($post) {
                    return [
                        'id' => $post->id,
                        'title' => $post->title,
                        'slug' => $post->slug,
                        'excerpt' => $post->excerpt,
                        'published_at' => $post->published_at?->toDateTimeString(),
                        'featured_image' => $post->featured_image,
                        'author' => $post->author ? [
                            'id' => $post->author->id,
                            'name' => $post->author->name,
                        ] : null,
                        'post_type' => [
                            'id' => $post->postType->id,
                            'name' => $post->postType->name,
                            'slug' => $post->postType->slug,
                            'route_prefix' => $post->postType->route_prefix,
                        ],
                    ];
                })->toArray(),
                'pagination' => [
                    'current_page' => $posts->currentPage(),
                    'last_page' => $posts->lastPage(),
                    'per_page' => $posts->perPage(),
                    'total' => $posts->total(),
                ],
            ]);
        }

        // Fallback to React rendering with correct component name
        return Inertia::render('TaxonomyTerm', [
            'term' => $term,
            'posts' => $posts->map(function ($post) {
                return [
                    'id' => $post->id,
                    'title' => $post->title,
                    'slug' => $post->slug,
                    'excerpt' => $post->excerpt,
                    'published_at' => $post->published_at?->toDateTimeString(),
                    'featured_image' => $post->featured_image,
                    'author' => $post->author ? [
                        'id' => $post->author->id,
                        'name' => $post->author->name,
                    ] : null,
                    'post_type' => [
                        'id' => $post->postType->id,
                        'name' => $post->postType->name,
                        'slug' => $post->postType->slug,
                        'route_prefix' => $post->postType->route_prefix,
                    ],
                ];
            })->toArray(),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
            'taxonomy' => $taxonomy,
        ]);
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

        // Fetch latest posts (not pages) for the index template
        $posts = Post::with(['postType', 'author', 'taxonomyTerms.taxonomy'])
            ->published()
            ->whereHas('postType', function($query) {
                $query->where('route_prefix', '!=', '')
                      ->whereNotNull('route_prefix');
            })
            ->orderBy('published_at', 'desc')
            ->paginate(12);


        // Try React template first if active theme is React
        if ($this->shouldUseReact() && $this->reactRenderer->canRender('index')) {
            return $this->reactRenderer->render('index', [
                'posts' => [
                    'data' => $this->transformPostsForReact($posts)->toArray()
                ],
                'pagination' => $this->transformPaginationForReact($posts),
            ]);
        }

        // Fallback to Blade theme templates
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
        $slug = $request->route('slug');
        $postTypeSlug = $request->route('postTypeSlug');
        
        // For pages (no postTypeSlug in URL)
        if (!$postTypeSlug) {
            $content = $this->postService->getPostBySlug($slug, 'page');
            
            if (!$content) {
                abort(404, 'Page not found');
            }
            
            return $this->renderContent($content, null, null);
        }
        
        // For posts with post type prefix (e.g., /news/slug)
        $postType = PostType::where('route_prefix', $postTypeSlug)->firstOrFail();
        $content = $this->postService->getPostBySlug($slug);
        
        if (!$content || $content->post_type_id !== $postType->id) {
            abort(404);
        }
        
        return $this->renderContent($content, null, null);
    }

    public function showPost(Request $request, string $slug)
    {
        $content = $this->postService->getPostBySlug($slug, 'post');
        
        if (!$content) {
            abort(404, 'Post not found');
        }
        
        return $this->renderContent($content, null, null);
    }
    
    public function listPosts(Request $request, $postTypeSlug = null)
    {
        \Log::info('listPosts:start', [
            'routeName' => optional($request->route())->getName(),
            'routeParams' => optional($request->route())->parameters(),
            'postTypeSlugParam' => $postTypeSlug,
            'queryType' => $request->get('type'),
        ]);

        $query = Post::with(['postType', 'author', 'taxonomyTerms.taxonomy'])
            ->published()
            ->whereHas('postType', function($q) {
                $q->where('name', 'post')
                  ->orWhere('slug', 'posts');
            })
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
        } elseif ($routeName === 'posts.index' && !$request->has('type')) {
            // For the main posts index, ensure we only show 'post' type
            $pt = PostType::where('slug', 'post')
                ->orWhere('route_prefix', 'posts')
                ->orderByRaw("CASE WHEN slug='post' THEN 0 ELSE 1 END")
                ->first();
            if ($pt) {
                $query->where('post_type_id', $pt->id);
                \Log::info('listPosts:defaultToClassicPostType', ['postTypeId' => $pt->id]);
                // Also make it available for template/UI selection below
                $request->attributes->set('default_post_type_id', $pt->id);
            } else {
                \Log::warning('listPosts:classicPostTypeNotFound');
            }
        }

        $posts = $query->paginate(12);


        // Determine post type for template/UI from route default or inferred filter
        $postType = null;
        if ($routePostTypeId) {
            $postType = PostType::find($routePostTypeId);
        } elseif ($postTypeSlug) {
            $postType = PostType::where('route_prefix', $postTypeSlug)->first();
        } elseif ($routeName === 'posts.index') {
            $defaultId = $request->attributes->get('default_post_type_id');
            if ($defaultId) {
                $postType = PostType::find($defaultId);
            }
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

        // Try React template first if active theme is React
        if ($this->shouldUseReact()) {
            // Use 'index' template for post listings, fallback to 'posts'
            $templateName = $this->reactRenderer->canRender('index') ? 'index' : 'posts';
            if ($this->reactRenderer->canRender($templateName)) {
                return $this->reactRenderer->render($templateName, [
                    'posts' => [
                        'data' => $this->transformPostsForReact($posts)->toArray()
                    ],
                    'pagination' => $this->transformPaginationForReact($posts),
                ]);
            }
        }

        // Fallback to Blade theme templates
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

    /**
     * Transform posts collection for React components
     */
    protected function transformPostsForReact($posts)
    {
        return $posts->getCollection()->map(function ($post) {
            return $this->transformPostForReact($post);
        });
    }

    /**
     * Transform single post for React components
     */
    protected function transformPostForReact($post): array
    {
        $content = $post->content ?? '';
        
        // If content is a JSON string, try to parse it as Slate.js content
        if (is_string($content) && str_starts_with(trim($content), '[')) {
            try {
                $slateContent = json_decode($content, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    // Convert Slate.js JSON to HTML
                    $content = $this->slateToHtml($slateContent);
                }
            } catch (\Exception $e) {
                // If parsing fails, keep the original content
                \Log::warning('Failed to parse Slate.js content', [
                    'post_id' => $post->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        return [
            'id' => $post->id ?? 0,
            'title' => $post->title ?? '',
            'slug' => $post->slug ?? '',
            'content' => $content,
            'excerpt' => $post->excerpt ?? '',
            'featured_image' => $post->featured_image,
            'published_at' => $post->published_at ? $post->published_at->toISOString() : now()->toISOString(),
            'updated_at' => $post->updated_at ? $post->updated_at->toISOString() : now()->toISOString(),
            'meta_title' => $post->meta_title,
            'meta_description' => $post->meta_description,
            'author' => $post->author ? [
                'id' => $post->author->id,
                'name' => $post->author->name ?? 'Unknown',
                'email' => $post->author->email ?? '',
            ] : [
                'id' => 0,
                'name' => 'Unknown',
                'email' => '',
            ],
            'post_type' => $post->postType ? [
                'id' => $post->postType->id,
                'name' => $post->postType->name ?? 'post',
                'label' => $post->postType->label ?? 'Post',
                'slug' => $post->postType->slug ?? 'post',
                'route_prefix' => $post->postType->route_prefix ?? 'posts',
            ] : [
                'id' => 0,
                'name' => 'post',
                'label' => 'Post',
                'slug' => 'post',
                'route_prefix' => 'posts',
            ],
            'terms' => $post->taxonomyTerms ? $post->taxonomyTerms->map(function ($term) {
                return [
                    'id' => $term->id ?? 0,
                    'name' => $term->name ?? '',
                    'slug' => $term->slug ?? '',
                    'taxonomy' => $term->taxonomy ? [
                        'name' => $term->taxonomy->name ?? '',
                        'label' => $term->taxonomy->label ?? '',
                    ] : [
                        'name' => '',
                        'label' => '',
                    ],
                ];
            })->toArray() : [],
        ];
    }

    /**
     * Transform pagination for React components
     */
    /**
     * Convert Slate.js JSON to HTML
     */
    protected function slateToHtml(array $nodes): string
    {
        $html = '';
        
        foreach ($nodes as $node) {
            if (isset($node['text'])) {
                $text = htmlspecialchars($node['text']);
                
                // Apply text formatting
                if (!empty($node['bold'])) {
                    $text = "<strong>$text</strong>";
                }
                if (!empty($node['italic'])) {
                    $text = "<em>$text</em>";
                }
                if (!empty($node['underline'])) {
                    $text = "<u>$text</u>";
                }
                if (!empty($node['code'])) {
                    $text = "<code>$text</code>";
                }
                
                $html .= $text;
            } elseif (isset($node['children'])) {
                $children = $this->slateToHtml($node['children']);
                
                // Handle different element types
                switch ($node['type'] ?? 'paragraph') {
                    case 'heading-one':
                        $html .= "<h1>$children</h1>";
                        break;
                    case 'heading-two':
                        $html .= "<h2>$children</h2>";
                        break;
                    case 'heading-three':
                        $html .= "<h3>$children</h3>";
                        break;
                    case 'block-quote':
                        $html .= "<blockquote>$children</blockquote>";
                        break;
                    case 'bulleted-list':
                        $html .= "<ul>$children</ul>";
                        break;
                    case 'numbered-list':
                        $html .= "<ol>$children</ol>";
                        break;
                    case 'list-item':
                        $html .= "<li>$children</li>";
                        break;
                    case 'link':
                        $url = $node['url'] ?? '#';
                        $html .= "<a href=\"$url\">$children</a>";
                        break;
                    case 'image':
                        $url = $node['url'] ?? '';
                        $alt = $node['alt'] ?? '';
                        $html .= "<img src=\"$url\" alt=\"$alt\" />";
                        break;
                    case 'code-block':
                        $html .= "<pre><code>$children</code></pre>";
                        break;
                    default: // paragraph
                        $html .= "<p>$children</p>";
                }
            }
        }
        
        return $html;
    }
    
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

    private function renderContent($content, $template, $dataKey)
    {
        // Increment view count once per render
        try { $content->increment('view_count'); } catch (\Throwable $e) {}


        // Determine whether content is a page (route_prefix empty/null/'/')
        $isPage = in_array(($content->postType->route_prefix ?? null), [null, '', '/'], true);
        $template = $template ?? ($isPage ? 'frontend/page' : 'frontend/post');
        $dataKey = $dataKey ?? ($isPage ? 'page' : 'post');

        // Try React template first if active theme is React
        if ($this->shouldUseReact()) {
            $templateName = $isPage ? 'page' : 'post';
            if ($this->reactRenderer->canRender($templateName)) {
                return $this->reactRenderer->render($templateName, [
                    $dataKey => $this->transformPostForReact($content),
                ]);
            }
        }

        // Fallback to Blade theme templates
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
}
