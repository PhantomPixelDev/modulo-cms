<?php

use App\Models\Comment;
use App\Models\Post;
use App\Models\PostType;

it('stores new comments as pending moderation', function () {
    $postType = PostType::factory()->create([
        'name' => 'post',
        'slug' => 'post',
        'route_prefix' => 'posts',
        'has_comments' => true,
    ]);

    $post = Post::factory()->published()->create([
        'post_type_id' => $postType->id,
    ]);

    $this->post(route('posts.comments.store', $post), [
        'content' => 'Looks great!',
        'author_name' => 'Guest User',
        'author_email' => 'guest@example.com',
    ])->assertSessionHas('success', 'Thanks! Your comment is awaiting moderation.');

    $comment = Comment::query()->first();
    expect($comment)->not->toBeNull();
    expect($comment->status)->toBe('pending');
    expect($comment->approved_at)->toBeNull();
});
