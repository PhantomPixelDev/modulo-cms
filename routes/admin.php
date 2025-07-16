<?php

use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\User;
use Spatie\Permission\Models\Role;

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Redirect admin dashboard to main dashboard
    Route::get('/', function () {
        return redirect('/dashboard');
    })->name('dashboard');

    // Debug route to check user data
    Route::get('/debug', function () {
        $user = auth()->user();
        return response()->json([
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->map(function ($role) {
                    return ['id' => $role->id, 'name' => $role->name];
                }),
                'permissions' => $user->getAllPermissions()->map(function ($permission) {
                    return ['id' => $permission->id, 'name' => $permission->name];
                }),
            ] : null,
        ]);
    })->name('debug');

    // User management
    Route::get('/users', [UserController::class, 'index'])->middleware('permission:view users')->name('users.index');
    Route::get('/users/create', [UserController::class, 'create'])->middleware('permission:create users')->name('users.create');
    Route::post('/users', [UserController::class, 'store'])->middleware('permission:create users')->name('users.store');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])->middleware('permission:edit users')->name('users.edit');
    Route::put('/users/{user}', [UserController::class, 'update'])->middleware('permission:edit users')->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])->middleware('permission:delete users')->name('users.destroy');

    // Role management
    Route::get('/roles', [RoleController::class, 'index'])->middleware('permission:view roles')->name('roles.index');
    Route::get('/roles/create', [RoleController::class, 'create'])->middleware('permission:create roles')->name('roles.create');
    Route::post('/roles', [RoleController::class, 'store'])->middleware('permission:create roles')->name('roles.store');
    Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])->middleware('permission:edit roles')->name('roles.edit');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit roles')->name('roles.update');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:delete roles')->name('roles.destroy');
}); 