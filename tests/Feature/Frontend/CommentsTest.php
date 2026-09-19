<?php

use App\Models\Comment;
use App\Models\Post;
use App\Models\PostType;

function commentablePost(array $attributes = []): Post
{
    $type = PostType::factory()->create(['has_comments' => true]);

    return Post::factory()->published()->create(array_merge(['post_type_id' => $type->id], $attributes));
}

function commentPayload(array $overrides = []): array
{
    return array_merge([
        'content' => 'Nice post',
        'author_name' => 'Visitor',
        'author_email' => 'visitor@example.com',
    ], $overrides);
}

it('stores comments on published posts', function () {
    $post = commentablePost();

    $this->post(route('posts.comments.store', $post), commentPayload())->assertRedirect();

    expect(Comment::count())->toBe(1);
});

it('rejects comments on unpublished posts', function () {
    $post = commentablePost(['status' => 'draft', 'published_at' => null]);

    $this->post(route('posts.comments.store', $post), commentPayload())->assertNotFound();

    expect(Comment::count())->toBe(0);
});

it('silently drops comments that fill the honeypot', function () {
    $post = commentablePost();

    $this->post(route('posts.comments.store', $post), commentPayload(['website' => 'http://spam.test']))
        ->assertRedirect();

    expect(Comment::count())->toBe(0);
});
