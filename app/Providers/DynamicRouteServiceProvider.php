<?php

namespace App\Providers;

use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use App\Http\Controllers\Frontend\PostController;

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
        // Check if tables exist (for fresh installs)
        if (!Schema::hasTable('post_types') || !Schema::hasTable('site_settings')) {
            return;
        }

        try {
            // Only register dynamic routes if tables exist
            if (!Schema::hasTable('site_settings') || !Schema::hasTable('posts')) {
                return;
            }

            // Register posts page route if configured
            $postsPageId = SiteSetting::get('posts_page_id');
            if ($postsPageId) {
                $postsPage = Post::find($postsPageId);
                if ($postsPage && $postsPage->status === 'published') {
                    Route::get("/{$postsPage->slug}", [PostController::class, 'index'])
                        ->name('posts.index.custom');
                }
            }

            // Cache post type routes for 1 hour to improve performance
            $postTypes = cache()->remember('dynamic_post_type_routes', 3600, function () {
                return PostType::whereNotNull('route_prefix')
                    ->where('route_prefix', '!=', '')
                    ->where('route_prefix', '!=', 'posts')
                    ->where('is_public', true)
                    ->get(['id', 'route_prefix']);
            });

            foreach ($postTypes as $postType) {
                Route::get("/{$postType->route_prefix}", [PostController::class, 'index'])
                    ->name("{$postType->route_prefix}.index")
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
                Route::get('/pages', [PostController::class, 'index'])
                    ->name('pages.index')
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
