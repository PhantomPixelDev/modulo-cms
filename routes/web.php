<?php

use App\Http\Controllers\Api\MenuApiController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FeedController;
use App\Http\Controllers\Frontend\CommentController;
use App\Http\Controllers\Frontend\FrontendRouterController;
use App\Http\Controllers\Frontend\HomeController;
use App\Http\Controllers\Frontend\PostController;
use App\Http\Controllers\Frontend\PreviewController;
use App\Http\Controllers\Frontend\SearchController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

// Health check endpoint for container orchestration (no closure to support route:cache)
Route::get('/health', HealthController::class);

Route::get('/', HomeController::class)->name('home');

// Search route with rate limiting (60 requests per minute per IP)
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/search', SearchController::class)->name('search');
});

// SEO: sitemap, robots.txt and RSS feed
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');
Route::get('/feed', [FeedController::class, 'index'])->name('feed');
Route::get('/robots.txt', RobotsController::class)->name('robots.txt');

// Public API endpoints for menus (place before dynamic catch-all)
Route::prefix('api/menus')->middleware('throttle:api')->group(function () {
    Route::get('slug/{slug}', [MenuApiController::class, 'showBySlug'])->name('api.menus.slug');
    Route::get('location/{location}', [MenuApiController::class, 'showByLocation'])->name('api.menus.location');
});

// Auth/Dashboard/Admin routes must be registered before frontend catch-all routes
Route::middleware(['auth', 'two-factor.admin'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';

// Explicit route for /posts FIRST (before dynamic routes)
Route::get('/posts', [PostController::class, 'index'])->name('posts.index');

// Handle posts with 'posts' prefix (e.g., /posts/getting-started-guide)
Route::get('/posts/{slug}', [PostController::class, 'show'])
    ->where('slug', '[a-zA-Z0-9\-_]+')
    ->name('post.show');

// Drafts through the theme, from a signed link the editor hands out
Route::get('/preview/{postId}', PreviewController::class)
    ->whereNumber('postId')
    ->middleware(['signed', 'throttle:60,1'])
    ->name('content.preview');

Route::post('/posts/{post}/comments', [CommentController::class, 'store'])
    ->middleware('throttle:15,1')
    ->name('posts.comments.store');

// Everything else public (pages, post type archives, taxonomy archives, single
// posts, all of them optionally prefixed with a locale) is resolved at request
// time by FrontendRouterController. Keeping these routes static - instead of
// registering them from the database on every boot - is what makes route:cache
// usable and stops a two-letter page slug from being read as a locale.
$segment = '[a-zA-Z0-9\-_]+';

// Reserved first segments (dashboard, api, shop, ...) are owned by explicit
// routes or by plugins, which may register after this file is loaded.
// Symfony strips ^ and $ from route requirements, so the lookahead has to end
// on a segment boundary itself - otherwise /shop/order/123 passes a "not shop"
// check because "shop" is not at the end of the path.
$reserved = implode('|', array_map('preg_quote', config('routes.reserved_slugs', [])));
$firstSegment = '(?!(?:'.$reserved.')(?:/|$))'.$segment;

Route::middleware('throttle:30,1')->group(function () use ($segment, $firstSegment) {
    Route::get('/{one}', FrontendRouterController::class)
        ->where('one', $firstSegment)
        ->name('frontend.one');

    Route::get('/{one}/{two}', FrontendRouterController::class)
        ->where(['one' => $firstSegment, 'two' => $segment])
        ->name('frontend.two');

    Route::get('/{one}/{two}/{three}', FrontendRouterController::class)
        ->where(['one' => $firstSegment, 'two' => $segment, 'three' => $segment])
        ->name('frontend.three');
});
