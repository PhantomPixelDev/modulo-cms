<?php

namespace App\Providers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\ServiceProvider;

/**
 * Post type archives used to be registered as routes here, read from the
 * database on every boot. That made route:cache useless (cached routes replace
 * anything a provider registers) and cost several queries per request.
 * FrontendRouterController resolves those URLs at request time instead.
 */
class DynamicRouteServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }

    /**
     * Kept for callers that change post types; the lookups they invalidate now
     * live in the request-time resolver's caches.
     */
    public static function clearRouteCache(): void
    {
        Cache::forget('dynamic_post_type_routes');
        Cache::forget('page_post_type_route');
        Cache::forget('post_types:public');
    }
}
