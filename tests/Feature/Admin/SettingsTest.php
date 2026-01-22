<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function settingsUser($perms = ['view settings'])
{
    $user = User::factory()->create();
    // Create permissions if they don't exist
    foreach ($perms as $perm) {
        \Spatie\Permission\Models\Permission::findOrCreate($perm, 'web');
    }
    $user->givePermissionTo($perms);
    // Also give access admin permission which is required for admin routes
    \Spatie\Permission\Models\Permission::findOrCreate('access admin', 'web');
    $user->givePermissionTo('access admin');
    return $user;
}

it('allows settings index with permission', function () {
    $user = settingsUser(['view settings']);
    $this->actingAs($user)->get(route('dashboard.admin.settings.index'))->assertOk();
});

it('denies settings index without permission', function () {
    // User needs 'access admin' to reach the controller, then gets denied by policy
    \Spatie\Permission\Models\Permission::findOrCreate('access admin', 'web');
    $user = User::factory()->create();
    $user->givePermissionTo('access admin');
    $this->actingAs($user)->get(route('dashboard.admin.settings.index'))->assertForbidden();
});
