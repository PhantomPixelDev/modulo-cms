<?php

use App\Http\Controllers\Admin\ActivityController;
use App\Http\Controllers\Admin\BackupController;
use App\Http\Controllers\Admin\CommentController;
use App\Http\Controllers\Admin\LocaleController;
use App\Http\Controllers\Admin\MailSettingsController;
use App\Http\Controllers\Admin\MediaController as AdminMediaController;
use App\Http\Controllers\Admin\MediaFolderController as AdminMediaFolderController;
use App\Http\Controllers\Admin\PluginController;
use App\Http\Controllers\Admin\RedirectController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SitemapController;
use App\Http\Controllers\Admin\SiteSettingsController;
use App\Http\Controllers\Admin\TranslationController;
use App\Http\Controllers\Admin\UpdateCenterController;
use App\Http\Controllers\Admin\UpdateController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Content\AutosaveController;
use App\Http\Controllers\Content\EditorDraftController;
use App\Http\Controllers\Content\MenuController;
use App\Http\Controllers\Content\MenuItemController;
use App\Http\Controllers\Content\PagesController;
use App\Http\Controllers\Content\PostController;
use App\Http\Controllers\Content\PostTranslationController;
use App\Http\Controllers\Content\PostTypeController;
use App\Http\Controllers\Content\RevisionController;
use App\Http\Controllers\Content\TaxonomyController;
use App\Http\Controllers\Content\TaxonomyTermController;
use App\Http\Controllers\Content\TemplateController;
use App\Http\Controllers\Content\ThemeController;
use App\Http\Controllers\Content\ThemePartialController;
use App\Http\Controllers\Content\TrashController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

// All admin routes are protected by auth, verified, and admin role check
Route::middleware('admin.access')
    ->prefix('dashboard/admin')
    ->name('dashboard.admin.')
    ->group(function () {
        // Dashboard (Route::redirect keeps route:cache working; no closure)
        Route::redirect('/', '/dashboard')->name('index');
        Route::post('onboarding/dismiss', [DashboardController::class, 'dismissOnboarding'])->name('onboarding.dismiss');
        Route::get('partials', [ThemePartialController::class, 'index'])->name('partials.index');
        Route::post('partials/preview', [ThemePartialController::class, 'preview'])->middleware('throttle:30,1')->name('partials.preview');
        Route::get('partials/preview/{token}', [ThemePartialController::class, 'showPreview'])->whereUuid('token')->name('partials.preview.show');
        Route::get('editor-drafts', [EditorDraftController::class, 'index'])->name('editor-drafts.index');
        Route::post('editor-drafts', [EditorDraftController::class, 'store'])->name('editor-drafts.store');
        Route::get('editor-drafts/{draft}', [EditorDraftController::class, 'show'])->whereUuid('draft')->name('editor-drafts.show');
        Route::delete('editor-drafts/{draft}', [EditorDraftController::class, 'destroy'])->whereUuid('draft')->name('editor-drafts.destroy');

        // Resource routes with automatic permission checks
        Route::resource('pages', PagesController::class)->except(['show'])->where(['page' => '[0-9]+']);
        // Trash (deleted posts and pages); before the posts resource
        Route::get('trash', [TrashController::class, 'index'])->name('trash.index');
        Route::post('trash/{id}/restore', [TrashController::class, 'restore'])->whereNumber('id')->name('trash.restore');
        Route::delete('trash/{id}', [TrashController::class, 'destroy'])->whereNumber('id')->name('trash.destroy');
        Route::delete('trash', [TrashController::class, 'empty'])->middleware('throttle:6,1')->name('trash.empty');

        // Revisions of a post or page (by id; pages are posts too)
        Route::get('content/{postId}/revisions', [RevisionController::class, 'index'])->whereNumber('postId')->name('revisions.index');
        Route::post('content/{postId}/revisions/{revisionId}/restore', [RevisionController::class, 'restore'])
            ->whereNumber(['postId', 'revisionId'])->name('revisions.restore');
        // The editor's unsaved text, and a preview of it through the theme
        Route::get('content/{postId}/autosave', [AutosaveController::class, 'show'])->whereNumber('postId')->name('autosave.show');
        Route::put('content/{postId}/autosave', [AutosaveController::class, 'store'])->whereNumber('postId')->name('autosave.store');
        Route::delete('content/{postId}/autosave', [AutosaveController::class, 'destroy'])->whereNumber('postId')->name('autosave.destroy');
        Route::post('content/{postId}/preview-link', [AutosaveController::class, 'previewLink'])->whereNumber('postId')->name('preview.link');

        Route::post('posts/bulk', [PostController::class, 'bulk'])->middleware('throttle:6,1')->name('posts.bulk');
        Route::resource('posts', PostController::class);
        // Specific route for listing posts by post type
        Route::get('posts/type/{postType}', [PostController::class, 'indexByType'])->name('posts.byType');
        // Post translation routes
        Route::post('posts/{post}/translations', [PostTranslationController::class, 'store'])->name('posts.translations.store');
        Route::delete('posts/{post}/translations/{locale}', [PostTranslationController::class, 'destroy'])->name('posts.translations.destroy');
        // Pages are posts too, so the generic translation endpoints serve them
        Route::delete('pages/{post}/translations/{locale}', [PostTranslationController::class, 'destroy'])->name('pages.translations.destroy');
        Route::resource('post-types', PostTypeController::class)->where(['post_type' => '[0-9]+']);
        Route::put('menus/{menu}/order', [MenuController::class, 'reorder'])->whereNumber('menu')->name('menus.reorder');
        Route::post('menus/{menu}/pages', [MenuController::class, 'addPages'])->whereNumber('menu')->name('menus.add-pages');
        Route::resource('menus', MenuController::class)->where(['menu' => '[0-9]+']);
        Route::resource('menu-items', MenuItemController::class)->only(['index', 'store', 'update', 'destroy'])->where(['menu_item' => '[0-9]+']);
        Route::resource('taxonomies', TaxonomyController::class)->where(['taxonomy' => '[0-9]+']);
        Route::get('taxonomy-terms', [TaxonomyTermController::class, 'index'])->name('taxonomy-terms.index');
        Route::resource('taxonomy-terms', TaxonomyTermController::class)->except(['index'])->where(['taxonomy_term' => '[0-9]+']);
        // Specific route for listing taxonomy terms by taxonomy slug
        Route::get('taxonomies/{taxonomy}/terms', [TaxonomyTermController::class, 'indexByTaxonomy'])->name('taxonomy-terms.byTaxonomy');
        Route::resource('templates', TemplateController::class)->where(['template' => '[0-9]+']);
        // Before the resource: "registry" would otherwise be taken for a {theme} id.
        Route::get('/themes/registry', [ThemeController::class, 'registry'])->name('themes.registry');
        Route::post('/themes/registry/install', [ThemeController::class, 'installFromRegistry'])->name('themes.registry.install');
        Route::resource('themes', ThemeController::class)->only(['index', 'show', 'update', 'destroy'])->where(['theme' => '[0-9]+']);

        // Theme-specific routes
        // install() existed with no route at all, so the only way to install a
        // theme was the all-or-nothing Discover action.
        Route::post('/themes/install', [ThemeController::class, 'install'])->name('themes.install');
        Route::post('/themes/discover', [ThemeController::class, 'discover'])->name('themes.discover');
        Route::post('/themes/clear-cache', [ThemeController::class, 'clearCache'])->name('themes.clear-cache');
        Route::post('/themes/{slug}/activate', [ThemeController::class, 'activate'])->name('themes.activate');
        Route::post('/themes/{theme}/publish-assets', [ThemeController::class, 'publishAssets'])->whereNumber('theme')->name('themes.publish-assets');

        // Media routes
        Route::prefix('media')->group(function () {
            Route::get('/', [AdminMediaController::class, 'index'])->name('media.index');
            Route::post('/', [AdminMediaController::class, 'store'])->name('media.store');
            Route::match(['put', 'patch'], '/{media}', [AdminMediaController::class, 'update'])->whereNumber('media')->name('media.update');
            Route::delete('/{media}', [AdminMediaController::class, 'destroy'])->whereNumber('media')->name('media.destroy');
            Route::post('/regenerate/{media?}', [AdminMediaController::class, 'regenerate'])->name('media.regenerate');
            Route::post('/bulk', [AdminMediaController::class, 'bulk'])->middleware('throttle:6,1')->name('media.bulk');

            // Legacy alias for compatibility
            Route::post('/upload', [AdminMediaController::class, 'store'])->name('media.upload');

            // Media folders
            Route::prefix('folders')->group(function () {
                Route::post('/', [AdminMediaFolderController::class, 'store'])->name('media.folders.store');
                Route::put('/{folder}', [AdminMediaFolderController::class, 'update'])->whereNumber('folder')->name('media.folders.update');
                Route::delete('/{folder}', [AdminMediaFolderController::class, 'destroy'])->whereNumber('folder')->name('media.folders.destroy');
            });
        });

        // Comment moderation
        Route::get('/comments', [CommentController::class, 'index'])->name('comments.index');
        Route::put('/comments/settings', [CommentController::class, 'updateSettings'])->name('comments.settings');
        Route::patch('/comments/{comment}', [CommentController::class, 'update'])->whereNumber('comment')->name('comments.update');
        Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->whereNumber('comment')->name('comments.destroy');

        // User & Role Management
        Route::resource('users', UserController::class)->except(['show'])->where(['user' => '[0-9]+']);
        Route::resource('roles', RoleController::class)->except(['show'])->where(['role' => '[0-9]+']);
        Route::post('users/{user}/roles/{role}/assign', [UserController::class, 'assign'])->whereNumber(['user', 'role'])->name('users.roles.assign');
        Route::post('users/{user}/roles/{role}/remove', [UserController::class, 'remove'])->whereNumber(['user', 'role'])->name('users.roles.remove');

        // Sitemap
        Route::get('/sitemap', [SitemapController::class, 'index'])->name('sitemap.index');
        Route::put('/sitemap', [SitemapController::class, 'update'])->name('sitemap.update');
        Route::post('/sitemap/regenerate', [SitemapController::class, 'regenerate'])->middleware('throttle:6,1')->name('sitemap.regenerate');
        Route::post('/sitemap/generate', [SitemapController::class, 'regenerate'])->middleware('throttle:6,1')->name('sitemap.generate');

        // Site Settings
        Route::get('/settings', [SiteSettingsController::class, 'index'])->name('settings.index');
        Route::put('/settings/{group}', [SiteSettingsController::class, 'update'])->name('settings.update');
        Route::post('/settings/clear-cache', [SiteSettingsController::class, 'clearCache'])->name('settings.clear-cache');

        // Updates: reports availability, never applies anything
        Route::get('/updates', [UpdateController::class, 'show'])->name('updates.show');
        Route::post('/updates/refresh', [UpdateController::class, 'refresh'])->name('updates.refresh');

        // System: update center and full-site backups
        Route::prefix('system')->name('system.')->group(function () {
            Route::get('/updates', [UpdateCenterController::class, 'index'])->name('updates');
            Route::post('/updates/check', [UpdateCenterController::class, 'check'])->name('updates.check');
            Route::post('/updates/plugins', [UpdateCenterController::class, 'updateAllPlugins'])->name('updates.plugins.all');
            Route::post('/updates/plugins/{slug}', [UpdateCenterController::class, 'updatePlugin'])->name('updates.plugins.update');
            Route::post('/updates/themes/{slug}', [UpdateCenterController::class, 'updateTheme'])->name('updates.themes.update');

            Route::get('/activity', [ActivityController::class, 'index'])->name('activity');

            Route::get('/email', [MailSettingsController::class, 'index'])->name('email');
            Route::put('/email', [MailSettingsController::class, 'update'])->name('email.update');
            Route::post('/email/test', [MailSettingsController::class, 'test'])->middleware('throttle:6,1')->name('email.test');

            Route::get('/redirects', [RedirectController::class, 'index'])->name('redirects');
            Route::post('/redirects', [RedirectController::class, 'store'])->name('redirects.store');
            Route::put('/redirects/{redirect}', [RedirectController::class, 'update'])->whereNumber('redirect')->name('redirects.update');
            Route::delete('/redirects/{redirect}', [RedirectController::class, 'destroy'])->whereNumber('redirect')->name('redirects.destroy');

            Route::get('/backups', [BackupController::class, 'index'])->name('backups');
            Route::post('/backups', [BackupController::class, 'store'])->middleware('throttle:6,1')->name('backups.store');
            Route::post('/backups/upload', [BackupController::class, 'upload'])->middleware(['password.confirm', 'throttle:6,1'])->name('backups.upload');
            Route::post('/backups/{backup}/restore', [BackupController::class, 'restore'])->middleware(['password.confirm', 'throttle:6,1'])->name('backups.restore');
            Route::get('/backups/{backup}', [BackupController::class, 'download'])->middleware('password.confirm')->name('backups.download');
            Route::delete('/backups/{backup}', [BackupController::class, 'destroy'])->name('backups.destroy');
        });

        // Translations
        // Languages content can be written in
        Route::get('/languages', [LocaleController::class, 'index'])->name('languages.index');
        Route::post('/languages', [LocaleController::class, 'store'])->name('languages.store');
        Route::put('/languages/{language}', [LocaleController::class, 'update'])->whereNumber('language')->name('languages.update');
        Route::delete('/languages/{language}', [LocaleController::class, 'destroy'])->whereNumber('language')->name('languages.destroy');

        Route::get('/translations', [TranslationController::class, 'index'])->name('translations.index');
        Route::post('/translations', [TranslationController::class, 'store'])->name('translations.store');
        Route::post('/translations/clear-cache', [TranslationController::class, 'clearCache'])->name('translations.clear-cache');

        // Plugins
        Route::get('plugins', [PluginController::class, 'index'])->name('plugins.index');
        Route::post('plugins/discover', [PluginController::class, 'discover'])->name('plugins.discover');
        Route::get('plugins/registry', [PluginController::class, 'registry'])->name('plugins.registry');
        Route::post('plugins/install', [PluginController::class, 'install'])->middleware(['password.confirm', 'throttle:6,1'])->name('plugins.install');
        Route::post('plugins/{slug}/activate', [PluginController::class, 'activate'])->middleware('throttle:6,1')->name('plugins.activate');
        Route::post('plugins/{slug}/deactivate', [PluginController::class, 'deactivate'])->middleware('throttle:6,1')->name('plugins.deactivate');
        Route::get('plugins/{slug}/settings', [PluginController::class, 'settings'])->name('plugins.settings');
        Route::put('plugins/{slug}/settings', [PluginController::class, 'updateSettings'])->name('plugins.update-settings');
        Route::delete('plugins/{slug}', [PluginController::class, 'destroy'])->middleware('throttle:6,1')->name('plugins.destroy');
    });
