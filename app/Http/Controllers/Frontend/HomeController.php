<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class HomeController extends BaseFrontendController
{
    public function __invoke(Request $request)
    {
        if ($resp = $this->requireReactTheme()) {
            return $resp;
        }

        if (!Schema::hasTable('posts')) {
            return Inertia::render('Setup/ThemeMissing', [
                'message' => 'Database is not initialized (missing posts table). Run migrations and refresh.',
            ]);
        }

        $showOnFront = SiteSetting::get('show_on_front', 'posts');
        
        if ($showOnFront === 'page') {
            $frontPageId = SiteSetting::get('front_page_id');
            if ($frontPageId) {
                $content = Post::with(['author', 'postType', 'taxonomyTerms.taxonomy'])->find($frontPageId);
                if ($content && $content->status === 'published') {
                    return $this->renderContent($content, 'page', 'page');
                }
            }
            \Log::warning('home:frontPageNotFoundOrNotPublished', ['front_page_id' => $frontPageId]);
        }

        $query = Post::with([
                'postType', 
                'author.roles', 
                'taxonomyTerms.taxonomy'
            ])
            ->published()
            ->orderBy('published_at', 'desc');

        $postType = PostType::where('slug', 'post')->first();
        if ($postType) {
            $query->where('post_type_id', $postType->id);
        } else {
            $query->whereHas('postType', function($q) {
                $q->where('slug', '!=', 'page');
            });
        }

        $posts = $query->paginate($this->getPerPage());
        $presented = $this->postPresenter->presentPaginator($posts);

        return $this->reactRenderer->render($this->templateResolver->indexTemplate(), [
            'posts' => [
                'data' => $presented['data'],
            ],
            'pagination' => $presented['pagination'],
        ]);
    }
}
