<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('denies themes index without permission', function () {
    // Ensure permission exists but is not granted
    Spatie\Permission\Models\Permission::findOrCreate('view themes', 'web');
    $user = makeAdminUserWithPermissions([]);
    $this->actingAs($user)
        ->get(route('dashboard.admin.themes.index'))
        ->assertForbidden();
});

it('allows themes index with permission', function () {
    $user = makeAdminUserWithPermissions(['view themes']);
    $this->actingAs($user)
        ->get(route('dashboard.admin.themes.index'))
        ->assertOk();
});

it('denies theme discover without permission', function () {
    // Ensure permission exists but is not granted
    Spatie\Permission\Models\Permission::findOrCreate('install themes', 'web');
    $user = makeAdminUserWithPermissions([]);
    $this->actingAs($user)
        ->post(route('dashboard.admin.themes.discover'))
        ->assertForbidden();
});

it('allows theme discover with permission (controller may still process)', function () {
    $user = makeAdminUserWithPermissions(['install themes']);
    $this->actingAs($user)
        ->post(route('dashboard.admin.themes.discover'))
        ->assertRedirect();
});
