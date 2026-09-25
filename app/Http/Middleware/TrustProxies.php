<?php

namespace App\Http\Middleware;

use Illuminate\Http\Middleware\TrustProxies as Middleware;

/**
 * Laravel's proxy trust, with the list read from config at request time.
 *
 * `$middleware->trustProxies(at: ...)` is evaluated while the HTTP kernel is
 * built, before configuration is loaded, so it cannot see config('app.*') --
 * and env() returns nothing once the config is cached. Reading the list here
 * keeps TRUSTED_PROXIES working on every install channel.
 */
class TrustProxies extends Middleware
{
    /**
     * @return array<int, string>|string|null
     */
    protected function proxies()
    {
        $configured = config('app.trusted_proxies');

        if (! is_string($configured) || trim($configured) === '') {
            return parent::proxies();
        }

        $configured = trim($configured);

        if ($configured === '*' || $configured === '**') {
            return $configured;
        }

        return array_values(array_filter(array_map('trim', explode(',', $configured))));
    }
}
