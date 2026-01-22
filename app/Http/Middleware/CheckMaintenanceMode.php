<?php

namespace App\Http\Middleware;

use App\Services\SiteSettingsService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckMaintenanceMode
{
    public function __construct(
        protected SiteSettingsService $settings
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->settings->isMaintenanceMode()) {
            // Allow admin access
            if ($request->user() && $request->user()->hasRole(['admin', 'super-admin'])) {
                return $next($request);
            }

            // Allow login/logout routes
            if ($request->is('login') || $request->is('logout') || $request->is('admin*') || $request->is('dashboard*')) {
                return $next($request);
            }

            $message = $this->settings->getMaintenanceMessage();
            
            if ($request->expectsJson()) {
                return response()->json(['message' => $message], 503);
            }

            return response()->view('maintenance', ['message' => $message], 503);
        }

        return $next($request);
    }
}
