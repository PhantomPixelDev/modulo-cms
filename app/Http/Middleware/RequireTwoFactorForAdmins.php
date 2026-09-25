<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * With security.require_two_factor_for_admins on, an administrator without
 * two-factor authentication is sent to set it up before using the admin.
 */
class RequireTwoFactorForAdmins
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (config('security.require_two_factor_for_admins')
            && $user !== null
            && $user->hasRole(['admin', 'super-admin'])
            && ! $user->hasTwoFactorEnabled()) {
            return redirect()->route('two-factor.edit')
                ->with('warning', 'Set up two-factor authentication to continue: it is required for administrators on this site.');
        }

        return $next($request);
    }
}
