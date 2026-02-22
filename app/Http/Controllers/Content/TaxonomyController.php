<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Taxonomy;
use App\Models\PostType;
use App\Models\Locale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TaxonomyController extends Controller
{
    // Policies govern all actions for taxonomies

    /**
     * Generate a unique slug for Taxonomy across all records.
     */
    protected function makeUniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base);
        $original = $slug;
        $i = 2;
        while (Taxonomy::where('slug', $slug)
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
    public function index()
    {
        $this->authorize('viewAny', Taxonomy::class);
        $perPage = \App\Models\SiteSetting::get('posts_per_page', 15);
        $taxonomies = Taxonomy::orderBy('menu_position')->paginate($perPage);

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomies',
            'taxonomies' => $taxonomies,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $this->authorize('create', Taxonomy::class);
        $postTypes = PostType::all();

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomies.create',
            'postTypes' => $postTypes,
            'locales' => Locale::getActive(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Taxonomy::class);
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:taxonomies',
            'label' => 'required|string|max:255',
            'plural_label' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_hierarchical' => 'boolean',
            'is_public' => 'boolean',
            'post_types' => 'array',
            'show_in_menu' => 'boolean',
            'menu_icon' => 'nullable|string',
            'menu_position' => 'integer|min:0|max:100',
            'translations' => 'sometimes|array',
            'translations.*.locale' => ['required','string','max:8', Rule::exists('locales', 'code')],
            'translations.*.label' => 'nullable|string|max:255',
            'translations.*.plural_label' => 'nullable|string|max:255',
            'translations.*.description' => 'nullable|string',
        ]);

        $taxonomy = Taxonomy::create([
            'name' => $validated['name'],
            'label' => $validated['label'],
            'plural_label' => $validated['plural_label'],
            'description' => $validated['description'] ?? null,
            'slug' => $this->makeUniqueSlug($validated['name']),
            'is_hierarchical' => (bool) ($validated['is_hierarchical'] ?? false),
            'is_public' => (bool) ($validated['is_public'] ?? true),
            'post_types' => $validated['post_types'] ?? [],
            'show_in_menu' => (bool) ($validated['show_in_menu'] ?? true),
            'menu_icon' => $validated['menu_icon'] ?? null,
            'menu_position' => $validated['menu_position'] ?? 5,
        ]);

        $this->syncTaxonomyTranslations($taxonomy, $validated['translations'] ?? []);

        return redirect()->route('dashboard.admin.taxonomies.index')->with('success', 'Taxonomy created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Taxonomy $taxonomy)
    {
        $this->authorize('view', $taxonomy);
        $taxonomy->load([
            'terms',
            'terms.posts' => function ($q) {
                $q->with(['author:id,name', 'postType:id,label,name']);
            },
        ]);
        
        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomies.show',
            'taxonomy' => $taxonomy,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Taxonomy $taxonomy)
    {
        $this->authorize('update', $taxonomy);
        $postTypes = PostType::all();
        $taxonomy->load('translations');

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomies.edit',
            'editTaxonomy' => $taxonomy,
            'postTypes' => $postTypes,
            'locales' => Locale::getActive(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Taxonomy $taxonomy)
    {
        $this->authorize('update', $taxonomy);
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:taxonomies,name,' . $taxonomy->id,
            'label' => 'required|string|max:255',
            'plural_label' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_hierarchical' => 'boolean',
            'is_public' => 'boolean',
            'post_types' => 'array',
            'show_in_menu' => 'boolean',
            'menu_icon' => 'nullable|string',
            'menu_position' => 'integer|min:0|max:100',
            'translations' => 'sometimes|array',
            'translations.*.locale' => ['required','string','max:8', Rule::exists('locales', 'code')],
            'translations.*.label' => 'nullable|string|max:255',
            'translations.*.plural_label' => 'nullable|string|max:255',
            'translations.*.description' => 'nullable|string',
        ]);

        $taxonomy->update([
            'name' => $validated['name'],
            'label' => $validated['label'],
            'plural_label' => $validated['plural_label'],
            'description' => $validated['description'] ?? null,
            'slug' => $this->makeUniqueSlug($validated['name'], $taxonomy->id),
            'is_hierarchical' => (bool) ($validated['is_hierarchical'] ?? false),
            'is_public' => (bool) ($validated['is_public'] ?? true),
            'post_types' => $validated['post_types'] ?? [],
            'show_in_menu' => (bool) ($validated['show_in_menu'] ?? true),
            'menu_icon' => $validated['menu_icon'] ?? null,
            'menu_position' => $validated['menu_position'] ?? 5,
        ]);

        $this->syncTaxonomyTranslations($taxonomy, $validated['translations'] ?? []);

        return redirect()->route('dashboard.admin.taxonomies.index')->with('success', 'Taxonomy updated successfully.');
    }

    protected function syncTaxonomyTranslations(Taxonomy $taxonomy, array $translations = []): void
    {
        $defaultLocale = Locale::getDefault()?->code ?? config('app.fallback_locale', 'en');
        $handledLocales = [];

        foreach ($translations as $translation) {
            $locale = $translation['locale'] ?? null;
            if (!$locale) {
                continue;
            }

            $payload = [
                'label' => $translation['label'] ?? $taxonomy->label,
                'plural_label' => $translation['plural_label'] ?? $taxonomy->plural_label,
                'description' => $translation['description'] ?? $taxonomy->description,
            ];

            $taxonomy->setTranslation($locale, $payload);
            $handledLocales[] = $locale;
        }

        if (!in_array($defaultLocale, $handledLocales, true)) {
            $taxonomy->setTranslation($defaultLocale, [
                'label' => $taxonomy->label,
                'plural_label' => $taxonomy->plural_label,
                'description' => $taxonomy->description,
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Taxonomy $taxonomy)
    {
        $this->authorize('delete', $taxonomy);
        // Prevent deleting default taxonomies
        if (in_array($taxonomy->name, ['category', 'post_tag'])) {
            return back()->with('error', 'Cannot delete default taxonomies.');
        }

        $taxonomy->delete();
        return back()->with('success', 'Taxonomy deleted successfully.');
    }
}
