<?php

use Inertia\Inertia;

it('sends security headers and a nonce-based policy on pages', function () {
    config(['security.csp' => 'enforce']);

    $response = $this->get('/login');

    $response->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    $policy = (string) $response->headers->get('Content-Security-Policy');
    expect($policy)->toContain("object-src 'none'")
        ->and($policy)->toContain("frame-ancestors 'self'");

    preg_match("/'nonce-([^']+)'/", $policy, $m);
    expect($m[1] ?? null)->not->toBeNull();

    // Executable inline scripts carry the nonce. Inertia 3's application/json
    // page payload is a data block, not executable JavaScript.
    $html = $response->getContent();
    preg_match_all('/<script(?![^>]*\bsrc=)(?![^>]*type="application\/json")[^>]*>/i', $html, $inline);
    foreach ($inline[0] as $tag) {
        expect($tag)->toContain('nonce="'.$m[1].'"');
    }
});

it('only reports violations in report mode', function () {
    config(['security.csp' => 'report']);

    $response = $this->get('/login');

    expect($response->headers->has('Content-Security-Policy-Report-Only'))->toBeTrue()
        ->and($response->headers->has('Content-Security-Policy'))->toBeFalse();
});

it('escapes executable markup inside the initial page data block', function () {
    $probe = '</script><script>alert("escaped-page-data")</script>';
    Inertia::share('security_probe', $probe);

    $html = $this->get('/login')->assertOk()->getContent();
    expect($html)->not->toContain($probe);
    preg_match('/<script[^>]*type="application\/json"[^>]*>(.*?)<\/script>/s', $html, $payload);
    expect($payload[1] ?? null)->not->toBeNull();
    $page = json_decode($payload[1], true, flags: JSON_THROW_ON_ERROR);
    expect($page['props']['security_probe'])->toBe($probe);
});

it('sends HSTS over HTTPS only', function () {
    expect($this->get('/login')->headers->has('Strict-Transport-Security'))->toBeFalse()
        ->and($this->get('https://localhost/login')->headers->get('Strict-Transport-Security'))->toContain('max-age=');
});
