<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoleRequest;
use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $query = Role::query();

        // Apply search filter
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%$search%");
        }

        // Apply sorting
        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');
        $query->orderBy($sort, $direction);

        // Apply pagination
        $perPage = $request->input('per_page', 10);
        $roles = $query->paginate($perPage);

        return Inertia::render('Dashboard/Admin/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    public function create()
    {
        return Inertia::render('Dashboard/Admin/Roles/Create');
    }

    public function store(RoleRequest $request)
    {
        $role = Role::create($request->validated());
        return redirect()->route('dashboard.admin.roles.show', $role->id)
                         ->with('success', 'Role created successfully.');
    }

    public function show(Role $role)
    {
        return Inertia::render('Dashboard/Admin/Roles/Show', [
            'role' => $role,
        ]);
    }

    public function edit(Role $role)
    {
        return Inertia::render('Dashboard/Admin/Roles/Edit', [
            'role' => $role,
        ]);
    }

    public function update(RoleRequest $request, Role $role)
    {
        $role->update($request->validated());
        return redirect()->route('dashboard.admin.roles.show', $role->id)
                         ->with('success', 'Role updated successfully.');
    }

    public function destroy(Role $role)
    {
        $role->delete();
        return redirect()->route('dashboard.admin.roles.index')
                         ->with('success', 'Role deleted successfully.');
    }
}
