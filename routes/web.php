<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MenuApiController;
use Inertia\Inertia;

// Health check endpoint for container orchestration (no closure to support route:cache)
Route::get('/health', \App\Http\Controllers\HealthController::class);

Route::get('/', [\App\Http\Controllers\FrontendController::class, 'home'])->name('home');

// Search route with rate limiting (60 requests per minute per IP)
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/search', [\App\Http\Controllers\FrontendController::class, 'search'])->name('search');
});

// SEO: sitemap
Route::get('/sitemap.xml', [\App\Http\Controllers\SitemapController::class, 'index'])->name('sitemap');

// Public routes with rate limiting (30 requests per minute per IP)
Route::middleware('throttle:30,1')->group(function () {
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
});

// Public API endpoints for menus (place before dynamic catch-all)
Route::prefix('api/menus')->middleware('throttle:api')->group(function () {
    Route::get('slug/{slug}', [MenuApiController::class, 'showBySlug'])->name('api.menus.slug');
    Route::get('location/{location}', [MenuApiController::class, 'showByLocation'])->name('api.menus.location');
});

// Explicit route for /posts FIRST (before dynamic routes)
Route::get('/posts', [\App\Http\Controllers\FrontendController::class, 'listPosts'])->name('posts.index');
Route::get('/posts/', [\App\Http\Controllers\FrontendController::class, 'listPosts'])->name('posts.index');

// Dynamic post type routes are now registered in DynamicRouteServiceProvider
// This allows route caching and better performance

// Handle posts with 'posts' prefix (e.g., /posts/getting-started-guide)
Route::get('/posts/{slug}', [\App\Http\Controllers\FrontendController::class, 'showPost'])
    ->where('slug', '[a-zA-Z0-9\-_]+')
    ->name('post.show');

// Dynamic routes for all post types (like /news/some-news)
// This needs to be before the catch-all page route
Route::get('/{postTypeSlug}/{slug}', [\App\Http\Controllers\FrontendController::class, 'showContent'])
    ->where('postTypeSlug', '^(?!dashboard|login|register|password|forgot\-password|reset\-password|verify\-email|email|logout|settings|admin|up|api|sitemap\.xml|health).+$')
    ->where('slug', '[a-zA-Z0-9\-_]+')
    ->name('content.show');

// Handle top-level pages (like /about) - this is now after post types
Route::get('/{slug}', [\App\Http\Controllers\FrontendController::class, 'showContent'])
    ->where('slug', '^(?!dashboard|login|register|password|confirm\-password|forgot\-password|reset\-password|verify\-email|email|logout|settings|admin|posts|pages|infos|up|api|sitemap\.xml|health).+$')
    ->name('page.show');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
});

// (moved API routes above)

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
