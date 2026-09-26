<?php

use App\Models\User;

beforeEach(function () {
    config(['content.page_cache.enabled' => true]);
    activateReactTheme();
});

it('serves repeat visits from the cache with this visitor\'s own token and nonce', function () {
    config(['security.csp' => 'enforce']);
    makePublishedPage(['slug' => 'about', 'title' => 'About us']);

    $this->get('/about')->assertOk()->assertHeader('X-Page-Cache', 'miss');
    $hit = $this->get('/about')->assertOk()->assertHeader('X-Page-Cache', 'hit');

    $html = $hit->getContent();
    preg_match("/'nonce-([^']+)'/", (string) $hit->headers->get('Content-Security-Policy'), $nonce);
    preg_match('/<meta name="csrf-token" content="([^"]+)"/', $html, $token);

    expect($html)->toContain('About us')
        ->not->toContain('__MODULO_')
        ->and($token[1] ?? null)->toBe(session()->token())
        ->and($html)->toContain('nonce="'.$nonce[1].'"');
});

it('shows a change on the very next visit', function () {
    $page = makePublishedPage(['slug' => 'about', 'title' => 'About us', 'meta_title' => null]);
    $this->get('/about')->assertHeader('X-Page-Cache', 'miss');

    $page->update(['title' => 'About the team']);

    $this->get('/about')->assertHeader('X-Page-Cache', 'miss')->assertSee('About the team');
});

it('never caches for signed-in users, flash messages or arbitrary query strings', function () {
    makePublishedPage(['slug' => 'about']);

    $this->actingAs(User::factory()->create())->get('/about')->assertHeaderMissing('X-Page-Cache');
    auth()->logout();

    $this->withSession(['_flash.old' => ['status'], 'status' => 'Saved'])->get('/about')->assertHeaderMissing('X-Page-Cache');

    $this->get('/about?utm_source=news')->assertHeaderMissing('X-Page-Cache');
    $this->get('/about?page=2')->assertHeader('X-Page-Cache', 'miss');
});

