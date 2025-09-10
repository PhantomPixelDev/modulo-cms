<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ThrottleRequestsPerMinute
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  int  $maxAttempts  (1-60)
     * @param  int  $decayMinutes  (in minutes)
     * @return mixed
     */
    public function handle(Request $request, Closure $next, $maxAttempts = 60, $decayMinutes = 1)
    {
        $key = $this->resolveRequestSignature($request);
        
        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            return $this->buildResponse($key, $maxAttempts);
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        return $this->addHeaders(
            $response,
            $maxAttempts,
            $this->calculateRemainingAttempts($key, $maxAttempts)
        );
    }

    /**
     * Resolve request signature.
     */
    protected function resolveRequestSignature($request): string
    {
        return sha1(
            $request->method() .
            '|' . $request->server('SERVER_NAME') .
            '|' . $request->path() .
            '|' . $request->ip()
        );
    }

    /**
     * Create a 'too many attempts' response.
     */
    protected function buildResponse($key, $maxAttempts)
    {
        $response = response()->json([
            'message' => 'Too Many Attempts.',
            'retry_after' => RateLimiter::availableIn($key),
        ], 429);

        return $this->addHeaders(
            $response,
            $maxAttempts,
            $this->calculateRemainingAttempts($key, $maxAttempts),
            true
        );
    }

    /**
     * Add the limit header information to the given response.
     */
    protected function addHeaders($response, $maxAttempts, $remainingAttempts, $isRateLimited = false)
    {
        $response->headers->add([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => $remainingAttempts,
        ]);

        if ($isRateLimited) {
            $response->headers->add([
                'Retry-After' => $response->original['retry_after'],
                'X-RateLimit-Reset' => now()->addSeconds($response->original['retry_after'])->getTimestamp(),
            ]);
        }

        return $response;
    }

    /**
     * Calculate the number of remaining attempts.
     */
    protected function calculateRemainingAttempts($key, $maxAttempts)
    {
        return $maxAttempts - RateLimiter::attempts($key);
    }
}
