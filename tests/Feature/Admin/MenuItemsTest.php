<?php

use App\Models\User;
use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function menuItemsUser(array $perms = []): User {
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

function ensureMenu(): Menu {
    return Menu::firstOrCreate([
        'slug' => 'main'
    ], [
        'name' => 'Main',
        'location' => 'primary',
        'description' => null,
    ]);
}

it('denies creating/updating/deleting menu items without permissions', function () {
    // Ensure permissions exist but are not granted (except view menus)
    foreach (['create menu items','edit menu items','delete menu items'] as $p) { Permission::findOrCreate($p, 'web'); }
    $u = menuItemsUser(['view menus']);
    $this->actingAs($u);
    $menu = ensureMenu();

    // Create denied
    $this->post(route('dashboard.admin.menu-items.store'), [
        'menu_id' => $menu->id,
        'label' => 'Home',
    ])->assertForbidden();

    // Prepare item
    $item = MenuItem::create([
        'menu_id' => $menu->id,
        'label' => 'Temp',
        'url' => '/',
        'order' => 0,
    ]);

    // Update/Delete denied
    $this->put(route('dashboard.admin.menu-items.update', $item), [
        'label' => 'Temp 2',
    ])->assertForbidden();
    $this->delete(route('dashboard.admin.menu-items.destroy', $item))
        ->assertForbidden();
});

it('creates, updates, and deletes menu items with proper permissions', function () {
    $u = menuItemsUser(['edit menus','view menus']);
    $this->actingAs($u);
    $menu = ensureMenu();

    // Create root item
    $resp = $this->post(route('dashboard.admin.menu-items.store'), [
        'menu_id' => $menu->id,
        'label' => 'Home',
        'url' => '/',
        'order' => 1,
        'visible_to' => 'all',
        'target' => '_self',
    ]);
    $resp->assertRedirect(route('dashboard.admin.menus.show', ['menu' => $menu->id]));
    $item = MenuItem::where('menu_id',$menu->id)->where('label','Home')->first();
    expect($item)->not->toBeNull();

    // Create child item
    $resp2 = $this->post(route('dashboard.admin.menu-items.store'), [
        'menu_id' => $menu->id,
        'parent_id' => $item->id,
        'label' => 'Child',
        'url' => '/child',
        'order' => 2,
    ]);
    $resp2->assertRedirect(route('dashboard.admin.menus.show', ['menu' => $menu->id]));
    $child = MenuItem::where('menu_id',$menu->id)->where('label','Child')->first();
    expect($child)->not->toBeNull();
    expect($child->parent_id)->toBe($item->id);

    // Update root
    $resp3 = $this->put(route('dashboard.admin.menu-items.update', $item), [
        'label' => 'Home Updated',
        'url' => '/',
        'order' => 3,
        'visible_to' => 'auth',
        'target' => '_blank',
    ]);
    $resp3->assertRedirect(route('dashboard.admin.menus.show', ['menu' => $menu->id]));
    $item->refresh();
    expect($item->label)->toBe('Home Updated');
    expect($item->order)->toBe(3);

    // Destroy parent should recursively delete child (controller deleteSubtree)
    $resp4 = $this->delete(route('dashboard.admin.menu-items.destroy', $item));
    $resp4->assertRedirect(route('dashboard.admin.menus.show', ['menu' => $menu->id]));
    expect(MenuItem::whereKey($item->id)->exists())->toBeFalse();
    expect(MenuItem::whereKey($child->id)->exists())->toBeFalse();
});
