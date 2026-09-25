<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Policies\RolePolicy;
use App\Support\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view roles')->only(['index']);
        $this->middleware('permission:create roles')->only(['create', 'store']);
        $this->middleware('permission:edit roles')->only(['edit', 'update']);
        $this->middleware('permission:delete roles')->only(['destroy']);
    }

    /**
     * Display a listing of roles.
     */
    public function index(): Response
    {
        $roles = Role::with('permissions')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('Dashboard', [
            'adminSection' => 'roles',
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for creating a new role.
     */
    public function create(): Response
    {
        $permissions = Permission::orderBy('name')->get();

        return Inertia::render('Dashboard', [
            'adminSection' => 'roles.create',
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles',
            'permissions' => 'array',
        ]);

        $permissions = $this->permissionsToSync($this->resolvePermissions($request->input('permissions', [])));

        $role = Role::create([
            'name' => $request->name,
        ]);

        $role->syncPermissions($permissions);
        ActivityLog::record('role.permissions', 'Set the permissions of role "'.$role->name.'"', $role instanceof Model ? $role : null, ['permissions' => array_values((array) $permissions)]);

        return redirect()->route('dashboard.admin.roles.index')
            ->with('success', 'Role created successfully.');
    }

    /**
     * Show the form for editing the specified role.
     */
    public function edit(Role $role): Response
    {
        $this->authorize('update', $role);
        $permissions = Permission::orderBy('name')->get();
        $role->load('permissions');

        return Inertia::render('Dashboard', [
            'adminSection' => 'roles.edit',
            'editRole' => $role->load('permissions'),
            'permissions' => $permissions,
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, Role $role)
    {
        $this->authorize('update', $role);
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,'.$role->id,
            'permissions' => 'array',
        ]);

        if (in_array($role->name, RolePolicy::SYSTEM_ROLES, true) && $request->name !== $role->name) {
            throw ValidationException::withMessages(['name' => 'System roles cannot be renamed.']);
        }

        $permissions = $request->has('permissions')
            ? $this->permissionsToSync($this->resolvePermissions($request->input('permissions', [])), $role)
            : null;

        $role->update([
            'name' => $request->name,
        ]);

        if ($permissions !== null) {
            $role->syncPermissions($permissions);
            ActivityLog::record('role.permissions', 'Set the permissions of role "'.$role->name.'"', $role, ['permissions' => array_values((array) $permissions)]);
        }

        return redirect()->route('dashboard.admin.roles.index')
            ->with('success', 'Role updated successfully.');
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role)
    {
        $this->authorize('delete', $role);
        if ($role->name === 'super-admin') {
            return back()->with('error', 'Cannot delete super admin role.');
        }

        $role->delete();

        return redirect()->route('dashboard.admin.roles.index')
            ->with('success', 'Role deleted successfully.');
    }

    /**
     * Resolve submitted permission ids or names; unknown entries are a validation error.
     */
    protected function resolvePermissions(array $input): Collection
    {
        $input = array_values(array_unique(array_filter($input, fn ($v) => is_scalar($v) && $v !== '')));
        if ($input === []) {
            return collect();
        }

        $ids = array_map('intval', array_filter($input, 'is_numeric'));
        $names = array_values(array_filter($input, fn ($v) => ! is_numeric($v)));

        $permissions = Permission::query()
            ->where(fn ($q) => $q->whereIn('id', $ids)->orWhereIn('name', $names))
            ->get();

        if ($permissions->count() !== count($input)) {
            throw ValidationException::withMessages(['permissions' => 'One or more permissions do not exist.']);
        }

        return $permissions;
    }

    /**
     * Non-super-admins may only grant or revoke permissions they hold themselves.
     * Permissions outside their reach are left exactly as they were on the role.
     */
    protected function permissionsToSync(Collection $requested, ?Role $role = null): Collection
    {
        $actor = auth()->user();
        if ($actor->hasRole('super-admin')) {
            return $requested;
        }

        $held = $actor->getAllPermissions()->pluck('name');
        $existing = $role ? $role->permissions : collect();

        $escalating = $requested->pluck('name')
            ->diff($held)
            ->diff($existing->pluck('name'));

        if ($escalating->isNotEmpty()) {
            throw ValidationException::withMessages([
                'permissions' => 'You cannot grant permissions you do not have: '.$escalating->implode(', '),
            ]);
        }

        $untouchable = $existing->reject(fn ($p) => $held->contains($p->name));

        return $requested->filter(fn ($p) => $held->contains($p->name))
            ->merge($untouchable)
            ->unique('id')
            ->values();
    }
}
