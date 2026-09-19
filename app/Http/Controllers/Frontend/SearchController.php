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

        $searchTerm = mb_substr(trim($query), 0, 100);

        // Case-insensitive on every driver (plain LIKE is case-sensitive on PostgreSQL),
        // with user-supplied % and _ treated literally.
        $pattern = '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $searchTerm) . '%';

        $posts = Post::with([
                'postType',
                'author',
                'taxonomyTerms.taxonomy'
            ])
            ->published()
            ->whereHas('postType', fn ($q) => $q->where('is_public', true))
            ->where(function ($q) use ($pattern) {
                foreach (['title', 'excerpt', 'content'] as $column) {
                    $q->orWhereRaw("LOWER({$column}) LIKE LOWER(?) ESCAPE '!'", [$pattern]);
                }
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
