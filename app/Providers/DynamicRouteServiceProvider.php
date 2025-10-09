<?php

namespace App\Providers;

use App\Models\PostType;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class DynamicRouteServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Register dynamic routes for both web requests and console commands
        $this->registerDynamicPostTypeRoutes();
    }

    /**
     * Register dynamic routes for post types
     */
    protected function registerDynamicPostTypeRoutes(): void
    {
        // Check if post_types table exists (for fresh installs)
        if (!Schema::hasTable('post_types')) {
            return;
        }

        try {
            // Cache post type routes for 1 hour to improve performance
            $postTypes = cache()->remember('dynamic_post_type_routes', 3600, function () {
                return PostType::whereNotNull('route_prefix')
                    ->where('route_prefix', '!=', '')
                    ->where('route_prefix', '!=', 'posts')
                    ->where('is_public', true)
                    ->get(['id', 'route_prefix']);
            });

            foreach ($postTypes as $postType) {
                // Register route without trailing slash
                Route::get("/{$postType->route_prefix}", [\App\Http\Controllers\FrontendController::class, 'listPosts'])
                    ->name("{$postType->route_prefix}.index")
                    ->defaults('postTypeId', $postType->id);
                
                // Register route with trailing slash
                Route::get("/{$postType->route_prefix}/", [\App\Http\Controllers\FrontendController::class, 'listPosts'])
                    ->defaults('postTypeId', $postType->id);
            }

            // Handle pages index
            $pageType = cache()->remember('page_post_type_route', 3600, function () {
                return PostType::where(function($q) {
                        $q->whereNull('route_prefix')
                          ->orWhere('route_prefix', '')
                          ->orWhere('route_prefix', '/');
                    })
                    ->where('is_public', true)
                    ->first(['id']);
            });

            if ($pageType) {
                Route::get('/pages', [\App\Http\Controllers\FrontendController::class, 'listPosts'])
                    ->name('pages.index')
                    ->defaults('postTypeId', $pageType->id);
                Route::get('/pages/', [\App\Http\Controllers\FrontendController::class, 'listPosts'])
                    ->defaults('postTypeId', $pageType->id);
            }
        } catch (\Throwable $e) {
            // Skip during early app boot or if database connection fails
            \Log::warning('Failed to register dynamic routes: ' . $e->getMessage());
        }
    }

    /**
     * Clear the route cache when post types are updated
     * Call this method after creating/updating/deleting post types
     */
    public static function clearRouteCache(): void
    {
        cache()->forget('dynamic_post_type_routes');
        cache()->forget('page_post_type_route');
    }
}
