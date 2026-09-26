<?php

use App\Models\Post;
use App\Models\PostType;

function newsType(): PostType
{
    return PostType::factory()->create(['name' => 'news', 'slug' => 'news', 'route_prefix' => 'news']);
}

it('lets writers without the publish permission save drafts only', function () {
    $type = newsType();
    $this->actingAs(makeAdminUserWithPermissions(['create posts', 'edit posts']));

    $this->post(route('dashboard.admin.posts.store'), [
        'post_type_id' => $type->id, 'title' => 'Live', 'content' => 'x', 'status' => 'published',
    ])->assertSessionHasErrors('status');

    $this->post(route('dashboard.admin.posts.store'), [
        'post_type_id' => $type->id, 'title' => 'Draft', 'content' => 'x', 'status' => 'draft',
    ])->assertSessionHasNoErrors();

    expect(Post::where('title', 'Live')->exists())->toBeFalse()
        ->and(Post::where('title', 'Draft')->value('status'))->toBe('draft');
});

it('lets writers edit a post that is already live', function () {
    $type = newsType();
    $user = makeAdminUserWithPermissions(['edit posts']);
    $post = Post::factory()->published()->create(['post_type_id' => $type->id, 'author_id' => $user->id, 'slug' => 'live']);
    $this->actingAs($user);

    $this->put(route('dashboard.admin.posts.update', $post), [
        'post_type_id' => $type->id, 'title' => 'Typo fixed', 'slug' => 'live', 'content' => 'y', 'status' => 'published',
    ])->assertSessionHasNoErrors();

    expect($post->fresh()->title)->toBe('Typo fixed');
});

it('lets editors publish', function () {
    $type = newsType();
    $this->actingAs(makeAdminUserWithPermissions(['create posts', 'publish posts']));

    $this->post(route('dashboard.admin.posts.store'), [
        'post_type_id' => $type->id, 'title' => 'Live', 'content' => 'x', 'status' => 'published',
    ])->assertSessionHasNoErrors();

    expect(Post::where('title', 'Live')->value('status'))->toBe('published');
});
