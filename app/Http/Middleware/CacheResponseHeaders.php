<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CacheResponseHeaders
{
    /**
     * Cache duration in seconds for different content types
     */
    protected const CACHE_DURATIONS = [
        'static' => 86400,      // 1 day for static assets
        'page' => 3600,         // 1 hour for pages
        'api' => 300,           // 5 minutes for API responses
        'private' => 0,         // No cache for private content
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $type = 'page'): Response
    {
        $response = $next($request);

        // Skip caching for authenticated users or non-GET requests
        if ($request->user() || !$request->isMethod('GET')) {
            return $this->setNoCacheHeaders($response);
        }

        // Skip caching for admin routes
        if ($request->is('admin/*') || $request->is('api/*')) {
            return $this->setNoCacheHeaders($response);
        }

        $duration = self::CACHE_DURATIONS[$type] ?? self::CACHE_DURATIONS['page'];

        if ($duration > 0) {
            $this->setCacheHeaders($response, $duration);
        } else {
            $this->setNoCacheHeaders($response);
        }

        return $response;
    }

    /**
     * Set cache headers for cacheable responses
     */
    protected function setCacheHeaders(Response $response, int $duration): void
    {
        $response->headers->set('Cache-Control', "public, max-age={$duration}, s-maxage={$duration}");
        $response->headers->set('Vary', 'Accept-Encoding, Cookie');
        
        // Generate ETag based on content
        $etag = md5($response->getContent());
        $response->headers->set('ETag', "\"{$etag}\"");
        
        // Set Last-Modified to current time if not already set
        if (!$response->headers->has('Last-Modified')) {
            $response->headers->set('Last-Modified', gmdate('D, d M Y H:i:s') . ' GMT');
        }
    }

    /**
     * Set no-cache headers for private content
     */
    protected function setNoCacheHeaders(Response $response): Response
    {
        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');
        
        return $response;
    }
}
