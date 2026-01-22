<?php

use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('denies roles index without permission', function () {
    // Ensure permission exists but is not granted
    Spatie\Permission\Models\Permission::findOrCreate('view roles', 'web');
    $user = makeAdminUserWithPermissions([]);
    $this->actingAs($user)
        ->get(route('dashboard.admin.roles.index'))
        ->assertForbidden();
});

it('allows roles index with permission', function () {
    $user = makeAdminUserWithPermissions(['view roles']);
    $this->actingAs($user)
        ->get(route('dashboard.admin.roles.index'))
        ->assertOk();
});

it('creates role with permission', function () {
    $user = makeAdminUserWithPermissions(['create roles']);
    $this->actingAs($user)
        ->post(route('dashboard.admin.roles.store'), [
            'name' => 'editor',
            'permissions' => [],
        ])->assertRedirect(route('dashboard.admin.roles.index'));

    expect(Role::where('name', 'editor')->exists())->toBeTrue();
});
