<?php

use App\Models\User;
use App\Models\PostType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function ptUser(array $perms = []): User {
    $user = User::factory()->create();
    foreach ($perms as $perm) {
        Permission::findOrCreate($perm, 'web');
    }
    if ($perms) $user->givePermissionTo($perms);
    // Also give access admin permission which is required for admin routes
    Permission::findOrCreate('access admin', 'web');
    $user->givePermissionTo('access admin');
    return $user;
}

it('denies post types index without permission', function () {
    // Ensure permission exists but is not granted
    Permission::findOrCreate('view post types', 'web');
    $u = ptUser();
    $this->actingAs($u)->get(route('dashboard.admin.post-types.index'))->assertForbidden();
});

it('allows post types index with permission', function () {
    $u = ptUser(['view post types']);
    $this->actingAs($u)->get(route('dashboard.admin.post-types.index'))->assertOk();
});

it('validates route_prefix cannot be root on store', function () {
    $u = ptUser(['create post types']);
    $this->actingAs($u);

    $resp = $this->from(route('dashboard.admin.post-types.create'))
        ->post(route('dashboard.admin.post-types.store'), [
            'name' => 'News',
            'label' => 'News',
            'plural_label' => 'News',
            'description' => null,
            'route_prefix' => '/', // invalid
            'supports' => ['title','editor'],
            'taxonomies' => [],
        ]);

    $resp->assertRedirect(route('dashboard.admin.post-types.create'));
    $resp->assertSessionHasErrors(['route_prefix']);
});

it('creates, updates and deletes a post type with permissions', function () {
    $u = ptUser(['create post types','edit post types','delete post types','view post types']);
    $this->actingAs($u);

    // Create valid post type
    $resp = $this->post(route('dashboard.admin.post-types.store'), [
        'name' => 'Articles',
        'label' => 'Article',
        'plural_label' => 'Articles',
        'description' => 'desc',
        'route_prefix' => 'articles',
        'supports' => ['title','editor'],
        'taxonomies' => [],
        'menu_position' => 7,
    ]);
    $resp->assertRedirect(route('dashboard.admin.post-types.index'));
    $pt = PostType::where('name','Articles')->first();
    expect($pt)->not->toBeNull();

    // Update with invalid route_prefix should fail
    $resp2 = $this->from(route('dashboard.admin.post-types.edit', $pt))
        ->put(route('dashboard.admin.post-types.update', $pt), [
            'name' => 'Articles',
            'label' => 'Article',
            'plural_label' => 'Articles',
            'description' => 'desc2',
            'route_prefix' => '/', // invalid
            'supports' => ['title','editor'],
            'taxonomies' => [],
            'menu_position' => 8,
        ]);
    $resp2->assertRedirect(route('dashboard.admin.post-types.edit', $pt));
    $resp2->assertSessionHasErrors(['route_prefix']);

    // Valid update
    $resp3 = $this->put(route('dashboard.admin.post-types.update', $pt), [
        'name' => 'Articles',
        'label' => 'Article',
        'plural_label' => 'Articles',
        'description' => 'desc3',
        'route_prefix' => 'articles',
        'supports' => ['title','editor'],
        'taxonomies' => [],
        'menu_position' => 9,
    ]);
    $resp3->assertRedirect(route('dashboard.admin.post-types.index'));
    $pt->refresh();
    expect($pt->description)->toBe('desc3');

    // Destroy
    $resp4 = $this->delete(route('dashboard.admin.post-types.destroy', $pt));
    $resp4->assertRedirect(route('dashboard.admin.post-types.index'));
    expect(PostType::where('id', $pt->id)->exists())->toBeFalse();
});

it('denies create/edit/update/destroy without respective permissions', function () {
    // Ensure permissions exist but are not granted (except view)
    foreach (['create post types','edit post types','delete post types'] as $p) {
        Permission::findOrCreate($p, 'web');
    }
    $u = ptUser(['view post types']);
    $this->actingAs($u);

    $this->get(route('dashboard.admin.post-types.create'))->assertForbidden();
    $this->post(route('dashboard.admin.post-types.store'), [])->assertForbidden();

    $pt = PostType::create([
        'name' => 'Notes',
        'label' => 'Note',
        'plural_label' => 'Notes',
        'description' => null,
        'route_prefix' => 'notes',
        'supports' => ['title'],
        'taxonomies' => [],
        'slug' => 'notes',
        'is_public' => true,
        'is_hierarchical' => false,
        'menu_icon' => null,
        'menu_position' => 5,
    ]);

    $this->get(route('dashboard.admin.post-types.edit', $pt))->assertForbidden();
    $this->put(route('dashboard.admin.post-types.update', $pt), [
        'name' => 'Notes',
        'label' => 'Note',
        'plural_label' => 'Notes',
        'description' => null,
        'route_prefix' => 'notes',
        'supports' => ['title'],
        'taxonomies' => [],
    ])->assertForbidden();
    $this->delete(route('dashboard.admin.post-types.destroy', $pt))->assertForbidden();
});
