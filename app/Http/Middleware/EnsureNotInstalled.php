<?php

namespace App\Http\Middleware;

use App\Services\InstallService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Closes the installer once the site is set up.
 *
 * Returns 404 rather than redirecting, so a finished site does not advertise
 * that an installer ever existed. The wizard creates an administrator without
 * authentication, so it must be unreachable the moment it is no longer needed.
 */
class EnsureNotInstalled
{
    public function __construct(protected InstallService $installer) {}

    public function handle(Request $request, Closure $next): Response
    {
        abort_if($this->installer->isInstalled(), 404);

        return $next($request);
    }
}
