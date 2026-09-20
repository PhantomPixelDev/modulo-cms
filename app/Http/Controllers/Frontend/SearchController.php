<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Post;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

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

        $posts = Post::with([
            'postType',
            'author',
            'taxonomyTerms.taxonomy',
        ])
            ->published()
            ->whereHas('postType', fn ($q) => $q->where('is_public', true))
            ->tap(fn ($q) => $this->applySearch($q, $searchTerm))
            ->paginate($this->getPerPage())
            ->withQueryString();

        $presented = $this->postPresenter->presentPaginator($posts);

        return $this->reactRenderer->render($this->templateResolver->searchTemplate(), [
            'posts' => [
                'data' => $presented['data'],
            ],
            'pagination' => $presented['pagination'],
            'searchQuery' => $searchTerm,
        ]);
    }

    /**
     * Full-text search on PostgreSQL (ranked, GIN indexed); LIKE everywhere else.
     */
    protected function applySearch(Builder $query, string $term): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            $query->whereRaw("search_vector @@ websearch_to_tsquery('simple', ?)", [$term])
                ->orderByRaw("ts_rank(search_vector, websearch_to_tsquery('simple', ?)) DESC", [$term])
                ->orderBy('published_at', 'desc');

            return;
        }

        // Case-insensitive on every driver (plain LIKE is case-sensitive on
        // PostgreSQL), with user-supplied % and _ treated literally.
        $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term).'%';

        $query->where(function ($q) use ($pattern) {
            foreach (['title', 'excerpt', 'content'] as $column) {
                $q->orWhereRaw("LOWER({$column}) LIKE LOWER(?) ESCAPE '!'", [$pattern]);
            }
        })->orderBy('published_at', 'desc');
    }
}
