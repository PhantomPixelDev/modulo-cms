<?php

namespace App\Http\Middleware;

use App\Services\InstallService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sends an unconfigured site to the installer.
 *
 * Without this a fresh install answers every URL with an error from deep
 * inside the application, which tells the person nothing about what to do.
 *
 * Runs before the middleware that reads site settings and sidebar data, both
 * of which expect tables that may not exist yet.
 */
class RedirectToInstaller
{
    public function __construct(protected InstallService $installer) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->installer->isInstalled()) {
            return $next($request);
        }

        // The installer itself, and the probes an orchestrator uses to decide
        // whether the container is alive, must stay reachable.
        if ($request->is('install', 'install/*', 'health', 'up', 'build/*', 'storage/*')) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Modulo CMS is not installed yet.',
                'install_url' => url('/install'),
            ], 503);
        }

        return redirect('/install');
    }
}
