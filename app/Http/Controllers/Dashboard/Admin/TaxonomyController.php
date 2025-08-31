<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaxonomyRequest;
use App\Models\Taxonomy;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaxonomyController extends Controller
{
    public function index(Request $request)
    {
        $query = Taxonomy::query();

        // Apply search filter
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%$search%")
                  ->orWhere('label', 'like', "%$search%");
        }

        // Apply sorting
        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');
        $query->orderBy($sort, $direction);

        // Apply pagination
        $perPage = $request->input('per_page', 10);
        $taxonomies = $query->paginate($perPage);

        return Inertia::render('Dashboard/Admin/Taxonomies/Index', [
            'taxonomies' => $taxonomies,
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Admin/Taxonomies/Create');
    }

    public function store(TaxonomyRequest $request)
    {
        $taxonomy = Taxonomy::create($request->validated());
        return redirect()->route('dashboard.admin.taxonomies.show', $taxonomy->id)
                         ->with('success', 'Taxonomy created successfully.');
    }

    public function show(Taxonomy $taxonomy)
    {
        return Inertia::render('Dashboard/Admin/Taxonomies/Show', [
            'taxonomy' => $taxonomy,
        ]);
    }

    public function edit(Taxonomy $taxonomy)
    {
        return Inertia::render('Dashboard/Admin/Taxonomies/Edit', [
            'taxonomy' => $taxonomy,
        ]);
    }

    public function update(TaxonomyRequest $request, Taxonomy $taxonomy)
    {
        $taxonomy->update($request->validated());
        return redirect()->route('dashboard.admin.taxonomies.show', $taxonomy->id)
                         ->with('success', 'Taxonomy updated successfully.');
    }

    public function destroy(Taxonomy $taxonomy)
    {
        $taxonomy->delete();
        return redirect()->route('dashboard.admin.taxonomies.index')
                         ->with('success', 'Taxonomy deleted successfully.');
    }
}
