<?php

use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function menuUser(array $perms = []): User
{
    $user = User::factory()->create();
    foreach ($perms as $perm) {
        Permission::findOrCreate($perm, 'web');
    }
    if ($perms) {
        $user->givePermissionTo($perms);
    }
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
    $u = menuUser(['create menus', 'view menus', 'edit menus', 'delete menus']);
    $this->actingAs($u);

    // Create
    $resp = $this->post(route('dashboard.admin.menus.store'), [
        'name' => 'Main',
        'slug' => 'main',
        'location' => 'primary',
        'description' => 'Primary navigation',
    ]);
    $menu = Menu::where('slug', 'main')->first();
    $resp->assertRedirect(route('dashboard.admin.menus.show', $menu));
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
    $resp2->assertRedirect()->assertSessionHas('success');
    $menu->refresh();
    expect($menu->name)->toBe('Main Updated');

    // Destroy
    $resp3 = $this->delete(route('dashboard.admin.menus.destroy', $menu));
    $resp3->assertRedirect(route('dashboard.admin.menus.index'));
    expect(Menu::whereKey($menu->id)->exists())->toBeFalse();
});

it('denies create/show/edit/update/destroy without respective permissions', function () {
    // Ensure permissions exist but are not granted (except view)
    foreach (['create menus', 'edit menus', 'delete menus'] as $p) {
        Permission::findOrCreate($p, 'web');
    }
    $u = menuUser(['view menus']);
    $this->actingAs($u);

    // create/store denied
    $this->post(route('dashboard.admin.menus.store'), [
        'name' => 'No', 'slug' => 'no',
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


it('saves the whole tree from the builder', function () {
    $this->actingAs(menuUser(['view menus', 'edit menus']));
    $menu = Menu::create(['name' => 'Main', 'slug' => 'main']);
    [$home, $about, $team] = collect(['Home', 'About', 'Team'])
        ->map(fn ($label, $i) => MenuItem::create(['menu_id' => $menu->id, 'label' => $label, 'url' => '/'.$i, 'order' => $i]))
        ->all();

    $this->put(route('dashboard.admin.menus.reorder', $menu), ['items' => [
        ['id' => $about->id, 'parent_id' => null],
        ['id' => $team->id, 'parent_id' => $about->id],
        ['id' => $home->id, 'parent_id' => null],
    ]])->assertRedirect();

    expect($about->fresh()->order)->toBe(0)
        ->and($home->fresh()->order)->toBe(1)
        ->and($team->fresh()->parent_id)->toBe($about->id)
        ->and($team->fresh()->order)->toBe(0);
});

it('refuses a tree with loops, foreign items or too many levels', function () {
    $this->actingAs(menuUser(['view menus', 'edit menus']));
    $menu = Menu::create(['name' => 'Main', 'slug' => 'main']);
    $other = Menu::create(['name' => 'Footer', 'slug' => 'footer']);
    $items = collect(range(1, 4))->map(fn ($i) => MenuItem::create(['menu_id' => $menu->id, 'label' => "L$i", 'url' => '/', 'order' => $i]));
    $foreign = MenuItem::create(['menu_id' => $other->id, 'label' => 'X', 'url' => '/', 'order' => 0]);
    [$a, $b, $c, $d] = $items->all();

    $loop = [['id' => $a->id, 'parent_id' => $b->id], ['id' => $b->id, 'parent_id' => $a->id]];
    $this->put(route('dashboard.admin.menus.reorder', $menu), ['items' => $loop])->assertSessionHasErrors('items');

    $this->put(route('dashboard.admin.menus.reorder', $menu), ['items' => [['id' => $foreign->id, 'parent_id' => null]]])->assertSessionHasErrors('items');

    $tooDeep = [
        ['id' => $a->id, 'parent_id' => null], ['id' => $b->id, 'parent_id' => $a->id],
        ['id' => $c->id, 'parent_id' => $b->id], ['id' => $d->id, 'parent_id' => $c->id],
    ];
    $this->put(route('dashboard.admin.menus.reorder', $menu), ['items' => $tooDeep])->assertSessionHasErrors('items');

    expect($b->fresh()->parent_id)->toBeNull();
});

it('needs the edit permission to reorder', function () {
    Permission::findOrCreate('edit menus', 'web');
    $this->actingAs(menuUser(['view menus']));
    $menu = Menu::create(['name' => 'Main', 'slug' => 'main']);

    $this->put(route('dashboard.admin.menus.reorder', $menu), ['items' => []])->assertForbidden();
});

it('adds several pages at the end of the menu', function () {
    $this->actingAs(menuUser(['view menus', 'create menu items']));
    $menu = Menu::create(['name' => 'Main', 'slug' => 'main']);
    MenuItem::create(['menu_id' => $menu->id, 'label' => 'Home', 'url' => '/', 'order' => 4]);
    $about = makePublishedPage(['title' => 'About', 'slug' => 'about']);
    $contact = makePublishedPage(['title' => 'Contact', 'slug' => 'contact']);
    $post = Post::factory()->create();

    $this->post(route('dashboard.admin.menus.add-pages', $menu), ['page_ids' => [$contact->id, $about->id, $post->id]])
        ->assertSessionHas('success');

    $added = MenuItem::where('menu_id', $menu->id)->whereNotNull('page_slug')->orderBy('order')->get();
    expect($added->pluck('label')->all())->toBe(['About', 'Contact'])
        ->and($added->pluck('order')->all())->toBe([5, 6]);
});

it('gives the builder a flat item list, the pages and the theme locations', function () {
    $this->actingAs(menuUser(['view menus']));
    $menu = Menu::create(['name' => 'Main', 'slug' => 'main']);
    $parent = MenuItem::create(['menu_id' => $menu->id, 'label' => 'Parent', 'url' => '/', 'order' => 0]);
    MenuItem::create(['menu_id' => $menu->id, 'parent_id' => $parent->id, 'label' => 'Child', 'url' => '/c', 'order' => 0]);

    $this->get(route('dashboard.admin.menus.show', $menu))
        ->assertInertia(fn ($page) => $page
            ->component('admin/menus/show')
            ->has('items', 2)
            ->has('pages')
            ->has('locations'));
});
