<?php

use App\Models\Plugin;
use Illuminate\Support\Facades\Mail;
use Plugins\ModuloShop\src\Models\Coupon;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Services\CartService;
use Plugins\ModuloShop\src\Services\ModuloShopSettings;
use Plugins\ModuloShop\src\Services\PriceCalculator;

beforeEach(function () {
    bootShopPlugin($this);
    Mail::fake();
});

/**
 * @param  array<string, mixed>  $settings
 */
function shopSettings(array $settings): void
{
    Plugin::query()->updateOrCreate(['slug' => 'modulo-shop'], [
        'name' => 'Modulo Shop', 'version' => '1.1.0',
        'service_provider' => 'Plugins\\ModuloShop\\ModuloShopServiceProvider', 'is_active' => true,
        'settings' => $settings,
    ]);
    // Settings are memoized per instance
    app()->forgetInstance(ModuloShopSettings::class);
}

function totalsFor(float $subtotal, ?string $method = null, ?Coupon $coupon = null): array
{
    return app(PriceCalculator::class)->calculate($subtotal, $method, $coupon);
}

function orderPayload(array $overrides = []): array
{
    return array_merge([
        'customer_name' => 'Jane Doe', 'customer_email' => 'jane@example.com', 'billing_address_1' => '1 Main St',
        'billing_city' => 'Springfield', 'billing_postcode' => '12345', 'billing_country' => 'US', 'payment_method' => 'cod',
    ], $overrides);
}

it('adds tax on top of goods and shipping', function () {
    shopSettings(['tax_rate' => 10, 'shipping_methods' => [['name' => 'Standard', 'price' => 5]]]);

    $t = totalsFor(100);

    expect($t['shipping'])->toBe(5.0)
        ->and($t['tax'])->toBe(10.5)
        ->and($t['total'])->toBe(115.5)
        ->and($t['shipping_method'])->toBe('standard');
});

it('works out the tax already inside prices that include it', function () {
    shopSettings(['tax_rate' => 21, 'prices_include_tax' => true]);

    $t = totalsFor(121);

    expect($t['tax'])->toBe(21.0)
        ->and($t['total'])->toBe(121.0);
});

it('makes shipping free over the threshold, counted after the discount', function () {
    shopSettings(['shipping_methods' => [['name' => 'Standard', 'price' => 5, 'free_over' => 50]]]);
    $tenOff = Coupon::create(['code' => 'ten', 'type' => 'fixed', 'amount' => 10]);

    expect(totalsFor(55)['shipping'])->toBe(0.0)
        ->and(totalsFor(55, null, $tenOff)['shipping'])->toBe(5.0)
        ->and(totalsFor(55, null, $tenOff)['total'])->toBe(50.0);
});

it('applies percent, fixed and free-shipping coupons', function () {
    shopSettings(['shipping_methods' => [['name' => 'Express', 'price' => 12]]]);

    $percent = Coupon::create(['code' => 'p20', 'type' => 'percent', 'amount' => 20]);
    $fixed = Coupon::create(['code' => 'f500', 'type' => 'fixed', 'amount' => 500]);
    $free = Coupon::create(['code' => 'ship', 'type' => 'free_shipping', 'amount' => 0]);

    expect(totalsFor(50, null, $percent)['discount'])->toBe(10.0)
        ->and(totalsFor(50, null, $fixed)['discount'])->toBe(50.0) // never more than the goods
        ->and(totalsFor(50, null, $fixed)['total'])->toBe(12.0)
        ->and(totalsFor(50, null, $free)['shipping'])->toBe(0.0);
});

it('reads the old comma separated shipping setting as free methods', function () {
    shopSettings(['shipping_methods' => 'Standard, Express']);

    $t = totalsFor(10, 'express');

    expect(array_column($t['shipping_methods'], 'id'))->toBe(['standard', 'express'])
        ->and($t['shipping_method'])->toBe('express')
        ->and($t['shipping'])->toBe(0.0);
});

it('refuses coupons that are expired, used up, inactive or below their minimum', function () {
    shopSettings([]);
    $cart = app(CartService::class);
    $product = createShopProduct(['price' => 20]);
    $cart->addItem($product->id, 1);

    Coupon::create(['code' => 'old', 'type' => 'percent', 'amount' => 10, 'expires_at' => now()->subDay()]);
    Coupon::create(['code' => 'gone', 'type' => 'percent', 'amount' => 10, 'usage_limit' => 1, 'used_count' => 1]);
    Coupon::create(['code' => 'off', 'type' => 'percent', 'amount' => 10, 'is_active' => false]);
    Coupon::create(['code' => 'big', 'type' => 'percent', 'amount' => 10, 'min_subtotal' => 100]);

    foreach (['old', 'gone', 'off', 'big', 'nope'] as $code) {
        $this->postJson('/shop/cart/coupon', ['code' => $code])->assertStatus(422)->assertJson(['success' => false]);
    }

    $this->postJson('/shop/cart/coupon', ['code' => 'big'])->assertJsonPath('message', 'This coupon needs an order of at least 100.00.');
});

it('charges the coupon, shipping and tax on the order and counts the coupon use', function () {
    shopSettings(['tax_rate' => 10, 'shipping_methods' => [['name' => 'Standard', 'price' => 5], ['name' => 'Express', 'price' => 15]]]);
    $coupon = Coupon::create(['code' => 'SAVE10', 'type' => 'percent', 'amount' => 10, 'usage_limit' => 5]);
    $product = createShopProduct(['price' => 50, 'stock' => 10]);
    app(CartService::class)->addItem($product->id, 2);

    // Case-insensitive for customers
    $this->postJson('/shop/cart/coupon', ['code' => 'save10'])->assertOk()->assertJsonPath('totals.discount', 10);

    $this->postJson('/shop/checkout', orderPayload(['shipping_method' => 'express']))->assertOk();

    $order = Order::firstOrFail();
    expect((float) $order->subtotal)->toBe(100.0)
        ->and((float) $order->discount)->toBe(10.0)
        ->and((float) $order->shipping)->toBe(15.0)
        ->and((float) $order->tax)->toBe(10.5)
        ->and((float) $order->total)->toBe(115.5)
        ->and($order->shipping_method)->toBe('Express')
        ->and($order->coupon_code)->toBe('SAVE10')
        ->and($coupon->fresh()->used_count)->toBe(1);
});

it('does not silently drop a coupon that stopped applying before payment', function () {
    shopSettings([]);
    $coupon = Coupon::create(['code' => 'ONCE', 'type' => 'fixed', 'amount' => 5, 'usage_limit' => 1]);
    $product = createShopProduct(['price' => 20]);
    app(CartService::class)->addItem($product->id, 1);
    $this->postJson('/shop/cart/coupon', ['code' => 'ONCE'])->assertOk();

    // Someone else used it up in the meantime
    $coupon->update(['used_count' => 1]);

    $this->postJson('/shop/checkout', orderPayload())->assertStatus(422)->assertJsonValidationErrors('coupon');
    expect(Order::count())->toBe(0);
});

it('lets shop managers manage coupons and nobody else', function () {
    $this->actingAs(makeAdminUserWithPermissions(['manage shop settings']));

    $this->postJson(route('dashboard.admin.shop.coupons.store'), ['code' => 'welcome 5', 'type' => 'fixed', 'amount' => 5])
        ->assertStatus(422)->assertJsonValidationErrors('code');
    $this->postJson(route('dashboard.admin.shop.coupons.store'), ['code' => 'welcome5', 'type' => 'percent', 'amount' => 150])
        ->assertStatus(422)->assertJsonValidationErrors('amount');
    $this->postJson(route('dashboard.admin.shop.coupons.store'), ['code' => 'welcome5', 'type' => 'fixed', 'amount' => 5])
        ->assertCreated()->assertJsonPath('code', 'WELCOME5');

    $this->actingAs(makeAdminUserWithPermissions(['view shop products']));
    $this->postJson(route('dashboard.admin.shop.coupons.store'), ['code' => 'x', 'type' => 'fixed', 'amount' => 5])->assertForbidden();
});
