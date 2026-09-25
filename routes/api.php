<?php

use App\Http\Controllers\Api\V1\ContentController;
use App\Http\Controllers\Api\V1\SiteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Headless API, v1 (/api/v1)
|--------------------------------------------------------------------------
|
| Reads are public for published content; a bearer token (Settings -> API
| tokens) adds the user's access to unpublished content. Writes need a token
| with the "write" ability, and the user's own permissions. Documented in
| docs/api.md; the OpenAPI description is at /api/v1/openapi.json.
|
*/

Route::prefix('v1')->name('api.v1.')->middleware(['api.token:optional', 'throttle:api-v1'])->group(function () {
    Route::get('openapi.json', fn () => response((string) file_get_contents(resource_path('api/openapi.json')), 200, ['Content-Type' => 'application/json']))->name('openapi');

    Route::get('site', [SiteController::class, 'site'])->name('site');
    Route::get('post-types', [SiteController::class, 'postTypes'])->name('post-types');
    Route::get('taxonomies', [SiteController::class, 'taxonomies'])->name('taxonomies');
    Route::get('taxonomies/{slug}/terms', [SiteController::class, 'terms'])->name('taxonomies.terms');
    Route::get('menus/{location}', [SiteController::class, 'menu'])->name('menus');

    Route::get('posts', [ContentController::class, 'posts'])->name('posts.index');
    Route::get('posts/{slug}', [ContentController::class, 'post'])->name('posts.show');
    Route::get('pages', [ContentController::class, 'pages'])->name('pages.index');
    Route::get('pages/{slug}', [ContentController::class, 'page'])->name('pages.show');

    Route::middleware(['api.token', 'api.ability:write'])->group(function () {
        Route::post('posts', [ContentController::class, 'store'])->name('posts.store');
        Route::patch('posts/{id}', [ContentController::class, 'update'])->whereNumber('id')->name('posts.update');
        Route::delete('posts/{id}', [ContentController::class, 'destroy'])->whereNumber('id')->name('posts.destroy');
    });
});
