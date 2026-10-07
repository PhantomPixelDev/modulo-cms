<?php

use App\Models\Locale;
use App\Models\Post;
use Illuminate\Support\Facades\Artisan;

function translationPayload(): array
{
    return [
        'locale' => 'es',
        'title' => 'Hola',
        'slug' => 'hola',
        'content' => '<p>Hola mundo</p>',
    ];
}

it('lets an editor save and delete a translation', function () {
    $post = Post::factory()->create();
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    $this->post(route('dashboard.admin.posts.translations.store', $post), translationPayload())
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($post->translations()->where('locale', 'es')->value('title'))->toBe('Hola');

    $this->delete(route('dashboard.admin.posts.translations.destroy', [$post, 'es']))->assertRedirect();

    expect($post->translations()->where('locale', 'es')->exists())->toBeFalse();
});

it('does not let an admin-area user without edit rights translate a post', function () {
    // e.g. a comment moderator: allowed into the admin, not allowed to edit posts
    $post = Post::factory()->create();
    $this->actingAs(makeAdminUserWithPermissions(['moderate comments']));

    $this->post(route('dashboard.admin.posts.translations.store', $post), translationPayload())
        ->assertForbidden();

    expect($post->translations()->exists())->toBeFalse();
});

it('does not let an admin-area user without edit rights delete a translation', function () {
    $post = Post::factory()->create();
    $post->setTranslation('es', ['title' => 'Hola', 'slug' => 'hola']);
    $this->actingAs(makeAdminUserWithPermissions(['moderate comments']));

    $this->delete(route('dashboard.admin.posts.translations.destroy', [$post, 'es']))->assertForbidden();

    expect($post->translations()->where('locale', 'es')->exists())->toBeTrue();
});

function seedLocales(): void
{
    Locale::create(['code' => 'en', 'name' => 'English', 'native_name' => 'English', 'is_active' => true, 'is_default' => true]);
    Locale::create(['code' => 'es', 'name' => 'Spanish', 'native_name' => 'Español', 'is_active' => true, 'is_default' => false]);
    Locale::clearCache();
}

it('updates a post through its numeric ID, the way the editor saves', function () {
    $post = Post::factory()->create(['title' => 'Original', 'slug' => 'original']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    // Regression: {post} used to bind by slug only, so the editor's
    // ID-based PUT 404'd.
    $this->put("/dashboard/admin/posts/{$post->id}", [
        'post_type_id' => $post->post_type_id,
        'title' => 'Renamed',
        'slug' => 'renamed',
        'content' => 'Body',
        'status' => 'draft',
    ])->assertRedirect();

    expect($post->refresh()->title)->toBe('Renamed');
});

it('saves a second-locale translation without touching the base post', function () {
    seedLocales();
    $post = Post::factory()->create(['title' => 'Hello', 'slug' => 'hello']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    $this->put("/dashboard/admin/posts/{$post->id}", [
        'post_type_id' => $post->post_type_id,
        'title' => 'Hola',
        'slug' => 'hola',
        'content' => 'Cuerpo',
        'status' => 'draft',
        'locale' => 'es',
    ])->assertRedirect();

    expect($post->refresh()->title)->toBe('Hello');
    expect($post->translations()->where('locale', 'es')->value('title'))->toBe('Hola');
});

it('falls back to the default locale for an unknown locale', function () {
    seedLocales();
    $post = Post::factory()->create(['title' => 'Hello', 'slug' => 'hello']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    $this->put("/dashboard/admin/posts/{$post->id}", [
        'post_type_id' => $post->post_type_id,
        'title' => 'Hello edited',
        'slug' => 'hello',
        'content' => 'Body',
        'status' => 'draft',
        'locale' => 'xx',
    ])->assertRedirect();

    expect($post->refresh()->title)->toBe('Hello edited');
    expect($post->translations()->where('locale', 'xx')->exists())->toBeFalse();
});

it('saves a page translation without touching the base page', function () {
    seedLocales();
    $page = makePublishedPage(['title' => 'About', 'slug' => 'about']);
    $this->actingAs(makeAdminUserWithPermissions(['edit pages']));

    $this->put(route('dashboard.admin.pages.update', $page), [
        'title' => 'Acerca de',
        'slug' => 'acerca-de',
        'content' => 'Contenido',
        'status' => 'draft',
        'locale' => 'es',
    ])->assertRedirect();

    expect($page->refresh()->title)->toBe('About');
    expect($page->translations()->where('locale', 'es')->value('title'))->toBe('Acerca de');
});

it('deletes a page translation through the pages route', function () {
    $page = makePublishedPage();
    $page->setTranslation('es', ['title' => 'Hola', 'slug' => 'hola']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    $this->delete(route('dashboard.admin.pages.translations.destroy', [$page->id, 'es']))->assertRedirect();

    expect($page->translations()->where('locale', 'es')->exists())->toBeFalse();
});

it('resolves the post editor by slug and saves by ID with cached routes', function () {
    seedLocales();
    $post = Post::factory()->create(['title' => 'Cache Proof', 'slug' => 'cache-proof']);
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']));

    // Production boots with a cached route table, which means route files
    // never load. Bindings registered there silently stop working (the edit
    // page 500s on Postgres, which unlike SQLite will not compare bigint to
    // text). The binding must live where it always runs.
    Artisan::call('route:cache');
    try {
        $this->get(route('dashboard.admin.posts.edit', $post->slug).'?locale=es')->assertOk();
        $this->put(route('dashboard.admin.posts.update', $post->id), [
            'post_type_id' => $post->post_type_id,
            'title' => 'Prueba',
            'slug' => 'prueba',
            'content' => 'Cuerpo',
            'status' => 'draft',
            'locale' => 'es',
        ])->assertRedirect();

        expect($post->translations()->where('locale', 'es')->value('title'))->toBe('Prueba');
    } finally {
        Artisan::call('route:clear');
    }
});
