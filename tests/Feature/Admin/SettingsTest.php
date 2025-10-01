<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function settingsUser($perms = ['view settings'])
{
    $user = User::factory()->create();
    $user->givePermissionTo($perms);
    // Also give access admin permission which is required for admin routes
    \Spatie\Permission\Models\Permission::findOrCreate('access admin', 'web');
    $user->givePermissionTo('access admin');
    return $user;
}

it('allows settings index with permission', function () {
    $user = settingsUser(['view settings']);
    $this->actingAs($user)->get(route('dashboard.admin.settings'))->assertOk();
});

it('denies settings index without permission', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->get(route('dashboard.admin.settings'))->assertForbidden();
});
