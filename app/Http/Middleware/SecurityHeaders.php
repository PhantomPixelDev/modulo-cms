<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security headers on every web response, including a nonce-based
 * Content-Security-Policy.
 *
 * The nonce is created before the response is rendered (Vite::useCspNonce),
 * so Vite's tags and the layout's inline scripts carry it.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $mode = (string) config('security.csp');
        $csp = config('security.headers') && in_array($mode, ['report', 'enforce'], true) && ! Vite::isRunningHot();

        if ($csp) {
            Vite::useCspNonce();
        }

        $response = $next($request);

        if (! config('security.headers')) {
            return $response;
        }

        $headers = $response->headers;
        $headers->set('X-Content-Type-Options', 'nosniff', false);
        $headers->set('X-Frame-Options', 'SAMEORIGIN', false);
        $headers->set('Referrer-Policy', 'strict-origin-when-cross-origin', false);
        $headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()', false);
        $headers->set('Cross-Origin-Opener-Policy', 'same-origin', false);

        $hsts = (int) config('security.hsts_max_age');
        if ($hsts > 0 && $request->isSecure()) {
            $headers->set('Strict-Transport-Security', "max-age={$hsts}; includeSubDomains", false);
        }

        // Only HTML documents need a policy; JSON, files and redirects do not.
        if ($csp && str_contains((string) $headers->get('Content-Type'), 'text/html')) {
            $name = $mode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
            $headers->set($name, $this->policy(Vite::cspNonce()));
        }

        return $response;
    }

    protected function policy(?string $nonce): string
    {
        $analytics = 'https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com';

        $directives = [
            'default-src' => "'self'",
            // strict-dynamic: scripts the nonce'd ones load (Vite chunks,
            // plugin bundles, GTM) are trusted too.
            'script-src' => "'self' 'nonce-{$nonce}' 'strict-dynamic' {$analytics}",
            // Inline style attributes come from server-rendered React markup.
            'style-src' => "'self' 'unsafe-inline' https://fonts.bunny.net",
            'font-src' => "'self' data: https://fonts.bunny.net",
            'img-src' => "'self' data: blob: https:",
            'media-src' => "'self' blob: https:",
            'connect-src' => "'self' {$analytics}",
            'frame-src' => "'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
            'frame-ancestors' => "'self'",
            'form-action' => "'self'",
            'base-uri' => "'self'",
            'object-src' => "'none'",
        ];

        foreach ((array) config('security.csp_extra') as $directive => $sources) {
            $sources = trim((string) $sources);
            if ($sources !== '' && isset($directives[$directive]) && preg_match('/^[\w\s:\/\.\*\-\'\+=]+$/', $sources) === 1) {
                $directives[$directive] .= ' '.$sources;
            }
        }

        return implode('; ', array_map(fn ($name, $value) => "{$name} {$value}", array_keys($directives), $directives));
    }
}
