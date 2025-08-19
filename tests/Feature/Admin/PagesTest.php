<?php

use App\Models\User;
use App\Models\Page;
use App\Models\PostType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function pageUser(array $perms = []): User {
    $user = User::factory()->create();
    foreach ($perms as $perm) {
        Permission::findOrCreate($perm, 'web');
    }
    if ($perms) $user->givePermissionTo($perms);
    return $user;
}

it('denies pages index without permission', function () {
    // Ensure permission exists but is not granted
    Permission::findOrCreate('view posts', 'web');
    $u = pageUser();
    $this->actingAs($u)->get(route('dashboard.admin.pages.index'))->assertForbidden();
});

it('allows pages index with permission', function () {
    $u = pageUser(['view posts']); // pages use posts permissions per routes
    $this->actingAs($u)->get(route('dashboard.admin.pages.index'))->assertOk();
});

it('creates, updates and deletes a page with permissions', function () {
    $u = pageUser(['create posts', 'edit posts', 'delete posts']);
    $this->actingAs($u);

    // Create
    $resp = $this->post(route('dashboard.admin.pages.store'), [
        'title' => 'About Us',
        'slug' => null,
        'content' => 'About body',
        'status' => 'draft',
    ]);
    $resp->assertRedirect(route('dashboard.admin.pages.index'));
    $page = Page::first();
    expect($page)->not->toBeNull();

    // Update to published (should set published_at if empty)
    $resp2 = $this->put(route('dashboard.admin.pages.update', $page), [
        'title' => 'About Us Updated',
        'slug' => $page->slug,
        'content' => 'About body 2',
        'status' => 'published',
    ]);
    $resp2->assertRedirect(route('dashboard.admin.pages.index'));
    $page->refresh();
    expect($page->title)->toBe('About Us Updated');
    expect($page->status)->toBe('published');
    expect($page->published_at)->not->toBeNull();

    // Delete
    $resp3 = $this->delete(route('dashboard.admin.pages.destroy', $page));
    $resp3->assertSessionHas('success');
    expect(Page::count())->toBe(0);
});

it('denies create and store without permission', function () {
    // Ensure permission exists but is not granted
    Permission::findOrCreate('create posts', 'web');
    $u = pageUser();
    $this->actingAs($u);

    $this->get(route('dashboard.admin.pages.create'))->assertForbidden();
    $this->post(route('dashboard.admin.pages.store'), [])->assertForbidden();
});

it('denies edit/update/destroy without respective permissions', function () {
    // Ensure a page-type exists
    $pageType = PostType::firstOrCreate([
        'name' => 'page'
    ], [
        'label' => 'Page',
        'plural_label' => 'Pages',
        'description' => 'Static pages',
        'route_prefix' => null,
        'has_taxonomies' => false,
        'has_featured_image' => true,
        'has_excerpt' => false,
        'has_comments' => false,
        'supports' => ['title','editor'],
        'taxonomies' => [],
        'slug' => 'pages',
        'is_public' => true,
        'is_hierarchical' => true,
        'menu_icon' => 'file',
        'menu_position' => 6,
    ]);

    // Ensure permissions exist but are not granted (except view)
    foreach (['edit posts','delete posts'] as $p) { Permission::findOrCreate($p, 'web'); }
    $u = pageUser(['view posts']);
    $this->actingAs($u);

    $page = Page::create([
        'post_type_id' => $pageType->id,
        'author_id' => $u->id,
        'title' => 'Contact',
        'slug' => 'contact',
        'content' => 'body',
        'status' => 'draft',
    ]);

    $this->get(route('dashboard.admin.pages.edit', $page))->assertForbidden();
    $this->put(route('dashboard.admin.pages.update', $page), [
        'title' => 'Contact Updated',
        'slug' => 'contact',
        'content' => 'body2',
        'status' => 'draft',
    ])->assertForbidden();
    $this->delete(route('dashboard.admin.pages.destroy', $page))->assertForbidden();
});

it('allows show/edit with proper permissions', function () {
    $pageType = PostType::firstOrCreate([
        'name' => 'page'
    ], [
        'label' => 'Page',
        'plural_label' => 'Pages',
        'description' => 'Static pages',
        'route_prefix' => null,
        'has_taxonomies' => false,
        'has_featured_image' => true,
        'has_excerpt' => false,
        'has_comments' => false,
        'supports' => ['title','editor'],
        'taxonomies' => [],
        'slug' => 'pages',
        'is_public' => true,
        'is_hierarchical' => true,
        'menu_icon' => 'file',
        'menu_position' => 6,
    ]);

    $u = pageUser(['view posts','edit posts']);
    $this->actingAs($u);

    $page = Page::create([
        'post_type_id' => $pageType->id,
        'author_id' => $u->id,
        'title' => 'FAQ',
        'slug' => 'faq',
        'content' => 'body',
        'status' => 'draft',
    ]);

    $this->get(route('dashboard.admin.pages.index'))->assertOk();
    $this->get(route('dashboard.admin.pages.edit', $page))->assertOk();
});
