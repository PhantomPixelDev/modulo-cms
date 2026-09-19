<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function userWithRole(string $role): User
{
    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole($role);

    return $user;
}

it('lets editors manage posts in the admin area', function () {
    $this->actingAs(userWithRole('editor'))
        ->get(route('dashboard.admin.posts.index'))
        ->assertOk();
});

it('still keeps editors out of user management', function () {
    $this->actingAs(userWithRole('editor'))
        ->get(route('dashboard.admin.users.index'))
        ->assertForbidden();
});

it('lets moderators reach the admin area', function () {
    $this->actingAs(userWithRole('moderator'))
        ->get(route('dashboard.admin.posts.index'))
        ->assertOk();
});

it('keeps plain users out of the admin area', function () {
    $this->actingAs(userWithRole('user'))
        ->get(route('dashboard.admin.posts.index'))
        ->assertForbidden();
});
