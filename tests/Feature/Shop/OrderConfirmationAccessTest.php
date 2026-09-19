<?php

use Illuminate\Support\Facades\Mail;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Services\CartService;

beforeEach(function () {
    bootShopPlugin($this);
    Mail::fake();
});

function placeGuestOrder(\Tests\TestCase $test): string
{
    $product = createShopProduct();
    app(CartService::class)->addItem($product->id, 1);

    return $test->postJson('/shop/checkout', [
        'customer_name' => 'Jane Doe',
        'customer_email' => 'jane@example.com',
        'billing_address_1' => '123 Main St',
        'billing_city' => 'Springfield',
        'billing_postcode' => '12345',
        'billing_country' => 'US',
        'payment_method' => 'cod',
        'ship_to_different' => false,
    ])->assertOk()->json('redirect');
}

it('lets the guest open the confirmation through the secret link', function () {
    $url = placeGuestOrder($this);

    expect($url)->toContain('key=');

    $this->getJson($url)
        ->assertOk()
        ->assertJsonPath('order.customer_email', 'jane@example.com');
});

it('hides guest orders from anyone without the key', function () {
    placeGuestOrder($this);
    $order = Order::firstOrFail();

    $this->getJson("/shop/order/{$order->order_number}")->assertNotFound();
    $this->getJson("/shop/order/{$order->order_number}?key=wrong")->assertNotFound();
});

it('generates unguessable order numbers and never serializes the token', function () {
    placeGuestOrder($this);
    $order = Order::firstOrFail();

    expect($order->order_number)->toMatch('/^ORD-\d{8}-[A-Z0-9]{8}$/')
        ->and(strlen($order->access_token))->toBe(40)
        ->and($order->toArray())->not->toHaveKey('access_token');
});
