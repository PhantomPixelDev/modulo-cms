<?php

use App\Models\EditorDraft;
use App\Models\Locale;
use App\Models\Post;
use App\Models\PostAutosave;
use App\Models\PostType;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

beforeEach(function () {
    Locale::create(['name' => 'English', 'code' => 'en', 'is_active' => true, 'is_default' => true]);
    Locale::create(['name' => 'Spanish', 'code' => 'es', 'is_active' => true, 'is_default' => false]);
});

function recoveryPayload(array $overrides = []): array
{
    return array_merge(['revision' => 0, 'content_type' => 'post', 'locale' => 'en', 'payload' => ['title' => 'Work in progress', 'content' => 'Body']], $overrides);
}

it('recovers new content and translations independently for their owner', function () {
    $this->actingAs(makeAdminUserWithPermissions(['create posts']));
    $english = $this->postJson(route('dashboard.admin.editor-drafts.store'), recoveryPayload())->assertOk()->json('draft');
    $spanish = $this->postJson(route('dashboard.admin.editor-drafts.store'), recoveryPayload(['locale' => 'es']))->assertOk()->json('draft');
    expect($english['id'])->not->toBe($spanish['id']);
    $this->getJson(route('dashboard.admin.editor-drafts.index'))->assertJsonCount(2, 'drafts');
    $this->getJson(route('dashboard.admin.editor-drafts.show', $english['id']))->assertJsonPath('draft.payload.title', 'Work in progress');
    $this->actingAs(makeAdminUserWithPermissions(['create posts']))
        ->getJson(route('dashboard.admin.editor-drafts.show', $english['id']))->assertNotFound();
    $this->getJson(route('dashboard.admin.editor-drafts.index'))->assertJsonCount(0, 'drafts');
});

it('rejects concurrent stale revisions without overwriting the newer text', function () {
    $this->actingAs(makeAdminUserWithPermissions(['create posts']));
    $draft = $this->postJson(route('dashboard.admin.editor-drafts.store'), recoveryPayload())->json('draft');
    $body = recoveryPayload(['id' => $draft['id'], 'revision' => 1, 'payload' => ['title' => 'Newer tab']]);
    $this->postJson(route('dashboard.admin.editor-drafts.store'), $body)->assertOk()->assertJsonPath('draft.revision', 2);
    $this->postJson(route('dashboard.admin.editor-drafts.store'), array_merge($body, ['payload' => ['title' => 'Older tab']]))->assertConflict();
    expect(EditorDraft::find($draft['id'])->payload['title'])->toBe('Newer tab');
});

it('enforces page permissions separately from post permissions', function () {
    $this->actingAs(makeAdminUserWithPermissions(['create posts']))
        ->postJson(route('dashboard.admin.editor-drafts.store'), recoveryPayload(['content_type' => 'page']))->assertForbidden();
    $this->actingAs(makeAdminUserWithPermissions(['create pages']))
        ->postJson(route('dashboard.admin.editor-drafts.store'), recoveryPayload(['content_type' => 'page']))->assertOk();
});

it('rejects unknown locales and unexpected payload fields', function () {
    $this->actingAs(makeAdminUserWithPermissions(['create posts']));
    $this->postJson(route('dashboard.admin.editor-drafts.store'), recoveryPayload(['locale' => 'xx']))->assertUnprocessable();
    $this->postJson(route('dashboard.admin.editor-drafts.store'), recoveryPayload(['payload' => ['admin' => true]]))->assertUnprocessable();
});

it('allows page editors to preview their own translated recovery and refuses other owners', function () {
    $type = PostType::factory()->create(['name' => 'page']);
    $post = Post::factory()->create(['post_type_id' => $type->id]);
    $this->actingAs(makeAdminUserWithPermissions(['edit pages']));
    $draft = $this->postJson(route('dashboard.admin.editor-drafts.store'), recoveryPayload([
        'post_id' => $post->id, 'content_type' => 'page', 'locale' => 'es',
    ]))->assertOk()->json('draft');
    $this->postJson(route('dashboard.admin.preview.link', ['postId' => $post->id]), ['draft' => $draft['id'], 'locale' => 'es'])
        ->assertOk()->assertJsonStructure(['url']);
    $this->postJson(route('dashboard.admin.preview.link', ['postId' => $post->id]), ['draft' => $draft['id'], 'locale' => 'en'])->assertUnprocessable();
    $this->actingAs(makeAdminUserWithPermissions(['edit pages']))
        ->postJson(route('dashboard.admin.preview.link', ['postId' => $post->id]), ['draft' => $draft['id'], 'locale' => 'es'])->assertNotFound();
});

it('copies old autosaves forward without losing historical records', function () {
    $post = Post::factory()->create(['post_type_id' => PostType::factory()->create()->id]);
    $user = makeAdminUserWithPermissions(['edit posts']);
    PostAutosave::create(['post_id' => $post->id, 'user_id' => $user->id, 'title' => 'Legacy', 'content' => 'Text']);
    Schema::drop('editor_drafts');
    (require database_path('migrations/2026_10_07_000001_create_editor_drafts_table.php'))->up();
    expect(EditorDraft::first()->payload['title'])->toBe('Legacy')
        ->and(EditorDraft::first()->locale)->toBe('en')->and(PostAutosave::count())->toBe(1);
});

it('prunes only abandoned recovery records', function () {
    $user = makeAdminUserWithPermissions(['create posts']);
    foreach ([31, 29] as $days) {
        EditorDraft::create(['id' => Str::uuid(), 'user_id' => $user->id, 'content_type' => 'post', 'locale' => 'en', 'payload' => ['title' => 'Draft'], 'revision' => 1, 'updated_at' => now()->subDays($days)]);
    }
    $this->artisan('model:prune', ['--model' => EditorDraft::class])->assertSuccessful();
    expect(EditorDraft::count())->toBe(1);
});

it('applies explicit publication actions and keeps the editor open', function (string $action, string $expected) {
    $type = PostType::factory()->create();
    $post = Post::factory()->create(['post_type_id' => $type->id, 'status' => 'published', 'published_at' => now()->subDay()]);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts', 'publish posts']));
    $this->put(route('dashboard.admin.posts.update', $post), [
        'title' => 'Changed', 'slug' => $post->slug, 'content' => 'Text', 'post_type_id' => $type->id,
        'status' => 'draft', 'editor_action' => $action, 'locale' => 'es',
    ])->assertSessionHasNoErrors()->assertRedirect(route('dashboard.admin.posts.edit', ['post' => $post->id, 'locale' => 'es']));
    expect($post->fresh()->status)->toBe($expected)->and($post->fresh()->title)->toBe($post->title)
        ->and($post->fresh()->translation('es')->title)->toBe('Changed');
})->with([['draft', 'draft'], ['publish', 'published'], ['update', 'published']]);

it('uses the site timezone for schedules and validates future dates', function () {
    SiteSetting::set('timezone', 'Europe/Berlin');
    $type = PostType::factory()->create();
    $post = Post::factory()->create(['post_type_id' => $type->id, 'status' => 'draft']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts', 'publish posts']));
    $body = ['title' => 'Schedule', 'slug' => $post->slug, 'content' => 'Text', 'post_type_id' => $type->id, 'status' => 'draft', 'editor_action' => 'schedule', 'published_at' => '2030-07-10T15:30'];
    $this->put(route('dashboard.admin.posts.update', $post), $body)->assertSessionHasNoErrors();
    expect($post->fresh()->published_at->utc()->format('Y-m-d H:i'))->toBe('2030-07-10 13:30');
    $body['published_at'] = '2000-01-01T12:00';
    $this->put(route('dashboard.admin.posts.update', $post), $body)->assertSessionHasErrors('published_at');
});

it('does not delete recovery on validation failure or a stale explicit save', function () {
    $user = makeAdminUserWithPermissions(['create posts']);
    $this->actingAs($user);
    $draft = $this->postJson(route('dashboard.admin.editor-drafts.store'), recoveryPayload())->json('draft');
    $body = ['editor_action' => 'draft', 'editor_draft_id' => $draft['id'], 'editor_draft_revision' => 1, 'locale' => 'en'];
    $this->post(route('dashboard.admin.posts.store'), $body)->assertSessionHasErrors('title');
    expect(EditorDraft::find($draft['id']))->not->toBeNull();
    $body['editor_draft_revision'] = 2;
    $this->post(route('dashboard.admin.posts.store'), $body)->assertSessionHasErrors('editor_draft_id');
});
