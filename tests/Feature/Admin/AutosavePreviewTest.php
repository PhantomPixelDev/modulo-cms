<?php

use App\Models\Post;
use App\Models\PostAutosave;
use App\Models\PostType;
use Illuminate\Support\Facades\URL;

function autosaveType(): PostType
{
    return PostType::factory()->create(['name' => 'news', 'slug' => 'news', 'route_prefix' => 'news']);
}

it('keeps the editor text as an autosave and offers it back', function () {
    $post = Post::factory()->create(['post_type_id' => autosaveType()->id, 'title' => 'Saved', 'content' => '<p>Saved</p>']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    $this->putJson(route('dashboard.admin.autosave.store', ['postId' => $post->id]), ['title' => 'Typing', 'content' => '<p>Typing</p>'])
        ->assertOk()
        ->assertJsonStructure(['saved_at']);

    $this->getJson(route('dashboard.admin.autosave.show', ['postId' => $post->id]))
        ->assertJsonPath('autosave.title', 'Typing')
        ->assertJsonPath('autosave.content', '<p>Typing</p>');

    // The post itself is untouched
    expect($post->fresh()->title)->toBe('Saved');
});

it('keeps one autosave per post and editor', function () {
    $post = Post::factory()->create(['post_type_id' => autosaveType()->id]);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    $this->putJson(route('dashboard.admin.autosave.store', ['postId' => $post->id]), ['title' => 'One']);
    $this->putJson(route('dashboard.admin.autosave.store', ['postId' => $post->id]), ['title' => 'Two']);

    expect(PostAutosave::where('post_id', $post->id)->count())->toBe(1)
        ->and(PostAutosave::where('post_id', $post->id)->value('title'))->toBe('Two');
});

it('drops the autosave once the post is saved', function () {
    $type = autosaveType();
    $user = makeAdminUserWithPermissions(['edit posts', 'publish posts']);
    $post = Post::factory()->create(['post_type_id' => $type->id, 'slug' => 'story', 'status' => 'draft']);
    $this->actingAs($user);

    $this->putJson(route('dashboard.admin.autosave.store', ['postId' => $post->id]), ['title' => 'Better title', 'content' => 'x']);
    $this->put(route('dashboard.admin.posts.update', $post), [
        'post_type_id' => $type->id, 'title' => 'Better title', 'slug' => 'story', 'content' => 'x', 'status' => 'draft',
    ])->assertSessionHasNoErrors();

    expect(PostAutosave::where('post_id', $post->id)->exists())->toBeFalse();
});

it('does not offer an autosave that matches the saved text', function () {
    $post = Post::factory()->create(['post_type_id' => autosaveType()->id, 'title' => 'Same', 'excerpt' => null, 'content' => 'Body']);
    $user = makeAdminUserWithPermissions(['edit posts']);
    PostAutosave::create(['post_id' => $post->id, 'user_id' => $user->id, 'title' => 'Same', 'content' => 'Body']);

    $this->actingAs($user)
        ->getJson(route('dashboard.admin.autosave.show', ['postId' => $post->id]))
        ->assertJsonPath('autosave', null);
});

it('keeps autosaves to people who may edit the post', function () {
    $post = Post::factory()->create(['post_type_id' => autosaveType()->id]);
    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->putJson(route('dashboard.admin.autosave.store', ['postId' => $post->id]), ['title' => 'Nope'])
        ->assertForbidden();

    expect(PostAutosave::count())->toBe(0);
});

it('previews unsaved text through the theme without indexing or caching it', function () {
    activateReactTheme();
    $post = Post::factory()->create(['post_type_id' => autosaveType()->id, 'status' => 'draft', 'title' => 'Draft title', 'slug' => 'draft']);
    $user = makeAdminUserWithPermissions(['edit posts']);
    $this->actingAs($user)->putJson(route('dashboard.admin.autosave.store', ['postId' => $post->id]), ['title' => 'Unsaved title', 'content' => '<p>Fresh</p>']);

    $url = $this->postJson(route('dashboard.admin.preview.link', ['postId' => $post->id]))->assertOk()->json('url');
    auth()->logout();

    // Opens for someone without an account, while the link is valid
    $response = $this->get($url)->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow');
    expect($response->getContent())->toContain('Unsaved title')
        ->toContain('noindex')
        ->and($post->fresh()->title)->toBe('Draft title')
        ->and((int) $post->fresh()->view_count)->toBe((int) $post->view_count);
});

it('refuses a preview link that was tampered with or expired', function () {
    activateReactTheme();
    $post = Post::factory()->create(['post_type_id' => autosaveType()->id, 'status' => 'draft']);

    $this->get(route('content.preview', ['postId' => $post->id]))->assertForbidden();

    $expired = URL::temporarySignedRoute('content.preview', now()->subMinute(), ['postId' => $post->id]);
    $this->get($expired)->assertForbidden();
});

it('lists revisions together with the current text to compare against', function () {
    $post = Post::factory()->create(['post_type_id' => autosaveType()->id, 'title' => 'First']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));
    $post->update(['title' => 'Second']);

    $this->getJson(route('dashboard.admin.revisions.index', ['postId' => $post->id]))
        ->assertJsonPath('revisions.0.title', 'First')
        ->assertJsonPath('current.title', 'Second');
});
