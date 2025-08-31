<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PostTypeRequest;
use App\Models\PostType;
use App\Services\PostTypeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PostTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = PostType::query();

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
        $postTypes = $query->paginate($perPage);

        return Inertia::render('Dashboard/Admin/PostTypes/Index', [
            'postTypes' => $postTypes,
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Admin/PostTypes/Create');
    }

    public function store(PostTypeRequest $request)
    {
        $postType = PostType::create($request->validated());
        // Invalidate caches so dynamic routing/templates reflect immediately
        app(PostTypeService::class)->clearCaches();
        return redirect()->route('dashboard.admin.post-types.show', $postType->id)
                         ->with('success', 'Post Type created successfully.');
    }

    public function show(PostType $postType)
    {
        return Inertia::render('Dashboard/Admin/PostTypes/Show', [
            'postType' => $postType,
        ]);
    }

    public function edit(PostType $postType)
    {
        return Inertia::render('Dashboard/Admin/PostTypes/Edit', [
            'postType' => $postType,
        ]);
    }

    public function update(PostTypeRequest $request, PostType $postType)
    {
        $postType->update($request->validated());
        app(PostTypeService::class)->clearCaches();
        return redirect()->route('dashboard.admin.post-types.show', $postType->id)
                         ->with('success', 'Post Type updated successfully.');
    }

    public function destroy(PostType $postType)
    {
        $postType->delete();
        app(PostTypeService::class)->clearCaches();
        return redirect()->route('dashboard.admin.post-types.index')
                         ->with('success', 'Post Type deleted successfully.');
    }
}
