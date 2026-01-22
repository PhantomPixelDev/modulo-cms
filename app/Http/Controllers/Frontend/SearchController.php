<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class SearchController extends BaseFrontendController
{
    public function __invoke(Request $request)
    {
        if ($resp = $this->requireReactTheme()) {
            return $resp;
        }

        $query = $request->get('q', '');

        if (empty(trim($query))) {
            return $this->reactRenderer->render($this->templateResolver->searchTemplate(), [
                'posts' => [
                    'data' => [],
                ],
                'pagination' => $this->postPresenter->presentPaginator(
                    new LengthAwarePaginator([], 0, $this->getPerPage())
                )['pagination'],
                'searchQuery' => '',
            ]);
        }

        $searchTerm = trim($query);

        $posts = Post::with([
                'postType', 
                'author.roles', 
                'taxonomyTerms.taxonomy'
            ])
            ->published()
            ->where(function ($q) use ($searchTerm) {
                $q->where('title', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('excerpt', 'LIKE', "%{$searchTerm}%")
                  ->orWhere('content', 'LIKE', "%{$searchTerm}%");
            })
            ->orderBy('published_at', 'desc')
            ->paginate($this->getPerPage());

        $presented = $this->postPresenter->presentPaginator($posts);

        return $this->reactRenderer->render($this->templateResolver->searchTemplate(), [
            'posts' => [
                'data' => $presented['data'],
            ],
            'pagination' => $presented['pagination'],
            'searchQuery' => $searchTerm,
        ]);
    }
}
