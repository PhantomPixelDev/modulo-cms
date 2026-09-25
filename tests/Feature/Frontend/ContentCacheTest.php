<?php

use App\Models\Post;
use App\Models\PostType;

beforeEach(function () {
    activateReactTheme();
});

it('shows edits to a page immediately', function () {
    $page = makePublishedPage(['slug' => 'about', 'title' => 'Old Title']);

    $this->get('/about')->assertOk()->assertSee('Old Title');

    $page->update(['title' => 'New Title']);

    $this->get('/about')->assertOk()->assertSee('New Title')->assertDontSee('Old Title');
});

it('hides a page as soon as it is unpublished', function () {
    $page = makePublishedPage(['slug' => 'temporary']);
    $this->get('/temporary')->assertOk();

    $page->update(['status' => 'draft']);

    $this->get('/temporary')->assertNotFound();
});

it('stops serving the old slug after a rename', function () {
    $page = makePublishedPage(['slug' => 'old-slug']);
    $this->get('/old-slug')->assertOk();

    $page->update(['slug' => 'new-slug']);

    // Not the cached old page: a permanent redirect to where it lives now.
    $this->get('/old-slug')->assertStatus(301)->assertRedirect(url('/new-slug'));
    $this->get('/new-slug')->assertOk();
});

it('shows a new comment right after it is posted', function () {
    $page = makePublishedPage(['slug' => 'discuss']);
    $page->postType->update(['has_comments' => true]);
    $this->get('/discuss')->assertOk();

    $this->post(route('posts.comments.store', $page), [
        'content' => 'First comment here',
        'author_name' => 'Visitor',
        'author_email' => 'visitor@example.com',
    ])->assertSessionHasNoErrors()->assertRedirect();

    expect($page->allComments()->count())->toBe(1);

    $this->get('/discuss')->assertOk()->assertSee('First comment here');
});

it('counts views without touching updated_at', function () {
    $page = makePublishedPage(['slug' => 'counted']);
    $updatedAt = $page->fresh()->updated_at;

    $this->travel(1)->hours();
    $this->get('/counted')->assertOk();

    $fresh = $page->fresh();
    expect($fresh->view_count)->toBe(1)
        ->and($fresh->updated_at->equalTo($updatedAt))->toBeTrue();
});

it('serves custom post types only under their own prefix', function () {
    $news = PostType::factory()->create(['name' => 'news', 'slug' => 'news', 'route_prefix' => 'news']);
    PostType::factory()->create(['name' => 'events', 'slug' => 'events', 'route_prefix' => 'events']);

    Post::factory()->published()->create(['post_type_id' => $news->id, 'slug' => 'launch', 'title' => 'News Launch']);

    $this->get('/news/launch')->assertOk()->assertSee('News Launch');
    $this->get('/events/launch')->assertNotFound();
});

it('reports a taken slug as a validation error across post types', function () {
    $news = PostType::factory()->create(['name' => 'news', 'slug' => 'news', 'route_prefix' => 'news', 'has_excerpt' => false, 'has_featured_image' => false]);
    $events = PostType::factory()->create(['name' => 'events', 'slug' => 'events', 'route_prefix' => 'events', 'has_excerpt' => false, 'has_featured_image' => false]);
    Post::factory()->published()->create(['post_type_id' => $news->id, 'slug' => 'launch']);

    $this->actingAs(makeAdminUserWithPermissions(['create posts']))
        ->post(route('dashboard.admin.posts.store'), [
            'post_type_id' => $events->id,
            'title' => 'Launch',
            'slug' => 'launch',
            'content' => 'Body',
            'status' => 'draft',
        ])
        ->assertSessionHasErrors('slug');
});
