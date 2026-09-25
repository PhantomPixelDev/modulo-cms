<?php

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

    // Every inline script in the page carries that nonce.
    $html = $response->getContent();
    preg_match_all('/<script(?![^>]*\bsrc=)[^>]*>/', $html, $inline);
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

it('sends HSTS over HTTPS only', function () {
    expect($this->get('/login')->headers->has('Strict-Transport-Security'))->toBeFalse()
        ->and($this->get('https://localhost/login')->headers->get('Strict-Transport-Security'))->toContain('max-age=');
});
