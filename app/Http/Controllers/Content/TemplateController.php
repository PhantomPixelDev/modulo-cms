<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Template;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $templates = Template::with('creator')
            ->orderBy('type')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('Dashboard', [
            'adminSection' => 'templates',
            'templates' => $templates->through(function ($template) {
                return [
                    'id' => $template->id,
                    'name' => $template->name,
                    'slug' => $template->slug,
                    'type' => $template->type,
                    'description' => $template->description,
                    'is_default' => $template->is_default,
                    'is_active' => $template->is_active,
                    'created_at' => $template->created_at,
                    'creator' => $template->creator ? [
                        'id' => $template->creator->id,
                        'name' => $template->creator->name,
                    ] : null,
                ];
            }),
            'templatesPagination' => [
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
            ],
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
        return Inertia::render('Dashboard', [
            'adminSection' => 'templates.create',
            'templateTypes' => Template::getAvailableTypes(),
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
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:' . implode(',', array_keys(Template::getAvailableTypes())),
            'description' => 'nullable|string',
            'content' => 'required|string',
            'variables' => 'nullable|array',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // If setting as default, remove default from other templates of same type
        if ($request->is_default) {
            Template::where('type', $request->type)->update(['is_default' => false]);
        }

        Template::create([
            'name' => $request->name,
            'type' => $request->type,
            'description' => $request->description,
            'content' => $request->content,
            'variables' => $request->variables ?? [],
            'is_default' => $request->is_default ?? false,
            'is_active' => $request->is_active ?? true,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('dashboard.admin.templates.index')
            ->with('success', 'Template created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Template $template)
    {
        $template->load('creator');
        
        return Inertia::render('Dashboard', [
            'adminSection' => 'templates.show',
            'template' => [
                'id' => $template->id,
                'name' => $template->name,
                'slug' => $template->slug,
                'type' => $template->type,
                'description' => $template->description,
                'content' => $template->content,
                'variables' => $template->variables,
                'is_default' => $template->is_default,
                'is_active' => $template->is_active,
                'created_at' => $template->created_at,
                'updated_at' => $template->updated_at,
                'creator' => $template->creator ? [
                    'id' => $template->creator->id,
                    'name' => $template->creator->name,
                ] : null,
            ],
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
    public function edit(Template $template)
    {
        return Inertia::render('Dashboard', [
            'adminSection' => 'templates.edit',
            'editTemplate' => [
                'id' => $template->id,
                'name' => $template->name,
                'slug' => $template->slug,
                'type' => $template->type,
                'description' => $template->description,
                'content' => $template->content,
                'variables' => $template->variables,
                'is_default' => $template->is_default,
                'is_active' => $template->is_active,
            ],
            'templateTypes' => Template::getAvailableTypes(),
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
    public function update(Request $request, Template $template)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:' . implode(',', array_keys(Template::getAvailableTypes())),
            'description' => 'nullable|string',
            'content' => 'required|string',
            'variables' => 'nullable|array',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // If setting as default, remove default from other templates of same type
        if ($request->is_default && !$template->is_default) {
            Template::where('type', $request->type)
                ->where('id', '!=', $template->id)
                ->update(['is_default' => false]);
        }

        $template->update([
            'name' => $request->name,
            'type' => $request->type,
            'description' => $request->description,
            'content' => $request->content,
            'variables' => $request->variables ?? [],
            'is_default' => $request->is_default ?? false,
            'is_active' => $request->is_active ?? true,
        ]);

        return redirect()->route('dashboard.admin.templates.index')
            ->with('success', 'Template updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Template $template)
    {
        // Prevent deleting default templates
        if ($template->is_default) {
            return back()->with('error', 'Cannot delete default templates.');
        }

        $template->delete();
        
        return back()->with('success', 'Template deleted successfully.');
    }
}
