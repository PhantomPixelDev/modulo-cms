<?php

use App\Models\Locale;
use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;

beforeEach(function () {
    activateReactTheme();
});

it('serves a page whose slug is two letters', function () {
    // The {locale} prefix used to swallow every two-letter slug
    makePublishedPage(['slug' => 'us', 'title' => 'United States']);

    $this->get('/us')->assertOk()->assertSee('United States');
});

it('treats a known locale prefix as a locale, not a page', function () {
    Locale::create(['code' => 'es', 'name' => 'Spanish', 'native_name' => 'Espanol', 'is_active' => true, 'is_default' => false]);
    makePublishedPage(['slug' => 'about', 'title' => 'About us']);

    $this->get('/es/about')->assertOk()->assertSee('About us');
    $this->get('/es')->assertOk();
});

it('serves post type archives and single posts without registering routes per type', function () {
    $news = PostType::factory()->create(['name' => 'news', 'slug' => 'news', 'route_prefix' => 'news', 'is_public' => true]);
    Post::factory()->published()->create(['post_type_id' => $news->id, 'slug' => 'launch', 'title' => 'News Launch']);

    $this->get('/news')->assertOk();
    $this->get('/news/launch')->assertOk()->assertSee('News Launch');
    $this->get('/news/missing')->assertNotFound();
});

it('serves taxonomy archives on the configured base', function () {
    SiteSetting::set('category_base', 'topics');

    $taxonomy = Taxonomy::create([
        'name' => 'Categories', 'label' => 'Category', 'plural_label' => 'Categories',
        'description' => null, 'slug' => 'categories', 'is_hierarchical' => true, 'is_public' => true,
        'post_types' => [], 'show_in_menu' => true, 'menu_icon' => null, 'menu_position' => 5,
    ]);
    TaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'Laravel', 'slug' => 'laravel', 'term_order' => 0]);

    $this->get('/topics/laravel')->assertOk();
    $this->get('/categories/laravel')->assertOk();
});

it('keeps reserved prefixes for explicit routes', function () {
    $this->get('/dashboard')->assertRedirect();
    $this->get('/robots.txt')->assertOk();
});

it('can cache the route table', function () {
    // Fails if any route is a closure or registered from the database
    $this->artisan('route:cache')->assertSuccessful();
    $this->artisan('route:clear')->assertSuccessful();
});

it('serves a page at its translated slug in that locale', function () {
    // The sitemap and hreflang links publish /{locale}/{translated-slug};
    // matching only the default slug made every one of them a 404.
    Locale::create(['code' => 'es', 'name' => 'Spanish', 'native_name' => 'Espanol', 'is_active' => true, 'is_default' => false]);
    $page = makePublishedPage(['slug' => 'about', 'title' => 'About us']);
    $page->setTranslation('es', ['title' => 'Acerca de', 'slug' => 'acerca', 'content' => 'Contenido']);

    $this->get('/es/acerca')->assertOk();
    $this->get('/es/about')->assertOk();
});

it('serves a custom post type entry at its translated slug', function () {
    Locale::create(['code' => 'en', 'name' => 'English', 'native_name' => 'English', 'is_active' => true, 'is_default' => true]);
    Locale::create(['code' => 'es', 'name' => 'Spanish', 'native_name' => 'Espanol', 'is_active' => true, 'is_default' => false]);
    $news = PostType::factory()->create(['name' => 'news', 'slug' => 'news', 'route_prefix' => 'news', 'is_public' => true]);
    $post = Post::factory()->published()->create(['post_type_id' => $news->id, 'slug' => 'launch', 'title' => 'News Launch']);
    $post->setTranslation('es', ['title' => 'Lanzamiento', 'slug' => 'lanzamiento', 'content' => 'Contenido']);

    // A translated slug belongs to its own locale only. Checked first: visiting
    // /es/... stores the locale in the session for later requests.
    $this->get('/news/lanzamiento')->assertNotFound();
    $this->get('/es/news/lanzamiento')->assertOk();
});
