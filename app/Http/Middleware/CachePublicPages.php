<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Whole-page cache for visitors.
 *
 * A public page rendered for a guest is the same for every guest except for
 * two values: the CSRF token and the CSP nonce. Those are stored as
 * placeholders and filled in for each visitor, so forms and inline scripts
 * keep working. Only pages the theme renderer marks cacheable are stored
 * (never cart, checkout, account or order pages), and only when nothing about
 * the request is personal: no user, no flash message, no validation errors.
 *
 * Invalidation is by version, not by guessing which pages a change affects:
 * any database write through a model, and every PostService cache flush,
 * bumps the site version (see bumpVersion()), which is part of every key.
 * A new frontend build changes the key too, so cached pages never point at
 * asset files a deploy removed.
 */
class CachePublicPages
{
    public const CACHEABLE = 'modulo.page_cacheable';

    protected const VERSION_KEY = 'page-cache:version';

    protected const TOKEN = '__MODULO_CSRF_TOKEN__';

    protected const NONCE = '__MODULO_CSP_NONCE__';

    /** First path segments that are never public pages. */
    protected const EXCLUDED = ['dashboard', 'settings', 'api', 'login', 'logout', 'register', 'password', 'forgot-password',
        'reset-password', 'verify-email', 'confirm-password', 'email', 'two-factor', 'install', 'livewire', 'storage', 'build'];

    public static function bumpVersion(): void
    {
        try {
            Cache::forever(self::VERSION_KEY, (int) Cache::get(self::VERSION_KEY, 0) + 1);
        } catch (\Throwable) {
            // No cache store (install, maintenance): nothing cached to invalidate
        }
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->eligible($request)) {
            return $next($request);
        }

        $key = $this->key($request);
        $cached = Cache::get($key);

        if (is_array($cached) && isset($cached['body'])) {
            return response(
                str_replace([self::TOKEN, self::NONCE], [csrf_token(), (string) Vite::cspNonce()], $cached['body']),
                200,
                ['Content-Type' => $cached['type'], 'X-Page-Cache' => 'hit'],
            );
        }

        $response = $next($request);

        if ($this->storable($request, $response)) {
            $body = (string) $response->getContent();
            $nonce = (string) Vite::cspNonce();
            $body = str_replace(csrf_token(), self::TOKEN, $body);
            if ($nonce !== '') {
                $body = str_replace($nonce, self::NONCE, $body);
            }

            Cache::put($key, ['body' => $body, 'type' => $response->headers->get('Content-Type')], (int) config('content.page_cache.ttl', 3600));
            $response->headers->set('X-Page-Cache', 'miss');
        }

        return $response;
    }

    protected function eligible(Request $request): bool
    {
        if (! config('content.page_cache.enabled', true) || ! $request->isMethod('GET') || $request->header('X-Inertia')) {
            return false;
        }

        if ($request->user() !== null || $request->hasSession() && ($request->session()->has('errors') || $request->session()->get('_flash.old', []) !== [])) {
            return false;
        }

        // Pagination only: arbitrary parameters would each fill the cache with a copy
        if (array_diff(array_keys($request->query()), ['page']) !== []) {
            return false;
        }

        return ! in_array((string) $request->segment(1), self::EXCLUDED, true);
    }

    protected function storable(Request $request, Response $response): bool
    {
        return $request->attributes->get(self::CACHEABLE) === true
            && $response->getStatusCode() === 200
            && str_contains((string) $response->headers->get('Content-Type'), 'text/html');
    }

    protected function key(Request $request): string
    {
        return 'page-cache:'.sha1(implode('|', [
            (int) Cache::get(self::VERSION_KEY, 0),
            $this->assetVersion(),
            $request->getSchemeAndHttpHost(),
            $request->getRequestUri(),
        ]));
    }

    protected function assetVersion(): string
    {
        static $version = null;

        if ($version === null) {
            $manifest = public_path('build/manifest.json');
            $version = is_file($manifest) ? (string) md5_file($manifest) : 'dev';
        }

        return $version;
    }
}
