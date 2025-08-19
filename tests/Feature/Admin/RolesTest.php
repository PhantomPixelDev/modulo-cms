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
