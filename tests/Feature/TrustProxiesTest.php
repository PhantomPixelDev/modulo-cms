<?php

use App\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;

/**
 * Run the middleware on a hand-built request and report what the application
 * would believe about the visitor.
 *
 * @return array{ip: string|null, secure: bool}
 */
function throughProxies(string $remoteAddr, array $headers = []): array
{
    $server = ['REMOTE_ADDR' => $remoteAddr];
    foreach ($headers as $name => $value) {
        $server['HTTP_'.strtoupper(str_replace('-', '_', $name))] = $value;
    }

    $request = Request::create('http://example.test/', 'GET', [], [], [], $server);

    return app(TrustProxies::class)->handle($request, fn (Request $r) => [
        'ip' => $r->ip(),
        'secure' => $r->isSecure(),
    ]);
}

afterEach(function () {
    // The trusted list is static on the Symfony request; do not leak it.
    Request::setTrustedProxies([], Request::HEADER_X_FORWARDED_FOR);
});

it('uses the forwarded client address when the request comes from a private-network proxy', function () {
    // e.g. the Docker nginx container, or a TLS proxy on the same host
    $seen = throughProxies('172.18.0.5', [
        'X-Forwarded-For' => '203.0.113.9',
        'X-Forwarded-Proto' => 'https',
    ]);

    expect($seen['ip'])->toBe('203.0.113.9')
        ->and($seen['secure'])->toBeTrue();
});

it('ignores forwarding headers sent straight from the internet', function () {
    // Otherwise anyone could pick their own IP and walk around rate limits.
    $seen = throughProxies('198.51.100.20', ['X-Forwarded-For' => '203.0.113.9']);

    expect($seen['ip'])->toBe('198.51.100.20');
});

it('honours an explicit TRUSTED_PROXIES list', function () {
    config(['app.trusted_proxies' => '198.51.100.20']);

    expect(throughProxies('198.51.100.20', ['X-Forwarded-For' => '203.0.113.9'])['ip'])->toBe('203.0.113.9')
        ->and(throughProxies('172.18.0.5', ['X-Forwarded-For' => '203.0.113.9'])['ip'])->toBe('172.18.0.5');
});
