<?php

use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function listType(string $name = 'article'): PostType
{
    return PostType::factory()->create(['name' => $name, 'slug' => $name.'s', 'route_prefix' => $name]);
}

it('searches every post, not only the first page', function () {
    SiteSetting::set('posts_per_page', 2);
    $type = listType();
    Post::factory()->count(5)->create(['post_type_id' => $type->id]);
    Post::factory()->create(['post_type_id' => $type->id, 'title' => 'Needle In A Haystack', 'created_at' => now()->subYear()]);

    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->get(route('dashboard.admin.posts.index', ['search' => 'needle']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('posts.total', 1)
            ->where('posts.data.0.title', 'Needle In A Haystack')
            ->where('filters.search', 'needle'));
});

it('pages through the list and keeps the filters in the links', function () {
    SiteSetting::set('posts_per_page', 2);
    $type = listType();
    Post::factory()->count(5)->create(['post_type_id' => $type->id, 'status' => 'draft']);

    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->get(route('dashboard.admin.posts.index', ['status' => 'draft', 'page' => 3]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('posts.current_page', 3)
            ->where('posts.last_page', 3)
            ->has('posts.data', 1)
            ->where('posts.next_page_url', null)
            ->where('posts.prev_page_url', fn ($url) => str_contains($url, 'status=draft')));
});

it('filters by status, scheduled and author', function () {
    $type = listType();
    $author = makeAdminUserWithPermissions(['view posts']);
    Post::factory()->published()->create(['post_type_id' => $type->id, 'title' => 'Live']);
    Post::factory()->create(['post_type_id' => $type->id, 'title' => 'Later', 'status' => 'published', 'published_at' => now()->addDay()]);
    Post::factory()->create(['post_type_id' => $type->id, 'title' => 'Mine', 'status' => 'draft', 'author_id' => $author->id]);
    $this->actingAs($author);

    $titles = fn (array $query) => collect($this->get(route('dashboard.admin.posts.index', $query))->viewData('page')['props']['posts']['data'])
        ->pluck('title')->sort()->values()->all();

    expect($titles(['status' => 'scheduled']))->toBe(['Later'])
        ->and($titles(['status' => 'draft']))->toBe(['Mine'])
        ->and($titles(['author_id' => $author->id]))->toBe(['Mine']);
});

it('rejects an unknown status filter', function () {
    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->get(route('dashboard.admin.posts.index', ['status' => 'bogus']))
        ->assertSessionHasErrors('status');
});

it('searches pages beyond the first page too', function () {
    SiteSetting::set('posts_per_page', 2);
    $type = listType('page');
    Post::factory()->count(4)->create(['post_type_id' => $type->id]);
    Post::factory()->create(['post_type_id' => $type->id, 'title' => 'About us', 'slug' => 'about', 'created_at' => now()->subYear()]);

    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->get(route('dashboard.admin.pages.index', ['search' => 'about']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('posts.total', 1)
            ->where('posts.data.0.title', 'About us'));
});

it('publishes, unpublishes and trashes several posts at once', function () {
    $type = listType();
    [$a, $b] = Post::factory()->count(2)->create(['post_type_id' => $type->id, 'status' => 'draft', 'published_at' => null]);
    $this->actingAs(makeAdminUserWithPermissions(['view posts', 'edit posts', 'delete posts', 'publish posts']));

    $this->post(route('dashboard.admin.posts.bulk'), ['action' => 'publish', 'ids' => [$a->id, $b->id]])
        ->assertSessionHas('success');
    expect($a->fresh()->status)->toBe('published')
        ->and($a->fresh()->published_at)->not->toBeNull();

    $this->post(route('dashboard.admin.posts.bulk'), ['action' => 'draft', 'ids' => [$a->id]]);
    expect($a->fresh()->status)->toBe('draft');

    $this->post(route('dashboard.admin.posts.bulk'), ['action' => 'trash', 'ids' => [$a->id, $b->id]]);
    expect(Post::whereIn('id', [$a->id, $b->id])->count())->toBe(0)
        ->and(Post::withTrashed()->whereIn('id', [$a->id, $b->id])->count())->toBe(2);
});

it('skips posts the user may not publish or trash', function () {
    $type = listType();
    $post = Post::factory()->create(['post_type_id' => $type->id, 'status' => 'draft']);
    $this->actingAs(makeAdminUserWithPermissions(['view posts', 'edit posts']));

    $this->post(route('dashboard.admin.posts.bulk'), ['action' => 'publish', 'ids' => [$post->id]])
        ->assertSessionHas('warning');
    $this->post(route('dashboard.admin.posts.bulk'), ['action' => 'trash', 'ids' => [$post->id]])
        ->assertSessionHas('warning');

    expect($post->fresh())->not->toBeNull()
        ->and($post->fresh()->status)->toBe('draft');
});

it('needs the page publish permission to bulk publish pages', function () {
    $page = Post::factory()->create(['post_type_id' => listType('page')->id, 'status' => 'draft']);
    $this->actingAs(makeAdminUserWithPermissions(['view posts', 'edit posts', 'publish posts']));

    $this->post(route('dashboard.admin.posts.bulk'), ['action' => 'publish', 'ids' => [$page->id]])
        ->assertSessionHas('warning');
    expect($page->fresh()->status)->toBe('draft');
});

it('keeps people without list access out of bulk actions', function () {
    $post = Post::factory()->create(['status' => 'draft']);
    Permission::findOrCreate('view posts', 'web');
    $this->actingAs(makeAdminUserWithPermissions([]))
        ->post(route('dashboard.admin.posts.bulk'), ['action' => 'trash', 'ids' => [$post->id]])
        ->assertForbidden();
});
