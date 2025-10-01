<?php

use App\Models\User;
use App\Models\Menu;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function menuUser(array $perms = []): User {
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

it('denies menus index without permission', function () {
    // Ensure permission exists but is not granted
    Permission::findOrCreate('view menus', 'web');
    $u = menuUser();
    $this->actingAs($u)->get(route('dashboard.admin.menus.index'))->assertForbidden();
});

it('allows menus index with permission', function () {
    $u = menuUser(['view menus']);
    $this->actingAs($u)->get(route('dashboard.admin.menus.index'))->assertOk();
});

it('creates, shows, updates and deletes a menu with permissions', function () {
    $u = menuUser(['create menus','view menus','edit menus','delete menus']);
    $this->actingAs($u);

    // Create
    $resp = $this->post(route('dashboard.admin.menus.store'), [
        'name' => 'Main',
        'slug' => 'main',
        'location' => 'primary',
        'description' => 'Primary navigation',
    ]);
    $resp->assertRedirect(route('dashboard.admin.menus.index'));
    $menu = Menu::where('slug','main')->first();
    expect($menu)->not->toBeNull();

    // Show
    $this->get(route('dashboard.admin.menus.show', $menu))->assertOk();

    // Update
    $resp2 = $this->put(route('dashboard.admin.menus.update', $menu), [
        'name' => 'Main Updated',
        'slug' => 'main',
        'location' => 'primary',
        'description' => 'Primary nav',
    ]);
    $resp2->assertRedirect(route('dashboard.admin.menus.index'));
    $menu->refresh();
    expect($menu->name)->toBe('Main Updated');

    // Destroy
    $resp3 = $this->delete(route('dashboard.admin.menus.destroy', $menu));
    $resp3->assertRedirect(route('dashboard.admin.menus.index'));
    expect(Menu::whereKey($menu->id)->exists())->toBeFalse();
});

it('denies create/show/edit/update/destroy without respective permissions', function () {
    // Ensure permissions exist but are not granted (except view)
    foreach (['create menus','edit menus','delete menus'] as $p) { Permission::findOrCreate($p, 'web'); }
    $u = menuUser(['view menus']);
    $this->actingAs($u);

    // create/store denied
    $this->post(route('dashboard.admin.menus.store'), [
        'name' => 'No', 'slug' => 'no'
    ])->assertForbidden();

    // Prepare a menu to try show/edit/update/destroy
    $menu = Menu::create([
        'name' => 'Tmp',
        'slug' => 'tmp',
        'location' => null,
        'description' => null,
    ]);

    // show requires view menus (we have), edit/update/delete require their own
    $this->get(route('dashboard.admin.menus.show', $menu))->assertOk();
    $this->put(route('dashboard.admin.menus.update', $menu), [
        'name' => 'Tmp2',
        'slug' => 'tmp',
    ])->assertForbidden();
    $this->delete(route('dashboard.admin.menus.destroy', $menu))->assertForbidden();
});
