<?php

use App\Models\User;
use App\Models\Post;
use App\Models\PostType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function postUser(array $perms = []): User {
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

it('denies posts index without permission', function () {
    // Ensure permission exists but is not granted
    Permission::findOrCreate('view posts', 'web');
    $u = postUser();
    $this->actingAs($u)->get(route('dashboard.admin.posts.index'))->assertForbidden();
});

it('allows posts index with permission', function () {
    $u = postUser(['view posts']);
    $this->actingAs($u)->get(route('dashboard.admin.posts.index'))->assertOk();
});

it('creates, updates and deletes a post with permissions', function () {
    $u = postUser(['create posts', 'edit posts', 'delete posts']);
    $this->actingAs($u);

    $type = PostType::create([
        'name' => 'news', 'label' => 'News', 'plural_label' => 'News',
        'description' => null, 'route_prefix' => 'news',
        'has_taxonomies' => false, 'has_featured_image' => false, 'has_excerpt' => true, 'has_comments' => false,
        'supports' => ['title','editor'], 'taxonomies' => [], 'slug' => 'news',
        'is_public' => true, 'is_hierarchical' => false, 'menu_icon' => null, 'menu_position' => 5,
    ]);

    // Create
    $resp = $this->post(route('dashboard.admin.posts.store'), [
        'post_type_id' => $type->id,
        'title' => 'Hello World',
        'slug' => null,
        'content' => 'Body',
        'status' => 'draft',
    ]);
    $resp->assertRedirect(route('dashboard.admin.posts.index'));
    $post = Post::first();
    expect($post)->not->toBeNull();

    // Update
    $resp2 = $this->put(route('dashboard.admin.posts.update', $post), [
        'post_type_id' => $type->id,
        'title' => 'Hello World Updated',
        'slug' => $post->slug,
        'content' => 'Body 2',
        'status' => 'published',
    ]);
    $resp2->assertRedirect(route('dashboard.admin.posts.index'));
    $post->refresh();
    expect($post->title)->toBe('Hello World Updated');
    expect($post->status)->toBe('published');

    // Delete
    $resp3 = $this->delete(route('dashboard.admin.posts.destroy', $post));
    $resp3->assertSessionHas('success');
    expect(Post::count())->toBe(0);
});

it('denies create and store without permission', function () {
    // Ensure permissions exist but are not granted
    Permission::findOrCreate('create posts', 'web');
    $u = postUser();
    $this->actingAs($u);

    $this->get(route('dashboard.admin.posts.create'))->assertForbidden();
    $this->post(route('dashboard.admin.posts.store'), [])->assertForbidden();
});

it('denies show without view permission', function () {
    // Ensure permission exists but is not granted
    Permission::findOrCreate('view posts', 'web');
    $u = postUser(['create posts']);
    $this->actingAs($u);

    $type = PostType::create([
        'name' => 'article', 'label' => 'Article', 'plural_label' => 'Articles',
        'description' => null, 'route_prefix' => 'articles',
        'has_taxonomies' => false, 'has_featured_image' => false, 'has_excerpt' => false, 'has_comments' => false,
        'supports' => ['title','editor'], 'taxonomies' => [], 'slug' => 'article',
        'is_public' => true, 'is_hierarchical' => false, 'menu_icon' => null, 'menu_position' => 5,
    ]);

    $post = Post::create([
        'post_type_id' => $type->id,
        'author_id' => $u->id,
        'title' => 'A',
        'slug' => 'a',
        'content' => 'x',
        'status' => 'draft',
    ]);

    $this->get(route('dashboard.admin.posts.show', $post))->assertForbidden();
});

it('allows show/edit with proper permissions', function () {
    $u = postUser(['view posts','edit posts']);
    $this->actingAs($u);

    $type = PostType::create([
        'name' => 'note', 'label' => 'Note', 'plural_label' => 'Notes',
        'description' => null, 'route_prefix' => 'notes',
        'has_taxonomies' => false, 'has_featured_image' => false, 'has_excerpt' => false, 'has_comments' => false,
        'supports' => ['title','editor'], 'taxonomies' => [], 'slug' => 'note',
        'is_public' => true, 'is_hierarchical' => false, 'menu_icon' => null, 'menu_position' => 5,
    ]);

    $post = Post::create([
        'post_type_id' => $type->id,
        'author_id' => $u->id,
        'title' => 'B',
        'slug' => 'b',
        'content' => 'y',
        'status' => 'draft',
    ]);

    $this->get(route('dashboard.admin.posts.show', $post))->assertOk();
    $this->get(route('dashboard.admin.posts.edit', $post))->assertOk();
});

it('denies edit/update/destroy without respective permissions', function () {
    // Ensure permissions exist but are not granted (except view)
    foreach (['edit posts','delete posts'] as $p) { Permission::findOrCreate($p, 'web'); }
    $u = postUser(['view posts']);
    $this->actingAs($u);

    $type = PostType::create([
        'name' => 'story', 'label' => 'Story', 'plural_label' => 'Stories',
        'description' => null, 'route_prefix' => 'stories',
        'has_taxonomies' => false, 'has_featured_image' => false, 'has_excerpt' => false, 'has_comments' => false,
        'supports' => ['title','editor'], 'taxonomies' => [], 'slug' => 'story',
        'is_public' => true, 'is_hierarchical' => false, 'menu_icon' => null, 'menu_position' => 5,
    ]);

    $post = Post::create([
        'post_type_id' => $type->id,
        'author_id' => $u->id,
        'title' => 'C',
        'slug' => 'c',
        'content' => 'z',
        'status' => 'draft',
    ]);

    $this->get(route('dashboard.admin.posts.edit', $post))->assertForbidden();
    $this->put(route('dashboard.admin.posts.update', $post), [
        'post_type_id' => $type->id,
        'title' => 'C2',
        'slug' => 'c',
        'content' => 'z2',
        'status' => 'draft',
    ])->assertForbidden();
    $this->delete(route('dashboard.admin.posts.destroy', $post))->assertForbidden();
});

it('persists featured_image on create and update', function () {
    $u = postUser(['create posts', 'edit posts']);
    $this->actingAs($u);

    $type = PostType::create([
        'name' => 'gallery', 'label' => 'Gallery', 'plural_label' => 'Galleries',
        'description' => null, 'route_prefix' => 'galleries',
        'has_taxonomies' => false, 'has_featured_image' => true, 'has_excerpt' => true, 'has_comments' => false,
        'supports' => ['title','editor'], 'taxonomies' => [], 'slug' => 'gallery',
        'is_public' => true, 'is_hierarchical' => false, 'menu_icon' => null, 'menu_position' => 6,
    ]);

    // Create with featured_image
    $resp = $this->post(route('dashboard.admin.posts.store'), [
        'post_type_id' => $type->id,
        'title' => 'With Image',
        'slug' => null,
        'content' => 'Body',
        'status' => 'draft',
        'featured_image' => 'https://cdn.test/img.jpg',
    ]);
    $resp->assertRedirect(route('dashboard.admin.posts.index'));

    $post = Post::first();
    expect($post)->not->toBeNull();
    expect($post->featured_image)->toBe('https://cdn.test/img.jpg');

    // Update to a new featured_image
    $resp2 = $this->put(route('dashboard.admin.posts.update', $post), [
        'post_type_id' => $type->id,
        'title' => 'With Image 2',
        'slug' => $post->slug,
        'content' => 'Body 2',
        'status' => 'published',
        'featured_image' => 'https://cdn.test/img2.jpg',
    ]);
    $resp2->assertRedirect(route('dashboard.admin.posts.index'));
    $post->refresh();
    expect($post->featured_image)->toBe('https://cdn.test/img2.jpg');

    // Clear featured_image
    $resp3 = $this->put(route('dashboard.admin.posts.update', $post), [
        'post_type_id' => $type->id,
        'title' => 'With Image 3',
        'slug' => $post->slug,
        'content' => 'Body 3',
        'status' => 'draft',
        'featured_image' => null,
    ]);
    $resp3->assertRedirect(route('dashboard.admin.posts.index'));
    $post->refresh();
    expect($post->featured_image)->toBeNull();
});
