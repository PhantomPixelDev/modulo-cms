<?php

use App\Models\Comment;
use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use Inertia\Testing\AssertableInertia as Assert;

function moderationComment(array $attributes = []): Comment
{
    $type = PostType::factory()->create(['has_comments' => true]);
    $post = Post::factory()->published()->create(['post_type_id' => $type->id]);

    return Comment::create(array_merge([
        'post_id' => $post->id,
        'author_name' => 'Visitor',
        'author_email' => 'visitor@example.com',
        'content' => 'Hello there',
        'status' => 'pending',
    ], $attributes));
}

function moderator(): App\Models\User
{
    $user = makeAdminUserWithPermissions(['moderate comments']);
    $user->forceFill(['email_verified_at' => now()])->save();

    return $user;
}

it('requires the moderate comments permission', function () {
    Spatie\Permission\Models\Permission::findOrCreate('moderate comments', 'web');
    $user = makeAdminUserWithPermissions([]);

    $this->actingAs($user)->get(route('dashboard.admin.comments.index'))->assertForbidden();
});

it('lists comments with per-status counts and filters', function () {
    moderationComment(['status' => 'pending']);
    moderationComment(['status' => 'approved']);

    $this->actingAs(moderator())
        ->get(route('dashboard.admin.comments.index', ['status' => 'pending']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('adminSection', 'comments')
            ->where('commentCounts.all', 2)
            ->where('commentCounts.pending', 1)
            ->has('comments.data', 1)
            ->where('comments.data.0.status', 'pending')
        );
});

it('approves, flags and deletes comments', function () {
    $comment = moderationComment();
    $user = moderator();

    $this->actingAs($user)->patch(route('dashboard.admin.comments.update', $comment), ['status' => 'approved'])->assertRedirect();
    expect($comment->fresh()->status)->toBe('approved')
        ->and($comment->fresh()->approved_at)->not->toBeNull();

    $this->actingAs($user)->patch(route('dashboard.admin.comments.update', $comment), ['status' => 'spam'])->assertRedirect();
    expect($comment->fresh()->status)->toBe('spam')
        ->and($comment->fresh()->approved_at)->toBeNull();

    $this->actingAs($user)->delete(route('dashboard.admin.comments.destroy', $comment))->assertRedirect();
    expect(Comment::count())->toBe(0);
});

it('holds new visitor comments when moderation is enabled', function () {
    $this->actingAs(moderator())
        ->put(route('dashboard.admin.comments.settings'), ['comment_moderation' => true])
        ->assertRedirect();
    expect(SiteSetting::get('comment_moderation'))->toBeTrue();

    auth()->logout();
    $post = moderationComment()->post;

    $this->post(route('posts.comments.store', $post), [
        'content' => 'Please approve me',
        'author_name' => 'Guest',
        'author_email' => 'guest@example.com',
    ])->assertRedirect();

    expect(Comment::where('content', 'Please approve me')->value('status'))->toBe('pending')
        ->and($post->allComments()->where('content', 'Please approve me')->exists())->toBeFalse();
});
