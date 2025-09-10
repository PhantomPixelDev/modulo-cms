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
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\SitemapController;
use App\Http\Controllers\Admin\MediaController as AdminMediaController;
use App\Http\Controllers\Admin\MediaFolderController as AdminMediaFolderController;
use Inertia\Inertia;
use App\Models\User;
use Spatie\Permission\Models\Role;

// Align admin theme routes with the dashboard admin naming used elsewhere
Route::middleware(['auth', 'verified'])->prefix('dashboard/admin')->name('dashboard.admin.')->group(function () {
    // Redirect to main dashboard index
    Route::get('/', function () {
        return redirect('/dashboard');
    })->name('index');

    // Debug route to check user data
    Route::get('/debug', function () {
        $user = auth()->user();
        return response()->json([
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->map(function ($role) {
                    return ['id' => $role->id, 'name' => $role->name];
                }),
                'permissions' => $user->getAllPermissions()->map(function ($permission) {
                    return ['id' => $permission->id, 'name' => $permission->name];
                }),
            ] : null,
        ]);
    })->name('debug');

    // Page management
    Route::get('/pages', [PagesController::class, 'index'])
        ->middleware('permission:view pages')
        ->name('pages.index');
    Route::get('/pages/create', [PagesController::class, 'create'])
        ->middleware('permission:create pages')
        ->name('pages.create');
    Route::post('/pages', [PagesController::class, 'store'])
        ->middleware('permission:create pages')
        ->name('pages.store');
    Route::get('/pages/{page}/edit', [PagesController::class, 'edit'])
        ->middleware('permission:edit pages')
        ->name('pages.edit');
    Route::put('/pages/{page}', [PagesController::class, 'update'])
        ->middleware('permission:edit pages')
        ->name('pages.update');
    Route::delete('/pages/{page}', [PagesController::class, 'destroy'])
        ->middleware('permission:delete pages')
        ->name('pages.destroy');

    // User management
    Route::get('/users', [UserController::class, 'index'])
        ->middleware('permission:view users')
        ->name('users.index');
    Route::get('/users/create', [UserController::class, 'create'])
        ->middleware('permission:create users')
        ->name('users.create');
    Route::post('/users', [UserController::class, 'store'])
        ->middleware('permission:create users')
        ->name('users.store');
    Route::get('/users/{user}/edit', [UserController::class, 'edit'])
        ->middleware('permission:edit users')
        ->name('users.edit');
    Route::put('/users/{user}', [UserController::class, 'update'])
        ->middleware('permission:edit users')
        ->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])
        ->middleware('permission:delete users')
        ->name('users.destroy');

    // Role management
    Route::get('/roles', [RoleController::class, 'index'])
        ->middleware('permission:view roles')
        ->name('roles.index');
    Route::get('/roles/create', [RoleController::class, 'create'])
        ->middleware('permission:create roles')
        ->name('roles.create');
    Route::post('/roles', [RoleController::class, 'store'])
        ->middleware('permission:create roles')
        ->name('roles.store');
    Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])
        ->middleware('permission:edit roles')
        ->name('roles.edit');
    Route::put('/roles/{role}', [RoleController::class, 'update'])
        ->middleware('permission:edit roles')
        ->name('roles.update');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])
        ->middleware('permission:delete roles')
        ->name('roles.destroy');

    // Template management (granular permissions)
    Route::get('/templates', [TemplateController::class, 'index'])
        ->middleware('permission:view templates')
        ->name('templates.index');
    Route::get('/templates/create', [TemplateController::class, 'create'])
        ->middleware('permission:create templates')
        ->name('templates.create');
    Route::post('/templates', [TemplateController::class, 'store'])
        ->middleware('permission:create templates')
        ->name('templates.store');
    Route::get('/templates/{template}', [TemplateController::class, 'show'])
        ->middleware('permission:view templates')
        ->name('templates.show');
    Route::get('/templates/{template}/edit', [TemplateController::class, 'edit'])
        ->middleware('permission:edit templates')
        ->name('templates.edit');
    Route::put('/templates/{template}', [TemplateController::class, 'update'])
        ->middleware('permission:edit templates')
        ->name('templates.update');
    Route::delete('/templates/{template}', [TemplateController::class, 'destroy'])
        ->middleware('permission:delete templates')
        ->name('templates.destroy');

    // Theme management (only implemented actions + granular permissions)
    Route::get('/themes', [ThemeController::class, 'index'])
        ->middleware('permission:view themes')
        ->name('themes.index');
    Route::get('/themes/{theme}', [ThemeController::class, 'show'])
        ->middleware('permission:view themes')
        ->name('themes.show');
    Route::put('/themes/{theme}', [ThemeController::class, 'update'])
        ->middleware('permission:edit themes')
        ->name('themes.update');
    Route::delete('/themes/{theme}', [ThemeController::class, 'destroy'])
        ->middleware('permission:delete themes')
        ->name('themes.destroy');
    Route::post('themes/discover', [ThemeController::class, 'discoverAll'])
        ->middleware('permission:install themes')
        ->name('themes.discover');
    Route::post('themes/{slug}/activate', [ThemeController::class, 'activate'])
        ->middleware('permission:activate themes')
        ->name('themes.activate');
    // Install discovered theme by slug in request body; no URL param required
    Route::post('themes/install', [ThemeController::class, 'install'])
        ->middleware('permission:install themes')
        ->name('themes.install');
    Route::post('themes/{theme}/publish-assets', [ThemeController::class, 'publishAssets'])
        ->middleware('permission:publish theme assets')
        ->name('themes.publish-assets');
    Route::get('themes/{theme}/customizer', [ThemeController::class, 'customizer'])
        ->middleware('permission:customize themes')
        ->name('themes.customizer');

    // Content Management - Posts
    Route::get('/posts', [PostController::class, 'index'])->middleware('permission:view posts')->name('posts.index');
    Route::get('/posts/create', [PostController::class, 'create'])->middleware('permission:create posts')->name('posts.create');
    Route::post('/posts', [PostController::class, 'store'])->middleware('permission:create posts')->name('posts.store');
    Route::get('/posts/{post}', [PostController::class, 'show'])->middleware('permission:view posts')->name('posts.show');
    Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->middleware('permission:edit posts')->name('posts.edit');
    Route::put('/posts/{post}', [PostController::class, 'update'])->middleware('permission:edit posts')->name('posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])->middleware('permission:delete posts')->name('posts.destroy');

    // Content Management - Pages (separate from Posts)
    Route::get('/pages', [PagesController::class, 'index'])->middleware('permission:view posts')->name('pages.index');
    Route::get('/pages/create', [PagesController::class, 'create'])->middleware('permission:create posts')->name('pages.create');
    Route::post('/pages', [PagesController::class, 'store'])->middleware('permission:create posts')->name('pages.store');
    Route::get('/pages/{page}/edit', [PagesController::class, 'edit'])->middleware('permission:edit posts')->name('pages.edit');
    Route::put('/pages/{page}', [PagesController::class, 'update'])->middleware('permission:edit posts')->name('pages.update');
    Route::delete('/pages/{page}', [PagesController::class, 'destroy'])->middleware('permission:delete posts')->name('pages.destroy');

    // Content Management - Post Types
    Route::get('/post-types', [PostTypeController::class, 'index'])->middleware('permission:view post types')->name('post-types.index');
    Route::get('/post-types/create', [PostTypeController::class, 'create'])->middleware('permission:create post types')->name('post-types.create');
    Route::post('/post-types', [PostTypeController::class, 'store'])->middleware('permission:create post types')->name('post-types.store');
    Route::get('/post-types/{postType}', [PostTypeController::class, 'show'])->middleware('permission:view post types')->name('post-types.show');
    Route::get('/post-types/{postType}/edit', [PostTypeController::class, 'edit'])->middleware('permission:edit post types')->name('post-types.edit');
    Route::put('/post-types/{postType}', [PostTypeController::class, 'update'])->middleware('permission:edit post types')->name('post-types.update');
    Route::delete('/post-types/{postType}', [PostTypeController::class, 'destroy'])->middleware('permission:delete post types')->name('post-types.destroy');

    // Content Management - Taxonomies
    Route::get('/taxonomies', [TaxonomyController::class, 'index'])->middleware('permission:view taxonomies')->name('taxonomies.index');
    Route::get('/taxonomies/create', [TaxonomyController::class, 'create'])->middleware('permission:create taxonomies')->name('taxonomies.create');
    Route::post('/taxonomies', [TaxonomyController::class, 'store'])->middleware('permission:create taxonomies')->name('taxonomies.store');
    Route::get('/taxonomies/{taxonomy}', [TaxonomyController::class, 'show'])->middleware('permission:view taxonomies')->name('taxonomies.show');
    Route::get('/taxonomies/{taxonomy}/edit', [TaxonomyController::class, 'edit'])->middleware('permission:edit taxonomies')->name('taxonomies.edit');
    Route::put('/taxonomies/{taxonomy}', [TaxonomyController::class, 'update'])->middleware('permission:edit taxonomies')->name('taxonomies.update');
    Route::delete('/taxonomies/{taxonomy}', [TaxonomyController::class, 'destroy'])->middleware('permission:delete taxonomies')->name('taxonomies.destroy');

    // Content Management - Taxonomy Terms
    Route::get('/taxonomy-terms', [TaxonomyTermController::class, 'index'])->middleware('permission:view taxonomy terms')->name('taxonomy-terms.index');
    Route::get('/taxonomy-terms/create', [TaxonomyTermController::class, 'create'])->middleware('permission:create taxonomy terms')->name('taxonomy-terms.create');
    Route::post('/taxonomy-terms', [TaxonomyTermController::class, 'store'])->middleware('permission:create taxonomy terms')->name('taxonomy-terms.store');
    Route::get('/taxonomy-terms/{taxonomyTerm}', [TaxonomyTermController::class, 'show'])->middleware('permission:view taxonomy terms')->name('taxonomy-terms.show');
    Route::get('/taxonomy-terms/{taxonomyTerm}/edit', [TaxonomyTermController::class, 'edit'])->middleware('permission:edit taxonomy terms')->name('taxonomy-terms.edit');
    Route::put('/taxonomy-terms/{taxonomyTerm}', [TaxonomyTermController::class, 'update'])->middleware('permission:edit taxonomy terms')->name('taxonomy-terms.update');
    Route::delete('/taxonomy-terms/{taxonomyTerm}', [TaxonomyTermController::class, 'destroy'])->middleware('permission:delete taxonomy terms')->name('taxonomy-terms.destroy');

    // Menus
    Route::get('/menus', [MenuController::class, 'index'])->middleware('permission:view menus')->name('menus.index');
    Route::post('/menus', [MenuController::class, 'store'])->middleware('permission:create menus')->name('menus.store');
    Route::get('/menus/{menu}', [MenuController::class, 'show'])->middleware('permission:view menus')->name('menus.show');
    Route::put('/menus/{menu}', [MenuController::class, 'update'])->middleware('permission:edit menus')->name('menus.update');
    Route::delete('/menus/{menu}', [MenuController::class, 'destroy'])->middleware('permission:delete menus')->name('menus.destroy');

    // Menu Items (no standalone index page; managed inline via Menus show)
    Route::post('/menu-items', [MenuItemController::class, 'store'])->middleware('permission:create menu items')->name('menu-items.store');
    Route::put('/menu-items/{menuItem}', [MenuItemController::class, 'update'])->middleware('permission:edit menu items')->name('menu-items.update');
    Route::delete('/menu-items/{menuItem}', [MenuItemController::class, 'destroy'])->middleware('permission:delete menu items')->name('menu-items.destroy');

    // Sitemap management
    Route::get('/sitemap', [SitemapController::class, 'index'])
        ->middleware('permission:view settings')
        ->name('sitemap.index');
    Route::put('/sitemap', [SitemapController::class, 'update'])
        ->middleware('permission:edit settings')
        ->name('sitemap.update');
    Route::post('/sitemap/regenerate', [SitemapController::class, 'regenerate'])
        ->middleware('permission:edit settings')
        ->name('sitemap.regenerate');

    // Media library
    Route::get('/media', [AdminMediaController::class, 'index'])
        ->middleware('permission:view media')
        ->name('media.index');
    Route::post('/media', [AdminMediaController::class, 'store'])
        ->middleware('permission:upload media')
        ->name('media.store');
    Route::put('/media/{id}', [AdminMediaController::class, 'update'])
        ->middleware('permission:edit media')
        ->name('media.update');
    Route::delete('/media/{id}', [AdminMediaController::class, 'destroy'])
        ->middleware('permission:delete media')
        ->name('media.destroy');
    Route::post('/media/{id?}/regenerate', [AdminMediaController::class, 'regenerate'])
        ->middleware('permission:edit media')
        ->name('media.regenerate');
    Route::post('/media/bulk', [AdminMediaController::class, 'bulk'])
        ->middleware('permission:edit media|delete media')
        ->name('media.bulk');

    // Media folders
    Route::post('/media/folders', [AdminMediaFolderController::class, 'store'])
        ->middleware('permission:upload media')
        ->name('media.folders.store');
    Route::put('/media/folders/{bucket}', [AdminMediaFolderController::class, 'update'])
        ->middleware('permission:edit media')
        ->name('media.folders.update');
    Route::delete('/media/folders/{bucket}', [AdminMediaFolderController::class, 'destroy'])
        ->middleware('permission:delete media')
        ->name('media.folders.destroy');
});