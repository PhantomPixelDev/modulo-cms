<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\TaxonomyTerm;
use App\Models\TaxonomyTermTranslation;
use App\Models\Taxonomy;
use App\Models\Locale;
use Illuminate\Http\Request;
use App\Http\Requests\TaxonomyTermRequest;
use Inertia\Inertia;
use Illuminate\Support\Str;

class TaxonomyTermController extends Controller
{
    /**
     * Generate a unique slug within a taxonomy for a term.
     */
    protected function makeUniqueSlug(string $base, int $taxonomyId, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base);
        $original = $slug;
        $i = 2;
        while (\App\Models\TaxonomyTerm::where('taxonomy_id', $taxonomyId)
            ->where('slug', $slug)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $original . '-' . $i;
            $i++;
        }
        return $slug;
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', \App\Models\TaxonomyTerm::class);
        $query = TaxonomyTerm::with('taxonomy')->orderBy('term_order');

        if ($request->has('taxonomy_id')) {
            $query->where('taxonomy_id', $request->taxonomy_id);
        }

        $perPage = \App\Models\SiteSetting::get('posts_per_page', 15);
        $terms = $query->paginate($perPage);

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomy-terms',
            'taxonomyTerms' => $terms,
            'taxonomies' => Taxonomy::all(),
        ]);
    }

    /**
     * Display a listing of taxonomy terms by taxonomy slug.
     */
    public function indexByTaxonomy(Request $request, string $taxonomySlug)
    {
        // Find the taxonomy by slug
        $taxonomy = Taxonomy::where('slug', $taxonomySlug)->firstOrFail();
        
        $this->authorize('viewAny', \App\Models\TaxonomyTerm::class);
        $query = TaxonomyTerm::with('taxonomy')
            ->where('taxonomy_id', $taxonomy->id)
            ->orderBy('term_order');

        $perPage = \App\Models\SiteSetting::get('posts_per_page', 15);
        $terms = $query->paginate($perPage);

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomy-terms',
            'taxonomyTerms' => $terms,
            'currentTaxonomy' => $taxonomy,
            'taxonomies' => Taxonomy::all(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $this->authorize('create', \App\Models\TaxonomyTerm::class);
        $taxonomies = Taxonomy::all();
        $parentTerms = TaxonomyTerm::whereNull('parent_id')->get();

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomy-terms.create',
            'taxonomies' => $taxonomies,
            'parentTerms' => $parentTerms,
            'locales' => Locale::getActive(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TaxonomyTermRequest $request)
    {
        $this->authorize('create', \App\Models\TaxonomyTerm::class);
        $data = $request->validated();
        $translationsPayload = $data['translations'] ?? [];
        unset($data['translations']);

        $data['slug'] = $this->makeUniqueSlug($data['name'], (int) $data['taxonomy_id']);
        $data['term_order'] = $data['term_order'] ?? 0;
        $term = TaxonomyTerm::create($data);

        $this->syncTranslations($term, $translationsPayload);

        return redirect()->route('dashboard.admin.taxonomy-terms.index')->with('success', 'Taxonomy term created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(TaxonomyTerm $taxonomyTerm)
    {
        $this->authorize('view', $taxonomyTerm);
        $taxonomyTerm->load([
            'taxonomy',
            'parent',
            'children',
            'posts' => function ($q) {
                $q->with(['author:id,name', 'postType:id,label,name']);
            },
        ]);
        
        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomy-terms.show',
            'taxonomyTerm' => $taxonomyTerm,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TaxonomyTerm $taxonomyTerm)
    {
        $this->authorize('update', $taxonomyTerm);
        $taxonomies = Taxonomy::all();
        $parentTerms = TaxonomyTerm::whereNull('parent_id')
            ->where('id', '!=', $taxonomyTerm->id)
            ->get();

        $taxonomyTerm->load('translations');

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomy-terms.edit',
            'editTaxonomyTerm' => $taxonomyTerm,
            'taxonomies' => $taxonomies,
            'parentTerms' => $parentTerms,
            'locales' => Locale::getActive(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TaxonomyTermRequest $request, TaxonomyTerm $taxonomyTerm)
    {
        $this->authorize('update', $taxonomyTerm);
        $data = $request->validated();
        $translationsPayload = $data['translations'] ?? [];
        unset($data['translations']);

        $data['slug'] = $this->makeUniqueSlug($data['name'], (int) $data['taxonomy_id'], $taxonomyTerm->id);
        $data['term_order'] = $data['term_order'] ?? 0;
        $taxonomyTerm->update($data);

        $this->syncTranslations($taxonomyTerm, $translationsPayload);

        return redirect()->route('dashboard.admin.taxonomy-terms.index')->with('success', 'Taxonomy term updated successfully.');
    }

    protected function syncTranslations(TaxonomyTerm $term, array $translations = []): void
    {
        $term->loadMissing('translations');
        $defaultLocale = Locale::getDefault()?->code ?? config('app.fallback_locale', 'en');
        $handledLocales = [];

        foreach ($translations as $translation) {
            $locale = $translation['locale'] ?? null;
            if (!$locale) {
                continue;
            }

            $existing = $term->translations->firstWhere('locale', $locale);

            $name = $translation['name'] ?? $term->name;
            $slugSeed = $translation['slug'] ?? $name ?? $term->slug;
            $slug = $this->makeUniqueTranslationSlug($slugSeed, $locale, $existing?->id);

            $payload = [
                'name' => $name,
                'slug' => $slug,
                'description' => $translation['description'] ?? $term->description,
                'meta_title' => $translation['meta_title'] ?? $term->meta_title,
                'meta_description' => $translation['meta_description'] ?? $term->meta_description,
                'meta_data' => $translation['meta_data'] ?? $term->meta_data,
            ];

            $term->setTranslation($locale, $payload);
            $handledLocales[] = $locale;
        }

        if (!in_array($defaultLocale, $handledLocales, true)) {
            $term->setTranslation($defaultLocale, [
                'name' => $term->name,
                'slug' => $term->slug,
                'description' => $term->description,
                'meta_title' => $term->meta_title,
                'meta_description' => $term->meta_description,
                'meta_data' => $term->meta_data,
            ]);
        }
    }

    protected function makeUniqueTranslationSlug(string $base, string $locale, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: Str::slug($base . '-' . uniqid());
        if (!$slug) {
            $slug = 'term-' . uniqid();
        }

        $original = $slug;
        $counter = 2;

        while (
            TaxonomyTermTranslation::where('locale', $locale)
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $original . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TaxonomyTerm $taxonomyTerm)
    {
        $this->authorize('delete', $taxonomyTerm);
        // Prevent deleting default terms
        if (in_array($taxonomyTerm->name, ['Uncategorized'])) {
            return back()->with('error', 'Cannot delete default taxonomy terms.');
        }

        // Prevent deleting if has children to avoid orphaning grandchildren
        if ($taxonomyTerm->children()->exists()) {
            return back()->with('error', 'Cannot delete a term that has child terms. Remove or reassign its children first.');
        }

        $taxonomyTerm->delete();
        return back()->with('success', 'Taxonomy term deleted successfully.');
    }
}
