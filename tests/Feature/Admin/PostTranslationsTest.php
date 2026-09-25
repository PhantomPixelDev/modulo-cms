<?php

use App\Models\Post;

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
