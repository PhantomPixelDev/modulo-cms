<?php

use App\Console\Commands\PublishScheduledCommand;
use App\Models\Activity;
use App\Models\Post;
use App\Models\PostRevision;
use App\Support\SystemMeta;

it('moves deleted posts to the trash and restores them', function () {
    $post = Post::factory()->create(['title' => 'Keep me']);
    $this->actingAs(makeAdminUserWithPermissions(['delete posts']));

    $this->delete(route('dashboard.admin.posts.destroy', $post))->assertSessionHas('success', 'Post moved to the trash.');
    expect(Post::find($post->id))->toBeNull()
        ->and(Post::onlyTrashed()->find($post->id))->not->toBeNull();

    $this->get(route('dashboard.admin.trash.index'))
        ->assertInertia(fn ($page) => $page->where('adminSection', 'trash')->where('trash.items.data.0.title', 'Keep me'));

    $this->post(route('dashboard.admin.trash.restore', ['id' => $post->id]))->assertSessionHas('success');
    expect(Post::find($post->id))->not->toBeNull();
});

it('deletes for good from the trash, one by one or all at once', function () {
    $one = Post::factory()->create();
    $two = Post::factory()->create();
    $one->delete();
    $two->delete();
    $this->actingAs(makeAdminUserWithPermissions(['delete posts']));

    $this->delete(route('dashboard.admin.trash.destroy', ['id' => $one->id]));
    expect(Post::withTrashed()->find($one->id))->toBeNull();

    $this->delete(route('dashboard.admin.trash.empty'));
    expect(Post::withTrashed()->count())->toBe(0);
});

it('purges trash older than the retention period', function () {
    config(['content.trash_days' => 30]);
    $old = Post::factory()->create();
    $recent = Post::factory()->create();
    $old->delete();
    $recent->delete();
    Post::withTrashed()->whereKey($old->id)->update(['deleted_at' => now()->subDays(31)]);

    $this->artisan('model:prune', ['--model' => [Post::class]])->assertSuccessful();

    expect(Post::withTrashed()->find($old->id))->toBeNull()
        ->and(Post::withTrashed()->find($recent->id))->not->toBeNull();
});

it('keeps trash away from users who cannot delete posts', function () {
    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->get(route('dashboard.admin.trash.index'))
        ->assertForbidden();
});

it('gives a new post a free slug when a trashed post holds its title', function () {
    $trashed = Post::factory()->create(['slug' => 'hello']);
    $trashed->delete();

    expect(Post::uniqueSlug('hello'))->toBe('hello-2')
        ->and(Post::uniqueSlug('hello', $trashed->id))->toBe('hello');
});

it('saves the previous text as a revision and restores it', function () {
    $post = Post::factory()->create(['title' => 'First', 'content' => '<p>One</p>']);
    $editor = makeAdminUserWithPermissions(['edit posts']);
    $this->actingAs($editor);

    $post->update(['title' => 'Second', 'content' => '<p>Two</p>']);
    $post->update(['view_count' => 5]); // not text: no revision

    $revision = PostRevision::where('post_id', $post->id)->sole();
    expect($revision->title)->toBe('First')
        ->and($revision->content)->toBe('<p>One</p>')
        ->and($revision->user_id)->toBe($editor->id);

    $this->getJson(route('dashboard.admin.revisions.index', ['postId' => $post->id]))
        ->assertOk()
        ->assertJsonPath('revisions.0.title', 'First');

    $this->post(route('dashboard.admin.revisions.restore', ['postId' => $post->id, 'revisionId' => $revision->id]))->assertSessionHas('success');

    expect($post->fresh()->title)->toBe('First')
        // The text that was replaced by the restore is itself a revision now.
        ->and(PostRevision::where('post_id', $post->id)->pluck('title')->all())->toContain('Second');
});

it('keeps only the newest revisions', function () {
    config(['content.revisions_keep' => 3]);
    $post = Post::factory()->create(['title' => 'v0']);

    foreach (range(1, 6) as $i) {
        $post->update(['title' => "v{$i}"]);
    }

    expect(PostRevision::where('post_id', $post->id)->orderByDesc('id')->pluck('title')->all())->toBe(['v5', 'v4', 'v3']);
});

it('does not show revisions to users who cannot edit', function () {
    $post = Post::factory()->create();

    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->getJson(route('dashboard.admin.revisions.index', ['postId' => $post->id]))
        ->assertForbidden();
});

it('announces scheduled posts once, when their time comes', function () {
    SystemMeta::put(PublishScheduledCommand::LAST_RUN_KEY, now()->subMinute()->toIso8601String());
    $due = Post::factory()->create(['status' => 'published', 'published_at' => now()->subSeconds(10), 'title' => 'Due now']);
    $later = Post::factory()->create(['status' => 'published', 'published_at' => now()->addHour(), 'title' => 'Later']);
    $fired = [];
    add_action('post_published', function (Post $post) use (&$fired) {
        $fired[] = $post->title;
    });

    $this->artisan('modulo:publish-scheduled')->expectsOutput('Published: Due now')->assertSuccessful();
    $this->artisan('modulo:publish-scheduled')->assertSuccessful();

    expect($fired)->toBe(['Due now'])
        ->and(Activity::where('event', 'post.published')->where('subject_id', $due->id)->count())->toBe(1)
        ->and(Activity::where('event', 'post.published')->where('subject_id', $later->id)->exists())->toBeFalse();
});

it('flags scheduled posts in the admin list', function () {
    Post::factory()->create(['status' => 'published', 'published_at' => now()->addDay()]);

    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->get(route('dashboard.admin.posts.index'))
        ->assertInertia(fn ($page) => $page->where('posts.data.0.is_scheduled', true));
});
