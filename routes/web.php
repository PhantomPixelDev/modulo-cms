<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();
        $isAdmin = $user && $user->hasRole(['admin', 'super-admin']);
        
        $data = [
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->map(function ($role) {
                    return ['id' => $role->id, 'name' => $role->name];
                }),
            ] : null,
        ];
        
        if ($isAdmin) {
            $data['adminStats'] = [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'posts' => \App\Models\Post::count(),
                'postTypes' => \App\Models\PostType::count(),
                'taxonomies' => \App\Models\Taxonomy::count(),
                'taxonomyTerms' => \App\Models\TaxonomyTerm::count(),
            ];
            
            // Add user and role data for admin dashboard
            $data['users'] = \App\Models\User::with('roles')
                ->orderBy('created_at', 'desc')
                ->paginate(5);
                
            $data['roles'] = \Spatie\Permission\Models\Role::with('permissions')
                ->orderBy('name')
                ->paginate(5);
                
            $data['allRoles'] = \Spatie\Permission\Models\Role::all();
            
            // Add content data for admin dashboard
            $data['posts'] = \App\Models\Post::with(['postType', 'author'])
                ->orderBy('created_at', 'desc')
                ->paginate(5);
                
            $data['postTypes'] = \App\Models\PostType::all();
        }
        
        return Inertia::render('dashboard', $data);
    })->name('dashboard');

    // Admin routes within dashboard
    Route::prefix('dashboard/admin')->name('dashboard.admin.')->middleware(['auth', 'verified'])->group(function () {
        // Users management
        Route::get('/users', function () {
            $users = \App\Models\User::with('roles')
                ->orderBy('created_at', 'desc')
                ->paginate(15);
            
            return Inertia::render('dashboard', [
                'adminSection' => 'users',
                'users' => $users,
                'adminStats' => [
                    'users' => \App\Models\User::count(),
                    'roles' => \Spatie\Permission\Models\Role::count(),
                    'content' => 0,
                    'plugins' => 0,
                ],
            ]);
        })->middleware('permission:view users')->name('users.index');

        Route::post('/users', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
                'roles' => 'array',
            ]);

            $user = \App\Models\User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => bcrypt($request->password),
            ]);

            if ($request->roles) {
                $user->assignRole($request->roles);
            }

            return redirect()->route('dashboard.admin.users.index')->with('success', 'User created successfully.');
        })->middleware('permission:create users')->name('users.store');

        Route::get('/users/create', function () {
            $roles = \Spatie\Permission\Models\Role::all();
            
            return Inertia::render('dashboard', [
                'adminSection' => 'users.create',
                'allRoles' => $roles,
                'adminStats' => [
                    'users' => \App\Models\User::count(),
                    'roles' => \Spatie\Permission\Models\Role::count(),
                    'content' => 0,
                    'plugins' => 0,
                ],
            ]);
        })->middleware('permission:create users')->name('users.create');

        Route::put('/users/{user}', function (\Illuminate\Http\Request $request, \App\Models\User $user) {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
                'roles' => 'array',
            ]);

            $user->update([
                'name' => $request->name,
                'email' => $request->email,
            ]);

            $user->syncRoles($request->roles ?? []);

            return redirect()->route('dashboard.admin.users.index')->with('success', 'User updated successfully.');
        })->middleware('permission:edit users')->name('users.update');

        Route::get('/users/{user}/edit', function (\App\Models\User $user) {
            $roles = \Spatie\Permission\Models\Role::all();
            $user->load('roles');
            
            return Inertia::render('dashboard', [
                'adminSection' => 'users.edit',
                'editUser' => $user,
                'allRoles' => $roles,
                'adminStats' => [
                    'users' => \App\Models\User::count(),
                    'roles' => \Spatie\Permission\Models\Role::count(),
                    'content' => 0,
                    'plugins' => 0,
                ],
            ]);
        })->middleware('permission:edit users')->name('users.edit');

        Route::delete('/users/{user}', function (\App\Models\User $user) {
            // Prevent deleting super-admin users
            if ($user->hasRole('super-admin')) {
                return back()->with('error', 'Cannot delete super-admin users.');
            }

            $user->delete();
            return back()->with('success', 'User deleted successfully.');
        })->middleware('permission:delete users')->name('users.destroy');

        // Roles management
        Route::get('/roles', function () {
            $roles = \Spatie\Permission\Models\Role::with('permissions')
                ->orderBy('name')
                ->paginate(15);
            
            return Inertia::render('dashboard', [
                'adminSection' => 'roles',
                'roles' => $roles,
                'adminStats' => [
                    'users' => \App\Models\User::count(),
                    'roles' => \Spatie\Permission\Models\Role::count(),
                    'content' => 0,
                    'plugins' => 0,
                ],
            ]);
        })->middleware('permission:view roles')->name('roles.index');

        Route::post('/roles', function (\Illuminate\Http\Request $request) {
            $request->validate([
                'name' => 'required|string|max:255|unique:roles',
                'permissions' => 'array',
            ]);

            $role = \Spatie\Permission\Models\Role::create([
                'name' => $request->name,
            ]);

            if ($request->permissions) {
                $role->syncPermissions($request->permissions);
            }

            return redirect()->route('dashboard.admin.roles.index')->with('success', 'Role created successfully.');
        })->middleware('permission:create roles')->name('roles.store');

        Route::get('/roles/create', function () {
            $permissions = \Spatie\Permission\Models\Permission::orderBy('name')->get();
            
            return Inertia::render('dashboard', [
                'adminSection' => 'roles.create',
                'permissions' => $permissions,
                'adminStats' => [
                    'users' => \App\Models\User::count(),
                    'roles' => \Spatie\Permission\Models\Role::count(),
                    'content' => 0,
                    'plugins' => 0,
                ],
            ]);
        })->middleware('permission:create roles')->name('roles.create');

        Route::put('/roles/{role}', function (\Illuminate\Http\Request $request, \Spatie\Permission\Models\Role $role) {
            $request->validate([
                'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
                'permissions' => 'array',
            ]);

            $role->update([
                'name' => $request->name,
            ]);

            $role->syncPermissions($request->permissions ?? []);

            return redirect()->route('dashboard.admin.roles.index')->with('success', 'Role updated successfully.');
        })->middleware('permission:edit roles')->name('roles.update');

        Route::get('/roles/{role}/edit', function (\Spatie\Permission\Models\Role $role) {
            $permissions = \Spatie\Permission\Models\Permission::orderBy('name')->get();
            $role->load('permissions');
            
            return Inertia::render('dashboard', [
                'adminSection' => 'roles.edit',
                'editRole' => $role,
                'permissions' => $permissions,
                'adminStats' => [
                    'users' => \App\Models\User::count(),
                    'roles' => \Spatie\Permission\Models\Role::count(),
                    'content' => 0,
                    'plugins' => 0,
                ],
            ]);
        })->middleware('permission:edit roles')->name('roles.edit');

        Route::delete('/roles/{role}', function (\Spatie\Permission\Models\Role $role) {
            // Prevent deleting super-admin role
            if ($role->name === 'super-admin') {
                return back()->with('error', 'Cannot delete super-admin role.');
            }

            $role->delete();
            return back()->with('success', 'Role deleted successfully.');
        })->middleware('permission:delete roles')->name('roles.destroy');

        // Content Management Routes
        Route::resource('posts', \App\Http\Controllers\Content\PostController::class)->middleware('permission:view posts');
        Route::resource('post-types', \App\Http\Controllers\Content\PostTypeController::class)->middleware('permission:view post types');
        Route::get('/taxonomies', function () {
            $taxonomies = \App\Models\Taxonomy::orderBy('menu_position')->paginate(15);
            
            return Inertia::render('dashboard', [
                'adminSection' => 'taxonomies',
                'taxonomies' => $taxonomies,
                'adminStats' => [
                    'users' => \App\Models\User::count(),
                    'roles' => \Spatie\Permission\Models\Role::count(),
                    'posts' => \App\Models\Post::count(),
                    'postTypes' => \App\Models\PostType::count(),
                ],
            ]);
        })->middleware('permission:view taxonomies')->name('taxonomies.index');
        Route::resource('taxonomy-terms', \App\Http\Controllers\Content\TaxonomyTermController::class)->middleware('permission:view taxonomy terms');
        Route::post('/taxonomies', [\App\Http\Controllers\Content\TaxonomyController::class, 'store'])->middleware('permission:create taxonomies')->name('taxonomies.store');
        Route::get('/taxonomies/create', [\App\Http\Controllers\Content\TaxonomyController::class, 'create'])->middleware('permission:create taxonomies')->name('taxonomies.create');
        Route::get('/taxonomies/{taxonomy}', [\App\Http\Controllers\Content\TaxonomyController::class, 'show'])->middleware('permission:view taxonomies')->name('taxonomies.show');
        Route::put('/taxonomies/{taxonomy}', [\App\Http\Controllers\Content\TaxonomyController::class, 'update'])->middleware('permission:edit taxonomies')->name('taxonomies.update');
        Route::get('/taxonomies/{taxonomy}/edit', [\App\Http\Controllers\Content\TaxonomyController::class, 'edit'])->middleware('permission:edit taxonomies')->name('taxonomies.edit');
        Route::delete('/taxonomies/{taxonomy}', [\App\Http\Controllers\Content\TaxonomyController::class, 'destroy'])->middleware('permission:delete taxonomies')->name('taxonomies.destroy');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
