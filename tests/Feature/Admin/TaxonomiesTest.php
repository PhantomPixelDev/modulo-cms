<?php

use App\Models\User;
use App\Models\Taxonomy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function taxUser(array $perms = []): User {
    $user = User::factory()->create();
    foreach ($perms as $perm) {
        Permission::findOrCreate($perm, 'web');
    }
    if ($perms) $user->givePermissionTo($perms);
    return $user;
}

it('denies taxonomies index without permission', function () {
    // Ensure the permission exists even if not assigned
    Permission::findOrCreate('view taxonomies', 'web');
    $u = taxUser();
    $this->actingAs($u)->get(route('dashboard.admin.taxonomies.index'))->assertForbidden();
});

it('allows taxonomies index with permission', function () {
    $u = taxUser(['view taxonomies']);
    $this->actingAs($u)->get(route('dashboard.admin.taxonomies.index'))->assertOk();
});

it('creates, updates and deletes a taxonomy with permissions', function () {
    $u = taxUser(['create taxonomies','edit taxonomies','delete taxonomies','view taxonomies']);
    $this->actingAs($u);

    // Create
    $resp = $this->post(route('dashboard.admin.taxonomies.store'), [
        'name' => 'Category',
        'label' => 'Category',
        'plural_label' => 'Categories',
        'description' => 'desc',
        'is_hierarchical' => true,
        'is_public' => true,
        'post_types' => [],
        'show_in_menu' => true,
        'menu_position' => 5,
    ]);
    $resp->assertRedirect(route('dashboard.admin.taxonomies.index'));
    $tax = Taxonomy::where('name','Category')->first();
    expect($tax)->not->toBeNull();

    // Update
    $resp2 = $this->put(route('dashboard.admin.taxonomies.update', $tax), [
        'name' => 'Category',
        'label' => 'Category',
        'plural_label' => 'Categories',
        'description' => 'desc2',
        'is_hierarchical' => true,
        'is_public' => true,
        'post_types' => [],
        'show_in_menu' => true,
        'menu_position' => 6,
    ]);
    $resp2->assertRedirect(route('dashboard.admin.taxonomies.index'));
    $tax->refresh();
    expect($tax->description)->toBe('desc2');

    // Destroy
    $resp3 = $this->delete(route('dashboard.admin.taxonomies.destroy', $tax));
    $resp3->assertSessionHas('success');
    expect(Taxonomy::where('id', $tax->id)->exists())->toBeFalse();
});

it('denies create/edit/update/destroy without respective permissions', function () {
    // Ensure permissions exist but are not granted (except view)
    foreach (['create taxonomies','edit taxonomies','delete taxonomies'] as $p) {
        Permission::findOrCreate($p, 'web');
    }
    $u = taxUser(['view taxonomies']);
    $this->actingAs($u);

    $this->get(route('dashboard.admin.taxonomies.create'))->assertForbidden();
    $this->post(route('dashboard.admin.taxonomies.store'), [])->assertForbidden();

    $tax = Taxonomy::create([
        'name' => 'Tags',
        'label' => 'Tag',
        'plural_label' => 'Tags',
        'description' => null,
        'slug' => 'tags',
        'is_hierarchical' => false,
        'is_public' => true,
        'post_types' => [],
        'show_in_menu' => true,
        'menu_icon' => null,
        'menu_position' => 5,
    ]);

    $this->get(route('dashboard.admin.taxonomies.edit', $tax))->assertForbidden();
    $this->put(route('dashboard.admin.taxonomies.update', $tax), [
        'name' => 'Tags',
        'label' => 'Tag',
        'plural_label' => 'Tags',
        'description' => 'x',
        'is_hierarchical' => false,
        'is_public' => true,
        'post_types' => [],
        'show_in_menu' => true,
        'menu_position' => 5,
    ])->assertForbidden();
    $this->delete(route('dashboard.admin.taxonomies.destroy', $tax))->assertForbidden();
});
