<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/** Protect older plugins which have not adopted the admin.access group yet. */
class EnforceAdminSecurity
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Str::is(['dashboard', 'dashboard/*', 'settings/api-tokens', 'settings/api-tokens/*'], trim(rawurldecode($request->getPathInfo()), '/'))) {
            return app(RequireTwoFactorForAdmins::class)->handle($request, $next);
        }

        return $next($request);
    }
}
