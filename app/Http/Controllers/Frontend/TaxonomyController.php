<?php

namespace App\Http\Controllers\Frontend;

use App\Models\Locale;
use App\Models\SiteSetting;
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
        if (config('theme.debug')) {
            \Log::debug('listByTaxonomyTerm', [
                'slug' => $slug,
                'taxonomySlug' => $taxonomySlug,
                'routeParams' => $request->route()->parameters(),
            ]);
        }
        
        $taxonomy = Taxonomy::where('slug', $taxonomySlug)
            ->where('is_public', true)
            ->firstOrFail();
            
        $term = TaxonomyTerm::with(['taxonomy', 'translations'])
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
                'localizations' => $this->buildLocalizationMap($term, $taxonomySlug),
            ],
            'posts' => [
                'data' => $presented['data'],
            ],
            'pagination' => $presented['pagination'],
        ];

        $template = $this->templateResolver->taxonomyTemplate();
        return $this->reactRenderer->render($template, $data);
    }

    protected function buildLocalizationMap(TaxonomyTerm $term, string $taxonomySlug): array
    {
        $defaultLocale = Locale::getDefault()?->code ?? config('app.fallback_locale', config('app.locale', 'en'));
        $baseSegment = $this->determineBaseSegment($taxonomySlug);
        $map = [];

        $map[$defaultLocale] = [
            'slug' => $term->slug,
            'path' => $this->buildTermPath($baseSegment, $term->slug),
        ];

        $translations = $term->relationLoaded('translations')
            ? $term->translations
            : $term->translations()->get();

        foreach ($translations as $translation) {
            if (!$translation->slug) {
                continue;
            }

            $map[$translation->locale] = [
                'slug' => $translation->slug,
                'path' => $this->buildTermPath($baseSegment, $translation->slug),
            ];
        }

        return array_filter($map, fn ($entry) => !empty($entry['path']));
    }

    protected function determineBaseSegment(string $taxonomySlug): string
    {
        $slug = trim($taxonomySlug);
        $categoryBase = SiteSetting::get('category_base', 'category');
        $tagBase = SiteSetting::get('tag_base', 'tag');

        return match ($slug) {
            'categories' => $categoryBase,
            'tags' => $tagBase,
            default => $slug,
        };
    }

    protected function buildTermPath(string $baseSegment, string $slug): string
    {
        $base = trim($baseSegment, '/');
        $termSlug = trim($slug, '/');

        return '/' . ltrim($base . '/' . $termSlug, '/');
    }
}
