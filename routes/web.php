<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MenuApiController;
use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;

Route::get('/', [\App\Http\Controllers\FrontendController::class, 'home'])->name('home');

// SEO: sitemap
Route::get('/sitemap.xml', [\App\Http\Controllers\SitemapController::class, 'index'])->name('sitemap');

// Taxonomy archives
Route::get('/tag/{slug}', [\App\Http\Controllers\FrontendController::class, 'listByTaxonomyTerm'])
    ->name('tag.show')
    ->defaults('taxonomySlug', 'tags')
    ->where('slug', '[a-zA-Z0-9\-_]+');
// Plural alias for tags
Route::get('/tags/{slug}', [\App\Http\Controllers\FrontendController::class, 'listByTaxonomyTerm'])
    ->name('tags.show')
    ->defaults('taxonomySlug', 'tags')
    ->where('slug', '[a-zA-Z0-9\-_]+');
Route::get('/category/{slug}', [\App\Http\Controllers\FrontendController::class, 'listByTaxonomyTerm'])
    ->name('category.show')
    ->defaults('taxonomySlug', 'categories')
    ->where('slug', '[a-zA-Z0-9\-_]+');
// Plural alias for categories
Route::get('/categories/{slug}', [\App\Http\Controllers\FrontendController::class, 'listByTaxonomyTerm'])
    ->name('categories.show')
    ->defaults('taxonomySlug', 'categories')
    ->where('slug', '[a-zA-Z0-9\-_]+');

// Public API endpoints for menus (place before dynamic catch-all)
Route::prefix('api/menus')->middleware('throttle:api')->group(function () {
    Route::get('slug/{slug}', [MenuApiController::class, 'showBySlug'])->name('api.menus.slug');
    Route::get('location/{location}', [MenuApiController::class, 'showByLocation'])->name('api.menus.location');
});

// Dynamic routes for all post types
Route::get('/{postTypeSlug}/{slug}', [\App\Http\Controllers\FrontendController::class, 'showContent'])
    ->where('postTypeSlug', '^(?!dashboard|login|register|password|forgot\-password|reset\-password|verify\-email|email|logout|settings|admin|up|api).*$')
    ->where('slug', '[a-zA-Z0-9\-_]+')
    ->name('content.show');

// Register index routes for all post types with route_prefix (guarded for testing/migrations)
if (Schema::hasTable('post_types')) {
    try {
        // Exclude root ('/') route_prefix to avoid conflicting with the home route
        $postTypes = \App\Models\PostType::whereNotNull('route_prefix')
            ->where('route_prefix', '!=', '')
            ->where('route_prefix', '!=', '/')
            ->where('is_public', true)
            ->get();

        foreach ($postTypes as $postType) {
            Route::get("/{$postType->route_prefix}", [\App\Http\Controllers\FrontendController::class, 'listPosts'])
                ->name("{$postType->route_prefix}.index")
                ->defaults('postTypeId', $postType->id);
        }
    } catch (\Throwable $e) {
        // During early app boot or tests before migrations, skip dynamic route registration
    }
}

// Explicit archive route for generic posts listing (independent of DB post_types)
Route::get('/posts', [\App\Http\Controllers\FrontendController::class, 'listPosts'])
    ->name('posts.index');

// Fallback for pages without a route_prefix (like the home page)
if (Schema::hasTable('post_types')) {
    try {
        $pageType = \App\Models\PostType::where(function($q){
                $q->whereNull('route_prefix')
                  ->orWhere('route_prefix','')
                  ->orWhere('route_prefix','/');
            })
            ->where('is_public', true)
            ->first();
        if ($pageType) {
            Route::get('/pages', [\App\Http\Controllers\FrontendController::class, 'listPosts'])
                ->name('pages.index')
                ->defaults('postTypeId', $pageType->id);
        }
    } catch (\Throwable $e) {
        // Skip when migrations not yet run
    }
}
Route::get('/{slug}', [\App\Http\Controllers\FrontendController::class, 'showContent'])
    ->where('slug', '^(?!dashboard|login|register|password|confirm\-password|forgot\-password|reset\-password|verify\-email|email|logout|settings|admin|posts|pages|up|api)[a-zA-Z0-9\-_]+$')
    ->name('page.show');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
});

// (moved API routes above)

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
