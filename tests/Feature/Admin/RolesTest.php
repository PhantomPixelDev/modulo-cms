<?php

use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeUserWithPermissions(array $perms = []): User {
    $user = User::factory()->create();
    if (!empty($perms)) {
        foreach ($perms as $perm) {
            // ensure permission exists
            Spatie\Permission\Models\Permission::findOrCreate($perm, 'web');
        }
        $user->givePermissionTo($perms);
    }
    // Also give access admin permission which is required for admin routes
    Spatie\Permission\Models\Permission::findOrCreate('access admin', 'web');
    $user->givePermissionTo('access admin');
    return $user;
}

it('denies roles index without permission', function () {
    // Ensure permission exists but is not granted
    Spatie\Permission\Models\Permission::findOrCreate('view roles', 'web');
    $user = makeUserWithPermissions([]);
    $this->actingAs($user)
        ->get(route('dashboard.admin.roles.index'))
        ->assertForbidden();
});

it('allows roles index with permission', function () {
    $user = makeUserWithPermissions(['view roles']);
    $this->actingAs($user)
        ->get(route('dashboard.admin.roles.index'))
        ->assertOk();
});

it('creates role with permission', function () {
    $user = makeUserWithPermissions(['create roles']);
    $this->actingAs($user)
        ->post(route('dashboard.admin.roles.store'), [
            'name' => 'editor',
            'permissions' => [],
        ])->assertRedirect(route('dashboard.admin.roles.index'));

    expect(Role::where('name', 'editor')->exists())->toBeTrue();
});
