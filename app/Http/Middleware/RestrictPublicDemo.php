<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/** Public demo credentials authorize editing, never server administration. */
class RestrictPublicDemo
{
    public static function permissionAllowed(string $permission): bool
    {
        return $permission === 'access admin' || $permission === 'assign posts author'
            || preg_match('/^(view|create|edit|delete|publish|upload|approve|moderate) (posts|pages|content|media|taxonomy terms|menus|menu items|comments|shop products|shop orders|shop coupons)$/', $permission)
            || in_array($permission, ['view themes', 'view plugins', 'view analytics', 'manage shop orders', 'manage shop coupons'], true);
    }

    public function handle(Request $request, Closure $next): Response
    {
        if (! config('demo.enabled')) {
            return $next($request);
        }

        // Laravel matches routes after URL decoding. Apply exactly the same
        // canonicalization so encoded administrative paths cannot bypass us.
        $path = trim(rawurldecode($request->getPathInfo()), '/');
        $is = fn (array $patterns): bool => Str::is($patterns, $path);
        $sensitive = preg_match('#^dashboard/admin/(users|roles|system/(backups|email)|shop/payments)(/|$)#', $path)
            || $is(['settings/api-tokens', 'settings/api-tokens/*']);

        // Fail closed for new plugin write endpoints. Read-only screens remain
        // available, while the existing editing routes are explicitly allowed.
        $allowedWrite = preg_match('#^dashboard/admin/(posts|pages|media|editor-drafts|content|trash|taxonomy-terms|menus|menu-items|partials)(/|$)#', $path)
            || preg_match('#^dashboard/admin/shop/(products|coupons|orders)(/|$)#', $path)
            || $is(['dashboard/admin/onboarding/dismiss', 'api/v1/posts', 'api/v1/posts/*']);
        $forbiddenWrite = ! $request->isMethodSafe()
            && (($is(['dashboard/*']) && ! $allowedWrite)
                || $is(['settings/profile', 'settings/password', 'settings/two-factor', 'settings/two-factor/*'])
                || $is(['dashboard/admin/shop/orders/*/refund']));

        abort_if($sensitive || $forbiddenWrite, 403, 'Server administration is disabled on the public demo.');

        return $next($request);
    }
}
