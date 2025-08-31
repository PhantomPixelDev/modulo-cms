<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\TaxonomyTerm;
use App\Models\Taxonomy;
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
        $query = TaxonomyTerm::with('taxonomy')->orderBy('term_order');

        if ($request->has('taxonomy_id')) {
            $query->where('taxonomy_id', $request->taxonomy_id);
        }

        $terms = $query->paginate(15);

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomy-terms',
            'taxonomyTerms' => $terms,
            'taxonomies' => Taxonomy::all(),
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => \App\Models\Post::count(),
                'postTypes' => \App\Models\PostType::count(),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $taxonomies = Taxonomy::all();
        $parentTerms = TaxonomyTerm::whereNull('parent_id')->get();

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomy-terms.create',
            'taxonomies' => $taxonomies,
            'parentTerms' => $parentTerms,
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => \App\Models\Post::count(),
                'postTypes' => \App\Models\PostType::count(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(TaxonomyTermRequest $request)
    {
        $data = $request->validated();
        $data['slug'] = $this->makeUniqueSlug($data['name'], (int) $data['taxonomy_id']);
        $data['term_order'] = $data['term_order'] ?? 0;
        TaxonomyTerm::create($data);

        return redirect()->route('dashboard.admin.taxonomy-terms.index')->with('success', 'Taxonomy term created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(TaxonomyTerm $taxonomyTerm)
    {
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
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => \App\Models\Post::count(),
                'postTypes' => \App\Models\PostType::count(),
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(TaxonomyTerm $taxonomyTerm)
    {
        $taxonomies = Taxonomy::all();
        $parentTerms = TaxonomyTerm::whereNull('parent_id')
            ->where('id', '!=', $taxonomyTerm->id)
            ->get();

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomy-terms.edit',
            'editTaxonomyTerm' => $taxonomyTerm,
            'taxonomies' => $taxonomies,
            'parentTerms' => $parentTerms,
            'adminStats' => [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => \App\Models\Post::count(),
                'postTypes' => \App\Models\PostType::count(),
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(TaxonomyTermRequest $request, TaxonomyTerm $taxonomyTerm)
    {
        $data = $request->validated();
        $data['slug'] = $this->makeUniqueSlug($data['name'], (int) $data['taxonomy_id'], $taxonomyTerm->id);
        $data['term_order'] = $data['term_order'] ?? 0;
        $taxonomyTerm->update($data);

        return redirect()->route('dashboard.admin.taxonomy-terms.index')->with('success', 'Taxonomy term updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(TaxonomyTerm $taxonomyTerm)
    {
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
