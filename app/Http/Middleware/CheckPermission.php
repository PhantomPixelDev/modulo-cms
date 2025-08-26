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

        // Each middleware parameter is an AND group.
        // Within each parameter, support pipe-delimited OR, e.g. 'edit media|delete media'.
        $groups = array_merge([$permission], $permissions);

        foreach ($groups as $group) {
            $alternatives = array_filter(array_map('trim', explode('|', (string) $group)));
            if (empty($alternatives)) {
                // No concrete permission provided; deny.
                abort(403, 'Unauthorized action.');
            }

            $hasAny = false;
            foreach ($alternatives as $alt) {
                if ($request->user()->hasPermissionTo($alt)) {
                    $hasAny = true;
                    break;
                }
            }

            if (!$hasAny) {
                abort(403, 'Unauthorized action.');
            }
        }

        return $next($request);
    }
} 