<?php

namespace App\Http\Middleware;

use App\Services\InstallOwnership;
use App\Services\InstallService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OwnInstallation
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('GET') && $request->routeIs('install.show')) {
            return $next($request);
        }
        $ownership = app(InstallOwnership::class);

        return $ownership->synchronized(function () use ($request, $next, $ownership) {
            // Check again under the lock: another request may have finished.
            abort_if(app(InstallService::class)->isInstalled(), 404);
            abort_unless($request->routeIs('install.claim') || $ownership->claimed($request), 403, 'Claim installation with the setup token first.');

            return $next($request);
        });
    }
}
