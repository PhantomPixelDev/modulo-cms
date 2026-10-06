<?php

use App\Mail\CommentPending;
use App\Models\ApiToken;
use App\Models\Locale;
use App\Models\Post;
use App\Models\SiteSetting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;

function hardeningLocales(): void
{
    Locale::create(['code' => 'en', 'name' => 'English', 'native_name' => 'English', 'is_active' => true, 'is_default' => true]);
    Locale::create(['code' => 'es', 'name' => 'Spanish', 'native_name' => 'Español', 'is_active' => true, 'is_default' => false]);
    Locale::clearCache();
}

/**
 * Spatie throws (500) instead of denying (403) when the permission row does
 * not exist at all. Tests asserting a 403 must ensure the row exists first.
 */
function ensurePermissions(array $perms): void
{
    foreach ($perms as $perm) {
        \Spatie\Permission\Models\Permission::findOrCreate($perm, 'web');
    }
}

it('refuses registration when registration is disabled', function () {
    SiteSetting::set('registration_enabled', false, 'advanced', 'boolean');

    $this->post('/register', [
        'name' => 'Mallory',
        'email' => 'mallory@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertForbidden();

    expect(User::where('email', 'mallory@example.com')->exists())->toBeFalse();
});

it('kills API tokens on password reset', function () {
    $user = User::factory()->create();
    [$token] = ApiToken::issue($user, 'cli', ['read']);
    $oldRemember = $user->remember_token;

    $resetToken = Password::createToken($user);
    $this->post('/reset-password', [
        'token' => $resetToken,
        'email' => $user->email,
        'password' => 'new-password123',
        'password_confirmation' => 'new-password123',
    ])->assertSessionHasNoErrors();

    expect(ApiToken::where('id', $token->id)->exists())->toBeFalse();
    expect($user->refresh()->remember_token)->not->toBe($oldRemember);
});

it('revokes API tokens on logout', function () {
    $user = User::factory()->create();
    [$token] = ApiToken::issue($user, 'cli', ['read']);
    $this->actingAs($user);

    $this->post('/logout')->assertRedirect();

    expect(ApiToken::where('id', $token->id)->exists())->toBeFalse();
});

it('keeps page editors out of posts and post editors out of pages', function () {
    ensurePermissions(['edit posts', 'edit pages']);
    $post = Post::factory()->create(['title' => 'Post', 'slug' => 'post-one']);
    $page = makePublishedPage(['title' => 'Page', 'slug' => 'page-one']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    $payload = fn ($model) => [
        'post_type_id' => $model->post_type_id,
        'title' => 'Changed',
        'slug' => $model->slug,
        'content' => 'Body',
        'status' => 'draft',
    ];

    // Post editor may touch the post but not the page.
    $this->put(route('dashboard.admin.posts.update', $post->id), $payload($post))->assertRedirect();
    $this->put(route('dashboard.admin.pages.update', $page->id), $payload($page))->assertForbidden();

    // Page editor may touch the page but not the post.
    $this->actingAs(makeAdminUserWithPermissions(['edit pages']));
    $this->put(route('dashboard.admin.pages.update', $page->id), $payload($page))->assertRedirect();
    $this->put(route('dashboard.admin.posts.update', $post->id), $payload($post))->assertForbidden();
});

it('lets comment moderators moderate but not change global settings', function () {
    ensurePermissions(['moderate comments', 'edit settings']);
    $this->actingAs(makeAdminUserWithPermissions(['moderate comments']));

    $this->put(route('dashboard.admin.comments.settings'), ['comment_moderation' => true])->assertForbidden();
});

it('seeds media permissions and enforces backup permissions', function () {
    $this->artisan('db:seed', ['--class' => RolePermissionSeeder::class]);

    expect(\Spatie\Permission\Models\Permission::where('name', 'upload media')->exists())->toBeTrue();
    expect(\Spatie\Permission\Models\Permission::where('name', 'view backups')->exists())->toBeTrue();

    // Backup viewer without restore rights can list but not restore.
    $this->actingAs(makeAdminUserWithPermissions(['view backups']));
    $this->get(route('dashboard.admin.system.backups'))->assertOk();
    $this->post(route('dashboard.admin.system.backups.store'))->assertForbidden();
});

it('requires a verified email for the dashboard and API tokens', function () {
    $user = makeAdminUserWithPermissions([]);
    $user->forceFill(['email_verified_at' => null])->save();
    $this->actingAs($user);

    $this->get(route('dashboard'))->assertRedirect(route('verification.notice'));

    [, $plain] = ApiToken::issue($user, 'cli', ['read']);
    $this->getJson('/api/v1/posts', ['Authorization' => 'Bearer '.$plain])->assertUnauthorized();
});

it('dedupes translation slugs instead of crashing', function () {
    hardeningLocales();
    $first = Post::factory()->create(['title' => 'First', 'slug' => 'first']);
    $second = Post::factory()->create(['title' => 'Second', 'slug' => 'second']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    foreach ([$first, $second] as $post) {
        $this->post(route('dashboard.admin.posts.translations.store', $post->id), [
            'locale' => 'es',
            'title' => 'Hola',
            'slug' => 'hola',
        ])->assertRedirect();
    }

    expect($first->translations()->where('locale', 'es')->value('slug'))->toBe('hola');
    expect($second->translations()->where('locale', 'es')->value('slug'))->toBe('hola-2');
});

it('strips markup from comments on write', function () {
    $post = Post::factory()->published()->create();
    $post->postType()->update(['has_comments' => true]);

    $this->post(route('posts.comments.store', $post->slug), [
        'content' => '<script>alert(1)</script><b>Hi</b>',
        'author_name' => 'Ann<script>',
        'author_email' => 'ann@example.com',
    ])->assertRedirect();

    $comment = $post->comments()->latest('id')->first();
    expect($comment->content)->toBe('alert(1)Hi');
    expect($comment->author_name)->toBe('Ann');
});

it('sanitizes shortcode output and rejects bad youtube ids', function () {
    $post = Post::factory()->create([
        'title' => 'Shortcodes',
        'slug' => 'shortcodes',
        'content' => '[alert]<script>alert(1)</script>[/alert] [youtube id="evil\" onload=\"x"]',
    ]);

    $html = app(App\Presenters\PostPresenter::class)->renderContent($post);

    expect($html)->not->toContain('<script>');
    expect($html)->not->toContain('youtube.com/embed');
});

it('stops contributors from spoofing authorship', function () {
    $author = User::factory()->create();
    $me = makeAdminUserWithPermissions(['create posts']);
    $this->actingAs($me);

    $type = App\Models\PostType::factory()->create();
    $this->post(route('dashboard.admin.posts.store'), [
        'post_type_id' => $type->id,
        'title' => 'Mine',
        'content' => 'Body',
        'status' => 'draft',
        'author_id' => $author->id,
    ])->assertSessionHasErrors('author_id');

    $this->actingAs(makeAdminUserWithPermissions(['create posts', 'edit posts']));
    $this->post(route('dashboard.admin.posts.store'), [
        'post_type_id' => $type->id,
        'title' => 'Theirs',
        'content' => 'Body',
        'status' => 'draft',
        'author_id' => $author->id,
    ])->assertRedirect();
    expect(Post::where('slug', 'theirs')->value('author_id'))->toBe($author->id);
});

it('treats LIKE wildcards literally in admin search', function () {
    Post::factory()->create(['title' => '100% sure', 'slug' => 'hundred']);
    Post::factory()->create(['title' => 'Plain post', 'slug' => 'plain']);
    $this->actingAs(makeAdminUserWithPermissions(['view posts', 'edit posts']));

    $response = $this->get(route('dashboard.admin.posts.index', ['search' => '%']));
    $response->assertOk()->assertInertia(fn ($page) => $page
        ->where('posts.data.0.title', '100% sure')
        ->where('posts.total', 1));
});

it('assigns and removes roles through the new endpoints', function () {
    $boss = makeAdminUserWithPermissions(['assign roles', 'view users']);
    $user = User::factory()->create();
    $role = \Spatie\Permission\Models\Role::findOrCreate('editor', 'web');
    $this->actingAs($boss);

    $this->post(route('dashboard.admin.users.roles.assign', [$user->id, $role->id]))->assertRedirect();
    expect($user->refresh()->hasRole('editor'))->toBeTrue();

    $this->post(route('dashboard.admin.users.roles.remove', [$user->id, $role->id]))->assertRedirect();
    expect($user->refresh()->hasRole('editor'))->toBeFalse();
});

it('refuses handing super-admin to non-super-admins', function () {
    $boss = makeAdminUserWithPermissions(['assign roles', 'view users']);
    $user = User::factory()->create();
    $super = \Spatie\Permission\Models\Role::findOrCreate('super-admin', 'web');
    $this->actingAs($boss);

    $this->post(route('dashboard.admin.users.roles.assign', [$user->id, $super->id]))->assertRedirect();
    expect($user->refresh()->hasRole('super-admin'))->toBeFalse();
});

it('validates the reading-page settings against published pages', function () {
    $draft = makePublishedPage(['title' => 'Draft page', 'slug' => 'draft-page', 'status' => 'draft', 'published_at' => null]);
    $live = makePublishedPage(['title' => 'Live page', 'slug' => 'live-page']);
    $this->actingAs(makeAdminUserWithPermissions(['edit settings']));

    $this->put(route('dashboard.admin.settings.update', ['group' => 'reading']), [
        'posts_per_page' => 15,
        'show_on_front' => 'posts',
        'feed_limit' => 10,
        'front_page_id' => $draft->id,
    ])->assertSessionHasErrors('front_page_id');

    $this->put(route('dashboard.admin.settings.update', ['group' => 'reading']), [
        'posts_per_page' => 15,
        'show_on_front' => 'posts',
        'feed_limit' => 10,
        'front_page_id' => $live->id,
    ])->assertSessionHasNoErrors();
});

it('validates media bulk actions and ids', function () {
    $this->actingAs(makeAdminUserWithPermissions(['edit media', 'delete media']));

    $this->post(route('dashboard.admin.media.bulk'), ['action' => 'nuke', 'ids' => [1]])->assertSessionHasErrors('action');
    $this->post(route('dashboard.admin.media.bulk'), ['action' => 'delete', 'ids' => ['x']])->assertSessionHasErrors('ids.0');
});

it('notifies the admin email about pending comments', function () {
    Mail::fake();
    SiteSetting::set('admin_email', 'boss@example.com');
    SiteSetting::set('comment_moderation', true, 'general', 'boolean');
    $post = Post::factory()->published()->create();
    $post->postType()->update(['has_comments' => true]);

    $this->post(route('posts.comments.store', $post->slug), [
        'content' => 'Please review me',
        'author_name' => 'Ann',
        'author_email' => 'ann@example.com',
    ])->assertRedirect();

    Mail::assertQueued(CommentPending::class, fn ($mail) => $mail->hasTo('boss@example.com'));
});
