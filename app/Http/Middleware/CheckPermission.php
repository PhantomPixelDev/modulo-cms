<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission, ...$permissions): Response
    {
        if (!$request->user()) {
            abort(403, 'Unauthorized action.');
        }

        foreach ([$permission, ...$permissions] as $perm) {
            if (!$request->user()->hasPermissionTo($perm)) {
                abort(403, 'Unauthorized action.');
            }
        }

        return $next($request);
    }
} 