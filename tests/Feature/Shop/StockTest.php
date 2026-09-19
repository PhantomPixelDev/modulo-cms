<?php

use Illuminate\Support\Facades\Mail;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Services\CartService;

beforeEach(function () {
    bootShopPlugin($this);
    Mail::fake();
});

function checkoutPayload(array $overrides = []): array
{
    return array_merge([
        'customer_name' => 'Jane Doe',
        'customer_email' => 'jane@example.com',
        'billing_address_1' => '123 Main St',
        'billing_city' => 'Springfield',
        'billing_postcode' => '12345',
        'billing_country' => 'US',
        'payment_method' => 'cod',
        'ship_to_different' => false,
    ], $overrides);
}

it('takes ordered quantities out of stock', function () {
    $product = createShopProduct(['stock' => 5]);
    app(CartService::class)->addItem($product->id, 2);

    $this->postJson('/shop/checkout', checkoutPayload())->assertOk();

    expect($product->fresh()->meta_data['stock'])->toBe(3);
});

it('refuses checkout when stock ran out after adding to the cart', function () {
    $product = createShopProduct(['stock' => 1]);
    app(CartService::class)->addItem($product->id, 1);

    // Someone else bought the last one in the meantime
    $product->update(['meta_data' => array_merge($product->meta_data, ['stock' => 0])]);

    $this->postJson('/shop/checkout', checkoutPayload())
        ->assertUnprocessable()
        ->assertJsonValidationErrors('cart');

    expect(Order::count())->toBe(0)
        ->and($product->fresh()->meta_data['stock'])->toBe(0);
});

it('puts stock back when an order is cancelled', function () {
    $product = createShopProduct(['stock' => 5]);
    app(CartService::class)->addItem($product->id, 2);
    $this->postJson('/shop/checkout', checkoutPayload())->assertOk();
    $order = Order::firstOrFail();

    $admin = makeAdminUserWithPermissions(['manage shop orders']);
    $admin->forceFill(['email_verified_at' => now()])->save();

    $this->actingAs($admin)->put("/dashboard/admin/shop/orders/{$order->id}", ['status' => 'cancelled'])->assertRedirect();
    expect($product->fresh()->meta_data['stock'])->toBe(5);

    // Cancelling again (or refunding a cancelled order) must not add stock twice
    $this->actingAs($admin)->put("/dashboard/admin/shop/orders/{$order->id}", ['status' => 'refunded'])->assertRedirect();
    expect($product->fresh()->meta_data['stock'])->toBe(5);
});

it('does not accept unimplemented payment methods', function () {
    $product = createShopProduct();
    app(CartService::class)->addItem($product->id, 1);

    $this->postJson('/shop/checkout', checkoutPayload(['payment_method' => 'stripe']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('payment_method');
});
