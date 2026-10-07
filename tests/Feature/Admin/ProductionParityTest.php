<?php

use App\Models\Post;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Mail;

it('returns 404 for non-numeric IDs on id-bound admin routes', function () {
    $this->actingAs(makeAdminUserWithPermissions(['view pages', 'view menus', 'view taxonomies', 'moderate comments']));

    $this->get(route('dashboard.admin.pages.edit', 'abc'))->assertNotFound();
    $this->get(route('dashboard.admin.menus.edit', 'abc'))->assertNotFound();
    $this->get(route('dashboard.admin.taxonomies.edit', 'abc'))->assertNotFound();
    $this->patch(route('dashboard.admin.comments.update', 'abc'), ['status' => 'approved'])->assertNotFound();
});

it('validates foreign keys as integers instead of crashing on Postgres', function () {
    $this->actingAs(makeAdminUserWithPermissions(['create posts', 'view taxonomy terms', 'view menu items', 'view menus']));

    $this->post(route('dashboard.admin.posts.store'), [
        'post_type_id' => 'abc',
        'title' => 'Hostile',
        'content' => 'Body',
        'status' => 'draft',
    ])->assertSessionHasErrors('post_type_id');

    $this->get(route('dashboard.admin.taxonomy-terms.index', ['taxonomy_id' => 'abc']))->assertSessionHasErrors('taxonomy_id');
    $this->get(route('dashboard.admin.menu-items.index', ['menu_id' => 'abc']))->assertSessionHasErrors('menu_id');
});

it('matches slugs case-insensitively when searching redirects', function () {
    $this->actingAs(makeAdminUserWithPermissions(['edit settings']));
    \App\Models\Redirect::create(['from_path' => '/Old-Path', 'to_url' => '/new', 'status_code' => 301]);

    $this->get(route('dashboard.admin.system.redirects', ['q' => 'old-path']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('redirects.items.data.0.from_path', '/Old-Path'));
});

it('dedupes case-variant translation slugs', function () {
    $post = Post::factory()->create(['title' => 'Hello', 'slug' => 'hello']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    $this->post(route('dashboard.admin.posts.translations.store', $post->id), [
        'locale' => 'es',
        'title' => 'HOLA',
        'slug' => 'HOLA',
    ])->assertRedirect();

    // Str::slug lowercases, and the LOWER() check catches what is left.
    expect($post->translations()->where('locale', 'es')->value('slug'))->toBe('hola');

    $second = Post::factory()->create(['title' => 'Second', 'slug' => 'second']);
    $this->post(route('dashboard.admin.posts.translations.store', $second->id), [
        'locale' => 'es',
        'title' => 'Hola again',
        'slug' => 'hola',
    ])->assertRedirect();

    expect($second->translations()->where('locale', 'es')->value('slug'))->toBe('hola-2');
});

it('queues registration emails instead of sending inline', function () {
    Mail::fake();
    SiteSetting::set('registration_enabled', true, 'advanced', 'boolean');

    $this->post('/register', [
        'name' => 'Queued',
        'email' => 'queued@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertRedirect();

    Mail::assertQueued(\App\Mail\UserWelcome::class);
});

it('keeps health probes answering during maintenance', function () {
    SiteSetting::set('maintenance_mode', true, 'general', 'boolean');

    $this->get('/health')->assertOk();
    $this->get('/')->assertStatus(503);
});

it('dispatches queue jobs after commit on persistent connections', function () {
    expect(config('queue.connections.database.after_commit'))->toBeTrue();
    expect(config('queue.connections.redis.after_commit'))->toBeTrue();
});
