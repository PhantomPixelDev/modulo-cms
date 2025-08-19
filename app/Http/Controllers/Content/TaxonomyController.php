<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Taxonomy;
use App\Models\PostType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class TaxonomyController extends Controller
{
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
        $taxonomies = Taxonomy::orderBy('menu_position')->paginate(15);

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomies',
            'taxonomies' => $taxonomies,
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
        $postTypes = PostType::all();

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomies.create',
            'postTypes' => $postTypes,
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
    public function store(Request $request)
    {
        $request->validate([
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
        ]);

        Taxonomy::create([
            'name' => $request->name,
            'label' => $request->label,
            'plural_label' => $request->plural_label,
            'description' => $request->description,
            'slug' => $this->makeUniqueSlug($request->name),
            'is_hierarchical' => (bool) ($request->is_hierarchical ?? false),
            'is_public' => (bool) ($request->is_public ?? true),
            'post_types' => $request->post_types ?? [],
            'show_in_menu' => (bool) ($request->show_in_menu ?? true),
            'menu_icon' => $request->menu_icon,
            'menu_position' => $request->menu_position ?? 5,
        ]);

        return redirect()->route('dashboard.admin.taxonomies.index')->with('success', 'Taxonomy created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Taxonomy $taxonomy)
    {
        $taxonomy->load(['terms', 'terms.posts']);
        
        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomies.show',
            'taxonomy' => $taxonomy,
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
    public function edit(Taxonomy $taxonomy)
    {
        $postTypes = PostType::all();

        return Inertia::render('Dashboard', [
            'adminSection' => 'taxonomies.edit',
            'editTaxonomy' => $taxonomy,
            'postTypes' => $postTypes,
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
    public function update(Request $request, Taxonomy $taxonomy)
    {
        $request->validate([
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
        ]);

        $taxonomy->update([
            'name' => $request->name,
            'label' => $request->label,
            'plural_label' => $request->plural_label,
            'description' => $request->description,
            'slug' => $this->makeUniqueSlug($request->name, $taxonomy->id),
            'is_hierarchical' => (bool) ($request->is_hierarchical ?? false),
            'is_public' => (bool) ($request->is_public ?? true),
            'post_types' => $request->post_types ?? [],
            'show_in_menu' => (bool) ($request->show_in_menu ?? true),
            'menu_icon' => $request->menu_icon,
            'menu_position' => $request->menu_position ?? 5,
        ]);

        return redirect()->route('dashboard.admin.taxonomies.index')->with('success', 'Taxonomy updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Taxonomy $taxonomy)
    {
        // Prevent deleting default taxonomies
        if (in_array($taxonomy->name, ['category', 'post_tag'])) {
            return back()->with('error', 'Cannot delete default taxonomies.');
        }

        $taxonomy->delete();
        return back()->with('success', 'Taxonomy deleted successfully.');
    }
}
