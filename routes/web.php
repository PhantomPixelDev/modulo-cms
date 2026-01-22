<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MenuApiController;
use App\Http\Controllers\Frontend\HomeController;
use App\Http\Controllers\Frontend\PostController;
use App\Http\Controllers\Frontend\TaxonomyController;
use App\Http\Controllers\Frontend\SearchController;
use Inertia\Inertia;
use Illuminate\Http\Request;

// Health check endpoint for container orchestration (no closure to support route:cache)
Route::get('/health', \App\Http\Controllers\HealthController::class);

Route::get('/', HomeController::class)->name('home');

// Search route with rate limiting (60 requests per minute per IP)
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/search', SearchController::class)->name('search');
});

// SEO: sitemap, robots.txt and RSS feed
Route::get('/sitemap.xml', [\App\Http\Controllers\SitemapController::class, 'index'])->name('sitemap');
Route::get('/feed', [\App\Http\Controllers\FeedController::class, 'index'])->name('feed');
Route::get('/robots.txt', function () {
    $content = \App\Models\SiteSetting::get('robots_txt', "User-agent: *\nAllow: /");
    return response($content)->header('Content-Type', 'text/plain');
})->name('robots.txt');

// Public routes with rate limiting (30 requests per minute per IP)
Route::middleware('throttle:30,1')->group(function () {
    $categoryBase = \App\Models\SiteSetting::get('category_base', 'category');
    $tagBase = \App\Models\SiteSetting::get('tag_base', 'tag');

    // Taxonomy archives
    Route::get("/{$tagBase}/{slug}", [TaxonomyController::class, 'show'])
        ->name('tag.show')
        ->defaults('taxonomySlug', 'tags')
        ->where('slug', '[a-zA-Z0-9\-_]+');
    
    // Plural alias for tags if it's different from base
    if ($tagBase !== 'tags') {
        Route::get('/tags/{slug}', [TaxonomyController::class, 'show'])
            ->name('tags.show')
            ->defaults('taxonomySlug', 'tags')
            ->where('slug', '[a-zA-Z0-9\-_]+');
    }

    Route::get("/{$categoryBase}/{slug}", [TaxonomyController::class, 'show'])
        ->name('category.show')
        ->defaults('taxonomySlug', 'categories')
        ->where('slug', '[a-zA-Z0-9\-_]+');
    
    // Plural alias for categories if it's different from base
    if ($categoryBase !== 'categories') {
        Route::get('/categories/{slug}', [TaxonomyController::class, 'show'])
            ->name('categories.show')
            ->defaults('taxonomySlug', 'categories')
            ->where('slug', '[a-zA-Z0-9\-_]+');
    }
});

// Public API endpoints for menus (place before dynamic catch-all)
Route::prefix('api/menus')->middleware('throttle:api')->group(function () {
    Route::get('slug/{slug}', [MenuApiController::class, 'showBySlug'])->name('api.menus.slug');
    Route::get('location/{location}', [MenuApiController::class, 'showByLocation'])->name('api.menus.location');
});

// Auth/Dashboard/Admin routes must be registered before frontend catch-all routes
Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';

// Explicit route for /posts FIRST (before dynamic routes)
Route::get('/posts', [PostController::class, 'index'])->name('posts.index');

// Dynamic post type routes are now registered in DynamicRouteServiceProvider
// This allows route caching and better performance

// Handle posts with 'posts' prefix (e.g., /posts/getting-started-guide)
Route::get('/posts/{slug}', [PostController::class, 'show'])
    ->where('slug', '[a-zA-Z0-9\-_]+')
    ->name('post.show');

// Dynamic routes for all post types (like /news/some-news)
// Reserved slugs are defined in config/routes.php for easy maintenance
$reservedPrefixes = implode('|', array_map('preg_quote', config('routes.reserved_post_type_prefixes', [])));
$reservedSlugs = implode('|', array_map('preg_quote', config('routes.reserved_slugs', [])));

Route::get('/{postTypeSlug}/{slug}', [PostController::class, 'showContent'])
    ->where('postTypeSlug', "^(?!{$reservedPrefixes}).+$")
    ->where('slug', '[a-zA-Z0-9\-_]+')
    ->name('content.show');

// Handle top-level pages (like /about) - this is now after post types
Route::get('/{slug}', [PostController::class, 'showContent'])
    ->where('slug', "^(?!{$reservedSlugs}).+$")
    ->name('page.show');
