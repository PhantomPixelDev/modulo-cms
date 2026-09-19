<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

it('forbids non-super-admins from editing the super-admin role', function () {
    $superRole = Role::findOrCreate('super-admin', 'web');
    $user = makeAdminUserWithPermissions(['edit roles']);

    $this->actingAs($user)
        ->put(route('dashboard.admin.roles.update', $superRole), ['name' => 'owned', 'permissions' => []])
        ->assertForbidden();

    expect($superRole->fresh()->name)->toBe('super-admin');
});

it('refuses to rename system roles', function () {
    $adminRole = Role::findOrCreate('admin', 'web');
    $user = makeAdminUserWithPermissions(['edit roles']);

    $this->actingAs($user)
        ->put(route('dashboard.admin.roles.update', $adminRole), ['name' => 'renamed'])
        ->assertSessionHasErrors('name');

    expect($adminRole->fresh()->name)->toBe('admin');
});

it('refuses to grant permissions the actor does not hold', function () {
    Permission::findOrCreate('delete users', 'web');
    $role = Role::findOrCreate('helpers', 'web');
    $user = makeAdminUserWithPermissions(['edit roles']);

    $this->actingAs($user)
        ->put(route('dashboard.admin.roles.update', $role), [
            'name' => 'helpers',
            'permissions' => ['delete users'],
        ])
        ->assertSessionHasErrors('permissions');

    expect($role->fresh()->hasPermissionTo('delete users'))->toBeFalse();
});

it('lets actors grant permissions they hold and keeps ones outside their reach', function () {
    $secret = Permission::findOrCreate('system settings', 'web');
    $role = Role::findOrCreate('helpers', 'web');
    $role->givePermissionTo($secret);

    $user = makeAdminUserWithPermissions(['edit roles', 'view posts']);
    $viewPosts = Permission::findByName('view posts', 'web');

    $this->actingAs($user)
        ->put(route('dashboard.admin.roles.update', $role), [
            'name' => 'helpers',
            'permissions' => [$viewPosts->id], // ids, as the admin UI sends them
        ])
        ->assertRedirect(route('dashboard.admin.roles.index'));

    $role->refresh();
    expect($role->hasPermissionTo('view posts'))->toBeTrue()
        ->and($role->hasPermissionTo('system settings'))->toBeTrue();
});

it('rejects unknown permissions with a validation error', function () {
    $user = makeAdminUserWithPermissions(['create roles']);

    $this->actingAs($user)
        ->post(route('dashboard.admin.roles.store'), ['name' => 'x', 'permissions' => ['does not exist']])
        ->assertSessionHasErrors('permissions');

    expect(Role::where('name', 'x')->exists())->toBeFalse();
});

it('forbids users from changing their own roles', function () {
    $powerful = Role::findOrCreate('powerful', 'web');
    $user = makeAdminUserWithPermissions(['edit users']);

    $this->actingAs($user)
        ->put(route('dashboard.admin.users.update', $user), [
            'name' => $user->name,
            'email' => $user->email,
            'roles' => [$powerful->id],
        ])
        ->assertSessionHas('error');

    expect($user->fresh()->hasRole('powerful'))->toBeFalse();
});

it('forbids assigning roles that carry permissions the actor lacks', function () {
    Permission::findOrCreate('delete users', 'web');
    $role = Role::findOrCreate('deleters', 'web');
    $role->givePermissionTo('delete users');

    $actor = makeAdminUserWithPermissions(['edit users']);
    $target = User::factory()->create();

    $this->actingAs($actor)
        ->put(route('dashboard.admin.users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'roles' => [$role->id],
        ])
        ->assertSessionHas('error');

    expect($target->fresh()->hasRole('deleters'))->toBeFalse();
});
