<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function mkUser(array $perms = []): User {
    $user = User::factory()->create();
    if ($perms) {
        foreach ($perms as $perm) {
            Spatie\Permission\Models\Permission::findOrCreate($perm, 'web');
        }
        $user->givePermissionTo($perms);
    }
    // Also give access admin permission which is required for admin routes
    Spatie\Permission\Models\Permission::findOrCreate('access admin', 'web');
    $user->givePermissionTo('access admin');
    return $user;
}

it('denies themes index without permission', function () {
    // Ensure permission exists but is not granted
    Spatie\Permission\Models\Permission::findOrCreate('view themes', 'web');
    $user = mkUser([]);
    $this->actingAs($user)
        ->get(route('dashboard.admin.themes.index'))
        ->assertForbidden();
});

it('allows themes index with permission', function () {
    $user = mkUser(['view themes']);
    $this->actingAs($user)
        ->get(route('dashboard.admin.themes.index'))
        ->assertOk();
});

it('denies theme discover without permission', function () {
    // Ensure permission exists but is not granted
    Spatie\Permission\Models\Permission::findOrCreate('install themes', 'web');
    $user = mkUser([]);
    $this->actingAs($user)
        ->post(route('dashboard.admin.themes.discover'))
        ->assertForbidden();
});

it('allows theme discover with permission (controller may still process)', function () {
    $user = mkUser(['install themes']);
    $this->actingAs($user)
        ->post(route('dashboard.admin.themes.discover'))
        ->assertRedirect();
});
