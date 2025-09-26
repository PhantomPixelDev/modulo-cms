<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view users')->only(['index']);
        $this->middleware('permission:create users')->only(['create', 'store']);
        $this->middleware('permission:edit users')->only(['edit', 'update']);
        $this->middleware('permission:delete users')->only(['destroy']);
    }

    /**
     * Display a listing of users.
     */
    public function index(): Response
    {
        $users = User::with('roles')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        $permissions = auth()->user()?->getAllPermissions()->map(function ($permission) {
            return ['id' => $permission->id, 'name' => $permission->name];
        });

        return Inertia::render('Dashboard', [
            'adminSection' => 'users',
            'users' => $users,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): Response
    {
        $roles = Role::all();
        $permissions = auth()->user()?->getAllPermissions()->map(function ($permission) {
            return ['id' => $permission->id, 'name' => $permission->name];
        });

        return Inertia::render('Dashboard', [
            'adminSection' => 'users.create',
            'allRoles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $this->authorize('create', User::class);
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'roles' => 'array',
            'roles.*' => 'integer|exists:roles,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
        ]);

        if ($request->has('roles')) {
            // Frontend sends role IDs; convert to role names for Spatie
            $roleNames = Role::whereIn('id', (array) $request->roles)->pluck('name')->all();
            // Prevent non-super-admins from assigning super-admin role
            if (in_array('super-admin', $roleNames, true) && !auth()->user()->hasRole('super-admin')) {
                return redirect()->route('dashboard.admin.users.index')
                    ->with('error', 'You cannot assign the super-admin role.');
            }
            if ($roleNames) {
                $user->assignRole($roleNames);
            }
        }

        return redirect()->route('dashboard.admin.users.index')
            ->with('success', 'User created successfully.');
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user): Response
    {
        $this->authorize('update', $user);
        $roles = Role::all();
        $user->load('roles');
        $permissions = auth()->user()?->getAllPermissions()->map(function ($permission) {
            return ['id' => $permission->id, 'name' => $permission->name];
        });

        return Inertia::render('Dashboard', [
            'adminSection' => 'users.edit',
            'editUser' => $user->load('roles'),
            'allRoles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'roles' => 'array',
            'roles.*' => 'integer|exists:roles,id',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        if ($request->has('roles')) {
            // Convert role IDs to names for Spatie
            $roleNames = Role::whereIn('id', (array) $request->roles)->pluck('name')->all();
            // Prevent non-super-admins from assigning super-admin role
            if (in_array('super-admin', $roleNames, true) && !auth()->user()->hasRole('super-admin')) {
                return redirect()->route('dashboard.admin.users.index')
                    ->with('error', 'You cannot assign the super-admin role.');
            }
            $user->syncRoles($roleNames);
        }

        return redirect()->route('dashboard.admin.users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        $this->authorize('delete', $user);
        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete yourself.');
        }

        // Prevent deleting super-admin unless current user is also super-admin
        if ($user->hasRole('super-admin') && !auth()->user()->hasRole('super-admin')) {
            return back()->with('error', 'You cannot delete a super-admin unless you are a super-admin.');
        }

        $user->delete();

        return redirect()->route('dashboard.admin.users.index')
            ->with('success', 'User deleted successfully.');
    }
} 