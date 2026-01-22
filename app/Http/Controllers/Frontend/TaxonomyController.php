<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use Illuminate\Http\Request;

class TaxonomyController extends BaseFrontendController
{
    public function show(Request $request, string $slug)
    {
        if ($resp = $this->requireReactTheme()) {
            return $resp;
        }

        $taxonomySlug = strtolower((string) $request->route('taxonomySlug'));
        if (env('THEME_DEBUG', false)) {
            \Log::debug('listByTaxonomyTerm', [
                'slug' => $slug,
                'taxonomySlug' => $taxonomySlug,
                'routeParams' => $request->route()->parameters(),
            ]);
        }
        
        $taxonomy = Taxonomy::where('slug', $taxonomySlug)
            ->where('is_public', true)
            ->firstOrFail();
            
        $term = TaxonomyTerm::with('taxonomy')
            ->where('slug', $slug)
            ->where('taxonomy_id', $taxonomy->id)
            ->firstOrFail();

        $posts = $term->posts()
            ->published()
            ->orderBy('published_at', 'desc')
            ->with(['author', 'postType', 'taxonomyTerms'])
            ->paginate($this->getPerPage());

        $presented = $this->postPresenter->presentPaginator($posts);
        $data = [
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
            'posts' => [
                'data' => $presented['data'],
            ],
            'pagination' => $presented['pagination'],
        ];

        $template = $this->templateResolver->taxonomyTemplate();
        return $this->reactRenderer->render($template, $data);
    }
}
