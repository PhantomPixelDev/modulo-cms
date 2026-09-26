<?php

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;
use Plugins\ModuloShop\src\Http\Controllers\AccountController;
use Plugins\ModuloShop\src\Http\Controllers\Admin\CouponController;
use Plugins\ModuloShop\src\Http\Controllers\Admin\OrderController;
use Plugins\ModuloShop\src\Http\Controllers\Admin\PaymentSettingsController;
use Plugins\ModuloShop\src\Http\Controllers\Admin\ProductController;
use Plugins\ModuloShop\src\Http\Controllers\Admin\ShopSettingsController;
use Plugins\ModuloShop\src\Http\Controllers\CartController;
use Plugins\ModuloShop\src\Http\Controllers\CheckoutController;
use Plugins\ModuloShop\src\Http\Controllers\PaymentController;
use Plugins\ModuloShop\src\Http\Controllers\ShopController;

/*
|--------------------------------------------------------------------------
| ModuloShop Routes
|--------------------------------------------------------------------------
*/

// Public shop routes
Route::prefix('shop')->group(function () {
    Route::get('/', [ShopController::class, 'index'])
        ->name('shop.index');

    // Cart routes
    Route::get('/cart', [CartController::class, 'index'])
        ->name('shop.cart');
    Route::post('/cart/add', [CartController::class, 'add'])
        ->middleware('throttle:60,1')
        ->name('shop.cart.add');
    Route::post('/cart/update', [CartController::class, 'update'])
        ->middleware('throttle:60,1')
        ->name('shop.cart.update');
    Route::post('/cart/remove', [CartController::class, 'remove'])
        ->middleware('throttle:60,1')
        ->name('shop.cart.remove');
    Route::post('/cart/clear', [CartController::class, 'clear'])
        ->middleware('throttle:60,1')
        ->name('shop.cart.clear');
    // Tight limit: a coupon code is a guessable secret
    Route::post('/cart/coupon', [CartController::class, 'applyCoupon'])
        ->middleware('throttle:10,1')
        ->name('shop.cart.coupon');
    Route::delete('/cart/coupon', [CartController::class, 'removeCoupon'])
        ->middleware('throttle:60,1')
        ->name('shop.cart.coupon.remove');
    Route::post('/cart/shipping', [CartController::class, 'shipping'])
        ->middleware('throttle:60,1')
        ->name('shop.cart.shipping');
    Route::get('/cart/count', [CartController::class, 'count'])
        ->name('shop.cart.count');
    Route::get('/cart/mini', [CartController::class, 'mini'])
        ->name('shop.cart.mini');

    // Checkout routes
    Route::get('/checkout', [CheckoutController::class, 'index'])
        ->name('shop.checkout');
    Route::post('/checkout', [CheckoutController::class, 'store'])
        ->middleware('throttle:10,1')
        ->name('shop.checkout.store');
    Route::get('/order/{orderNumber}', [CheckoutController::class, 'confirmation'])
        ->middleware('throttle:30,1')
        ->name('shop.order.confirmation');
    Route::post('/order/{orderNumber}/pay', [PaymentController::class, 'pay'])
        ->middleware('throttle:10,1')
        ->name('shop.order.pay');

    // The signed-in customer's orders (before the product catch-all below)
    Route::get('/account', [AccountController::class, 'orders'])
        ->middleware('auth')
        ->name('shop.account');

    // Online payments: back from the provider's page, and its server notifications
    Route::get('/payment/{gateway}/return/{orderNumber}', [PaymentController::class, 'return'])
        ->middleware('throttle:30,1')
        ->name('shop.payment.return');
    Route::get('/payment/{gateway}/cancel/{orderNumber}', [PaymentController::class, 'cancel'])
        ->middleware('throttle:30,1')
        ->name('shop.payment.cancel');
    // Called by the provider, not the browser: no CSRF token; each gateway verifies the sender
    Route::post('/payment/{gateway}/webhook', [PaymentController::class, 'webhook'])
        ->withoutMiddleware([ValidateCsrfToken::class])
        ->middleware('throttle:120,1')
        ->name('shop.payment.webhook');

    // Product single page (must be last due to catch-all slug)
    Route::get('/{slug}', [ShopController::class, 'show'])
        ->where('slug', '[a-zA-Z0-9\-_]+')
        ->name('shop.show');
});

// Product category archive
Route::get('/product-category/{slug}', [ShopController::class, 'category'])
    ->where('slug', '[a-zA-Z0-9\-_]+')
    ->name('shop.category');

// Admin shop routes
Route::middleware(['auth', 'verified', 'role_or_permission:super-admin|admin|access admin'])
    ->prefix('dashboard/admin/shop')
    ->name('dashboard.admin.shop.')
    ->group(function () {
        // Products management (uses Post model)
        Route::get('/products', [ProductController::class, 'index'])
            ->middleware('permission:view shop products')
            ->name('products.index');
        Route::get('/products/create', [ProductController::class, 'create'])
            ->middleware('permission:create shop products')
            ->name('products.create');
        Route::post('/products', [ProductController::class, 'store'])
            ->middleware('permission:create shop products')
            ->name('products.store');
        Route::get('/products/{post}/edit', [ProductController::class, 'edit'])
            ->middleware('permission:edit shop products')
            ->name('products.edit');
        Route::put('/products/{post}', [ProductController::class, 'update'])
            ->middleware('permission:edit shop products')
            ->name('products.update');
        Route::delete('/products/{post}', [ProductController::class, 'destroy'])
            ->middleware('permission:delete shop products')
            ->name('products.destroy');

        // Orders management
        Route::get('/orders', [OrderController::class, 'index'])
            ->middleware('permission:view shop orders')
            ->name('orders.index');
        Route::get('/orders/{order}', [OrderController::class, 'show'])
            ->middleware('permission:view shop orders')
            ->name('orders.show');
        Route::put('/orders/{order}', [OrderController::class, 'update'])
            ->middleware('permission:manage shop orders')
            ->name('orders.update');
        Route::delete('/orders/{order}', [OrderController::class, 'destroy'])
            ->middleware('permission:manage shop orders')
            ->name('orders.destroy');

        // Shop settings
        Route::get('/payments', [PaymentSettingsController::class, 'index'])
            ->name('payments.index');
        Route::put('/payments/{gateway}', [PaymentSettingsController::class, 'update'])
            ->name('payments.update');
        Route::post('/orders/{order}/refund', [OrderController::class, 'refund'])
            ->name('orders.refund');
        Route::post('/orders/{order}/notes', [OrderController::class, 'addNote'])
            ->name('orders.notes.store');

        Route::get('/coupons', [CouponController::class, 'index'])
            ->name('coupons.index');
        Route::post('/coupons', [CouponController::class, 'store'])
            ->name('coupons.store');
        Route::put('/coupons/{coupon}', [CouponController::class, 'update'])
            ->name('coupons.update');
        Route::delete('/coupons/{coupon}', [CouponController::class, 'destroy'])
            ->name('coupons.destroy');

        Route::get('/settings', [ShopSettingsController::class, 'index'])
            ->middleware('permission:manage shop settings')
            ->name('settings.index');
        Route::put('/settings', [ShopSettingsController::class, 'update'])
            ->middleware('permission:manage shop settings')
            ->name('settings.update');
    });
