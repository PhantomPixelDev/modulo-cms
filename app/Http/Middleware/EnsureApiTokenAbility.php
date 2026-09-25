<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * `api.ability:write`: the request's token must carry the ability. The user's
 * own permissions are checked separately, by the policies.
 */
class EnsureApiTokenAbility
{
    public function handle(Request $request, Closure $next, string $ability): Response
    {
        $token = $request->attributes->get('api_token');

        if (! $token instanceof ApiToken || ! $token->can($ability)) {
            return response()->json(['message' => "This token does not have the \"{$ability}\" ability."], 403);
        }

        return $next($request);
    }
}
