<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleOrPermission
{
    /**
     * Handle an incoming request.
     * Supports pipe-delimited abilities like: role_or_permission:super-admin|admin|access admin
     */
    public function handle(Request $request, Closure $next, string $abilities = ''): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403, 'Unauthorized');
        }

        // Split the abilities by pipe and normalize
        $tokens = collect(explode('|', (string) $abilities))
            ->map(fn ($t) => trim($t))
            ->filter()
            ->values();

        if ($tokens->isEmpty()) {
            // No restrictions specified; allow
            return $next($request);
        }

        // Check if user has ANY of the roles OR ANY of the permissions
        $hasRole = method_exists($user, 'hasAnyRole') && $user->hasAnyRole($tokens->all());
        $hasPerm = method_exists($user, 'hasAnyPermission') && $user->hasAnyPermission($tokens->all());

        if ($hasRole || $hasPerm) {
            return $next($request);
        }

        abort(403, 'Forbidden');
    }
}
