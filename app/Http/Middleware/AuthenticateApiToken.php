<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bearer-token authentication for /api/v1.
 *
 * `api.token` requires a valid token; `api.token:optional` accepts requests
 * without one (public reads) but still rejects a token that is wrong, so a
 * client with a broken token finds out instead of silently seeing less.
 */
class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next, string $mode = 'required'): Response
    {
        $plain = $request->bearerToken();

        if ($plain === null || $plain === '') {
            return $mode === 'optional'
                ? $next($request)
                : $this->unauthorized('An API token is required (Authorization: Bearer <token>).');
        }

        $token = ApiToken::findByPlainText($plain);

        if ($token === null || $token->user === null) {
            return $this->unauthorized('The API token is invalid or has expired.');
        }

        // Once a minute is enough to show "last used" without a write per request.
        if ($token->last_used_at === null || $token->last_used_at->lt(now()->subMinute())) {
            $token->forceFill(['last_used_at' => now()])->saveQuietly();
        }

        Auth::setUser($token->user);
        $request->setUserResolver(fn () => $token->user);
        $request->attributes->set('api_token', $token);

        return $next($request);
    }

    protected function unauthorized(string $message): Response
    {
        return response()->json(['message' => $message], 401, ['WWW-Authenticate' => 'Bearer']);
    }
}
