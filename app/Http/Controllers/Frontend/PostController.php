<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use App\Services\PostService;
use App\Services\ReactTemplateRenderer;
use App\Services\FrontendTemplateResolver;
use App\Presenters\PostPresenter;
use Illuminate\Http\Request;

class PostController extends BaseFrontendController
{
    public function __construct(
        ReactTemplateRenderer $reactRenderer,
        FrontendTemplateResolver $templateResolver,
        PostPresenter $postPresenter,
        protected PostService $postService
    ) {
        parent::__construct($reactRenderer, $templateResolver, $postPresenter);
    }

    public function index(Request $request, $postTypeSlug = null)
    {
        if ($resp = $this->requireReactTheme()) {
            return $resp;
        }

        if (config('theme.debug')) {
            \Log::debug('listPosts:start', [
                'routeName' => optional($request->route())->getName(),
                'routeParams' => optional($request->route())->parameters(),
                'postTypeSlugParam' => $postTypeSlug,
                'queryType' => $request->get('type'),
            ]);
        }

        $query = Post::with([
                'postType', 
                'author.roles', 
                'taxonomyTerms.taxonomy'
            ])
            ->published()
            ->orderBy('published_at', 'desc');

        $routeName = $request->route()->getName();
        $routePostTypeId = $request->route('postTypeId');

        if ($routePostTypeId) {
            $query->where('post_type_id', $routePostTypeId);
            if (config('theme.debug')) {
                \Log::debug('listPosts:filterByRouteDefaultPostTypeId', ['postTypeId' => $routePostTypeId]);
            }
        } elseif ($postTypeSlug) {
            $pt = PostType::where('route_prefix', $postTypeSlug)->first();
            if ($pt) {
                $query->where('post_type_id', $pt->id);
                if (config('theme.debug')) {
                    \Log::debug('listPosts:filterBySlug', ['route_prefix' => $postTypeSlug, 'postTypeId' => $pt->id]);
                }
            }
        } elseif ($routeName === 'posts.index' && !$request->has('type')) {
            $pt = PostType::where('slug', 'post')->first();
            if ($pt) {
                $query->where('post_type_id', $pt->id);
                if (config('theme.debug')) {
                    \Log::debug('listPosts:defaultToClassicPostType', ['postTypeId' => $pt->id]);
                }
                $request->attributes->set('default_post_type_id', $pt->id);
            } else {
                \Log::warning('listPosts:classicPostTypeNotFound - filtering by slug=post in query');
                $query->whereHas('postType', function($q) {
                    $q->where('slug', 'post');
                });
            }
        }

        $posts = $query->paginate($this->getPerPage());

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

        $templateName = $this->templateResolver->postsIndexTemplate($postType);
        $presented = $this->postPresenter->presentPaginator($posts);

        return $this->reactRenderer->render($templateName, [
            'posts' => [
                'data' => $presented['data'],
            ],
            'pagination' => $presented['pagination'],
            'postType' => $postType ? [
                'id' => $postType->id,
                'name' => $postType->name,
                'label' => $postType->label,
                'plural_label' => $postType->plural_label,
                'description' => $postType->description,
                'slug' => $postType->slug,
                'route_prefix' => $postType->route_prefix,
            ] : null,
        ]);
    }

    public function show(Request $request, string $slug)
    {
        if ($resp = $this->requireReactTheme()) {
            return $resp;
        }

        $content = $this->postService->getPostBySlug($slug, 'post', app()->getLocale());
        
        if (!$content) {
            abort(404, 'Post not found');
        }
        
        return $this->renderContent($content, 'post', 'post');
    }

    public function showContent(Request $request)
    {
        if ($resp = $this->requireReactTheme()) {
            return $resp;
        }

        $slug = $request->route('slug');
        $postTypeSlug = $request->route('postTypeSlug');

        if (!$slug || !is_string($slug)) {
            abort(404);
        }
        
        if (!$postTypeSlug) {
            $content = $this->postService->getPostBySlug($slug, 'page', app()->getLocale());
            
            if (!$content) {
                abort(404, 'Page not found');
            }

            $postsPageId = SiteSetting::get('posts_page_id');
            if ($postsPageId && $content->id == $postsPageId) {
                return $this->index($request);
            }
            
            return $this->renderContent($content, 'page', 'page');
        }
        
        $postType = PostType::where('route_prefix', $postTypeSlug)->firstOrFail();
        $content = $this->postService->getPostBySlug($slug, $postType->name, app()->getLocale());
        
        if (!$content || $content->post_type_id !== $postType->id) {
            abort(404);
        }
        
        return $this->renderContent($content, 'post', 'post');
    }
}
