<?php

use App\Models\Locale;
use App\Models\Post;
use App\Models\PostType;
use App\Services\PostService;

it('resolves localized translation slug for non-default locale', function () {
    Locale::query()->delete();
    Locale::create([
        'code' => 'en',
        'name' => 'English',
        'native_name' => 'English',
        'direction' => 'ltr',
        'is_active' => true,
        'is_default' => true,
        'sort_order' => 1,
    ]);
    Locale::create([
        'code' => 'es',
        'name' => 'Spanish',
        'native_name' => 'Espanol',
        'direction' => 'ltr',
        'is_active' => true,
        'is_default' => false,
        'sort_order' => 2,
    ]);

    $postType = PostType::factory()->create([
        'name' => 'page',
        'slug' => 'page',
        'route_prefix' => null,
    ]);

    $post = Post::factory()->published()->create([
        'post_type_id' => $postType->id,
        'slug' => 'about',
    ]);

    $post->setTranslation('es', [
        'title' => 'Acerca',
        'slug' => 'acerca',
        'excerpt' => 'Resumen',
        'content' => 'Contenido',
        'seo_title' => 'Acerca',
        'seo_description' => 'Descripcion',
    ]);

    $resolved = app(PostService::class)->getPostBySlug('acerca', 'page', 'es');

    expect($resolved)->not->toBeNull();
    expect($resolved?->id)->toBe($post->id);
});
