<?php

use App\Models\Locale;
use App\Models\PostTranslation;

it('links the other languages of a translated page for search engines', function () {
    activateReactTheme();
    Locale::create(['code' => 'en', 'name' => 'English', 'native_name' => 'English', 'is_active' => true, 'is_default' => true]);
    Locale::create(['code' => 'es', 'name' => 'Spanish', 'native_name' => 'Español', 'is_active' => true, 'is_default' => false]);
    $page = makePublishedPage(['slug' => 'about', 'title' => 'About']);
    PostTranslation::create(['post_id' => $page->id, 'locale' => 'es', 'title' => 'Acerca', 'slug' => 'acerca', 'content' => 'Hola']);

    $html = $this->get('/about')->assertOk()->getContent();

    expect($html)->toContain('<link rel="alternate" hreflang="en" href="'.url('/about').'">')
        ->toContain('<link rel="alternate" hreflang="es" href="'.url('/es/acerca').'">')
        ->toContain('<link rel="alternate" hreflang="x-default" href="'.url('/about').'">');
});

it('adds no language links to a page that exists in one language', function () {
    activateReactTheme();
    makePublishedPage(['slug' => 'about']);

    expect($this->get('/about')->getContent())->not->toContain('hreflang=');
});

it('has error pages that work under the content security policy', function (int $code, string $title) {
    $html = view("errors.{$code}", ['exception' => new RuntimeException('Something broke')])->render();

    expect($html)->toContain($title)
        ->not->toContain('onclick=')
        // An error page has no app to boot: styles only
        ->not->toContain('resources/js/app.tsx');
})->with([
    [403, 'Access Denied'],
    [404, 'Page Not Found'],
    [419, 'Page Expired'],
    [500, 'Server Error'],
    [503, 'Back Soon'],
]);
