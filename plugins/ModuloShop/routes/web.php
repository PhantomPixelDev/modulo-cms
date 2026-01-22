<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| ModuloShop Routes
|--------------------------------------------------------------------------
*/

// Public shop routes
Route::prefix('shop')->group(function () {
    Route::get('/', [\Plugins\ModuloShop\src\Http\Controllers\ShopController::class, 'index'])
        ->name('shop.index');

    // Cart routes
    Route::get('/cart', [\Plugins\ModuloShop\src\Http\Controllers\CartController::class, 'index'])
        ->name('shop.cart');
    Route::post('/cart/add', [\Plugins\ModuloShop\src\Http\Controllers\CartController::class, 'add'])
        ->name('shop.cart.add');
    Route::post('/cart/update', [\Plugins\ModuloShop\src\Http\Controllers\CartController::class, 'update'])
        ->name('shop.cart.update');
    Route::post('/cart/remove', [\Plugins\ModuloShop\src\Http\Controllers\CartController::class, 'remove'])
        ->name('shop.cart.remove');
    Route::post('/cart/clear', [\Plugins\ModuloShop\src\Http\Controllers\CartController::class, 'clear'])
        ->name('shop.cart.clear');
    Route::get('/cart/count', [\Plugins\ModuloShop\src\Http\Controllers\CartController::class, 'count'])
        ->name('shop.cart.count');
    Route::get('/cart/mini', [\Plugins\ModuloShop\src\Http\Controllers\CartController::class, 'mini'])
        ->name('shop.cart.mini');

    // Checkout routes
    Route::get('/checkout', [\Plugins\ModuloShop\src\Http\Controllers\CheckoutController::class, 'index'])
        ->name('shop.checkout');
    Route::post('/checkout', [\Plugins\ModuloShop\src\Http\Controllers\CheckoutController::class, 'store'])
        ->name('shop.checkout.store');
    Route::get('/order/{orderNumber}', [\Plugins\ModuloShop\src\Http\Controllers\CheckoutController::class, 'confirmation'])
        ->name('shop.order.confirmation');

    // Product single page (must be last due to catch-all slug)
    Route::get('/{slug}', [\Plugins\ModuloShop\src\Http\Controllers\ShopController::class, 'show'])
        ->where('slug', '[a-zA-Z0-9\-_]+')
        ->name('shop.show');
});

// Product category archive
Route::get('/product-category/{slug}', [\Plugins\ModuloShop\src\Http\Controllers\ShopController::class, 'category'])
    ->where('slug', '[a-zA-Z0-9\-_]+')
    ->name('shop.category');

// Admin shop routes
Route::middleware(['auth', 'verified', 'role_or_permission:super-admin|admin|access admin'])
    ->prefix('dashboard/admin/shop')
    ->name('dashboard.admin.shop.')
    ->group(function () {
        // Products management (uses Post model)
        Route::get('/products', [\Plugins\ModuloShop\src\Http\Controllers\Admin\ProductController::class, 'index'])
            ->middleware('permission:view shop products')
            ->name('products.index');
        Route::get('/products/create', [\Plugins\ModuloShop\src\Http\Controllers\Admin\ProductController::class, 'create'])
            ->middleware('permission:create shop products')
            ->name('products.create');
        Route::post('/products', [\Plugins\ModuloShop\src\Http\Controllers\Admin\ProductController::class, 'store'])
            ->middleware('permission:create shop products')
            ->name('products.store');
        Route::get('/products/{post}/edit', [\Plugins\ModuloShop\src\Http\Controllers\Admin\ProductController::class, 'edit'])
            ->middleware('permission:edit shop products')
            ->name('products.edit');
        Route::put('/products/{post}', [\Plugins\ModuloShop\src\Http\Controllers\Admin\ProductController::class, 'update'])
            ->middleware('permission:edit shop products')
            ->name('products.update');
        Route::delete('/products/{post}', [\Plugins\ModuloShop\src\Http\Controllers\Admin\ProductController::class, 'destroy'])
            ->middleware('permission:delete shop products')
            ->name('products.destroy');

        // Orders management
        Route::get('/orders', [\Plugins\ModuloShop\src\Http\Controllers\Admin\OrderController::class, 'index'])
            ->middleware('permission:view shop orders')
            ->name('orders.index');
        Route::get('/orders/{order}', [\Plugins\ModuloShop\src\Http\Controllers\Admin\OrderController::class, 'show'])
            ->middleware('permission:view shop orders')
            ->name('orders.show');
        Route::put('/orders/{order}', [\Plugins\ModuloShop\src\Http\Controllers\Admin\OrderController::class, 'update'])
            ->middleware('permission:manage shop orders')
            ->name('orders.update');
        Route::delete('/orders/{order}', [\Plugins\ModuloShop\src\Http\Controllers\Admin\OrderController::class, 'destroy'])
            ->middleware('permission:manage shop orders')
            ->name('orders.destroy');

        // Shop settings
        Route::get('/settings', [\Plugins\ModuloShop\src\Http\Controllers\Admin\ShopSettingsController::class, 'index'])
            ->middleware('permission:manage shop settings')
            ->name('settings.index');
        Route::put('/settings', [\Plugins\ModuloShop\src\Http\Controllers\Admin\ShopSettingsController::class, 'update'])
            ->middleware('permission:manage shop settings')
            ->name('settings.update');
    });
