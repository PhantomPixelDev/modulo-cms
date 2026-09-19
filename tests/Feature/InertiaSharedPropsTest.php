<?php

use App\Models\PostType;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

// Route names contain dots, so check the route map with closures rather than dot paths
function hasRoute(string $name): Closure
{
    return fn ($routes) => collect($routes)->has($name);
}

function lacksRoute(string $name): Closure
{
    return fn ($routes) => ! collect($routes)->has($name);
}

it('keeps admin routes and sidebar data away from visitors', function () {
    PostType::factory()->create(['show_in_menu' => true]);

    $this->get('/login')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ziggy.routes', lacksRoute('dashboard.admin.users.index'))
            ->where('ziggy.routes', hasRoute('login'))
            ->where('dynamicMenu.postTypes', [])
        );
});

it('gives admin-area users the admin routes and sidebar data', function () {
    PostType::factory()->create(['show_in_menu' => true]);
    $user = makeAdminUserWithPermissions(['view posts']);
    $user->forceFill(['email_verified_at' => now()])->save();

    $this->actingAs($user)
        ->get(route('dashboard.admin.posts.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ziggy.routes', hasRoute('dashboard.admin.users.index'))
            ->has('dynamicMenu.postTypes', 1)
        );
});

it('does not share admin data with signed-in non-admins', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('ziggy.routes', lacksRoute('dashboard.admin.users.index'))
        );
});
