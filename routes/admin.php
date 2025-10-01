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
use App\Http\Controllers\Admin\MediaController as AdminMediaController;
use App\Http\Controllers\Admin\MediaFolderController as AdminMediaFolderController;
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
        Route::resource('posts', PostController::class);
        Route::resource('post-types', PostTypeController::class);
        Route::resource('menus', MenuController::class);
        Route::resource('menu-items', MenuItemController::class);
        Route::resource('taxonomies', TaxonomyController::class);
        Route::resource('taxonomy-terms', TaxonomyTermController::class);
        Route::resource('templates', TemplateController::class);
        Route::resource('themes', ThemeController::class);

        // Theme-specific routes
        Route::post('/themes/discover', [ThemeController::class, 'discover'])->name('themes.discover');
        
        // Media routes
        Route::prefix('media')->group(function () {
            Route::get('/', [AdminMediaController::class, 'index'])->name('media.index');
            Route::post('/upload', [AdminMediaController::class, 'upload'])->name('media.upload');
            Route::delete('/{media}', [AdminMediaController::class, 'destroy'])->name('media.destroy');
            
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
        Route::post('/sitemap/generate', [SitemapController::class, 'generate'])->name('sitemap.generate');
        
        // Settings
        Route::get('/settings', function () {
            return Inertia::render('Admin/Settings/Index');
        })->name('settings');
    });