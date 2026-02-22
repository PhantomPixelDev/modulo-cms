<?php

use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Content\TaxonomyController;
use App\Http\Controllers\Content\TaxonomyTermController;
use App\Http\Controllers\Content\TemplateController;
use App\Http\Controllers\Content\ThemeController;
use App\Http\Controllers\Content\PostController;
use App\Http\Controllers\Content\PostTypeController;
use App\Http\Controllers\Content\PagesController;
use App\Http\Controllers\Content\MenuController;
use App\Http\Controllers\Content\MenuItemController;
use App\Http\Controllers\Admin\SitemapController;
use App\Http\Controllers\Admin\PluginController;
use App\Http\Controllers\Admin\SiteSettingsController;
use App\Http\Controllers\Admin\MediaController as AdminMediaController;
use App\Http\Controllers\Admin\MediaFolderController as AdminMediaFolderController;
use App\Http\Controllers\Admin\TranslationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// All admin routes are protected by auth, verified, and admin role check
Route::middleware(['auth', 'verified', 'role_or_permission:super-admin|admin|access admin'])
    ->prefix('dashboard/admin')
    ->name('dashboard.admin.')
    ->group(function () {
        // Dashboard
        Route::get('/', function () {
            return redirect('/dashboard');
        })->name('index');

        // Resource routes with automatic permission checks
        Route::resource('pages', PagesController::class)->except(['show']);
        Route::resource('posts', PostController::class)
            ->scoped(['post' => 'slug']);
        // Specific route for listing posts by post type
        Route::get('posts/type/{postType}', [PostController::class, 'indexByType'])->name('posts.byType');
        // Post translation routes
        Route::post('posts/{post}/translations', [\App\Http\Controllers\Dashboard\Admin\PostController::class, 'storeTranslation'])->name('posts.translations.store');
        Route::delete('posts/{post}/translations/{locale}', [\App\Http\Controllers\Dashboard\Admin\PostController::class, 'destroyTranslation'])->name('posts.translations.destroy');
        Route::resource('post-types', PostTypeController::class);
        Route::resource('menus', MenuController::class);
        Route::resource('menu-items', MenuItemController::class);
        Route::resource('taxonomies', TaxonomyController::class);
        Route::get('taxonomy-terms', [TaxonomyTermController::class, 'index'])->name('taxonomy-terms.index');
        Route::resource('taxonomy-terms', TaxonomyTermController::class)->except(['index']);
        // Specific route for listing taxonomy terms by taxonomy slug
        Route::get('taxonomies/{taxonomy}', [TaxonomyTermController::class, 'indexByTaxonomy'])->name('taxonomy-terms.byTaxonomy');
        Route::resource('templates', TemplateController::class);
        Route::resource('themes', ThemeController::class);

        // Theme-specific routes
        Route::post('/themes/discover', [ThemeController::class, 'discover'])->name('themes.discover');
        Route::post('/themes/clear-cache', [ThemeController::class, 'clearCache'])->name('themes.clear-cache');
        Route::post('/themes/{slug}/activate', [ThemeController::class, 'activate'])->name('themes.activate');
        Route::post('/themes/{theme}/publish-assets', [ThemeController::class, 'publishAssets'])->name('themes.publish-assets');
        
        // Media routes
        Route::prefix('media')->group(function () {
            Route::get('/', [AdminMediaController::class, 'index'])->name('media.index');
            Route::post('/', [AdminMediaController::class, 'store'])->name('media.store');
            Route::match(['put', 'patch'], '/{media}', [AdminMediaController::class, 'update'])->name('media.update');
            Route::delete('/{media}', [AdminMediaController::class, 'destroy'])->name('media.destroy');
            Route::post('/regenerate/{media?}', [AdminMediaController::class, 'regenerate'])->name('media.regenerate');
            Route::post('/bulk', [AdminMediaController::class, 'bulk'])->name('media.bulk');

            // Legacy alias for compatibility
            Route::post('/upload', [AdminMediaController::class, 'store'])->name('media.upload');

            // Media folders
            Route::prefix('folders')->group(function () {
                Route::post('/', [AdminMediaFolderController::class, 'store'])->name('media.folders.store');
                Route::put('/{folder}', [AdminMediaFolderController::class, 'update'])->name('media.folders.update');
                Route::delete('/{folder}', [AdminMediaFolderController::class, 'destroy'])->name('media.folders.destroy');
            });
        });

        // User & Role Management
        Route::resource('users', UserController::class);
        Route::resource('roles', RoleController::class);
        
        // Sitemap
        Route::get('/sitemap', [SitemapController::class, 'index'])->name('sitemap.index');
        Route::put('/sitemap', [SitemapController::class, 'update'])->name('sitemap.update');
        Route::post('/sitemap/regenerate', [SitemapController::class, 'regenerate'])->name('sitemap.regenerate');
        Route::post('/sitemap/generate', [SitemapController::class, 'regenerate'])->name('sitemap.generate');
        
        // Site Settings
        Route::get('/settings', [SiteSettingsController::class, 'index'])->name('settings.index');
        Route::put('/settings/{group}', [SiteSettingsController::class, 'update'])->name('settings.update');
        Route::post('/settings/clear-cache', [SiteSettingsController::class, 'clearCache'])->name('settings.clear-cache');

        // Translations
        Route::get('/translations', [TranslationController::class, 'index'])->name('translations.index');
        Route::post('/translations', [TranslationController::class, 'store'])->name('translations.store');
        Route::post('/translations/clear-cache', [TranslationController::class, 'clearCache'])->name('translations.clear-cache');

        // Plugins
        Route::get('plugins', [PluginController::class, 'index'])->name('plugins.index');
        Route::post('plugins/discover', [PluginController::class, 'discover'])->name('plugins.discover');
        Route::post('plugins/{slug}/activate', [PluginController::class, 'activate'])->name('plugins.activate');
        Route::post('plugins/{slug}/deactivate', [PluginController::class, 'deactivate'])->name('plugins.deactivate');
        Route::get('plugins/{slug}/settings', [PluginController::class, 'settings'])->name('plugins.settings');
        Route::put('plugins/{slug}/settings', [PluginController::class, 'updateSettings'])->name('plugins.update-settings');
        Route::delete('plugins/{slug}', [PluginController::class, 'destroy'])->name('plugins.destroy');
    });