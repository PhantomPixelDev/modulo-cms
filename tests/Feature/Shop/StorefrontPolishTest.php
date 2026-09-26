<?php

use App\Models\Plugin;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Services\CartService;
use Plugins\ModuloShop\src\Services\ModuloShopSettings;

beforeEach(function () {
    bootShopPlugin($this);
    Mail::fake();
    Plugin::query()->updateOrCreate(['slug' => 'modulo-shop'], [
        'name' => 'Modulo Shop', 'version' => '1.6.0', 'service_provider' => 'Plugins\\ModuloShop\\ModuloShopServiceProvider',
        'is_active' => true,
        'settings' => [
            'currency' => 'EUR', 'currency_position' => 'after', 'thousand_separator' => '.', 'decimal_separator' => ',', 'decimals' => 2,
            'store_name' => 'Smoke Store', 'invoice_details' => "Smoke BV\nVAT NL123",
        ],
    ]);
    app()->forgetInstance(ModuloShopSettings::class);
});

function paidOrder(): Order
{
    $product = createShopProduct(['price' => 1234.5]);
    app(CartService::class)->addItem($product->id, 1);
    test()->postJson('/shop/checkout', [
        'customer_name' => 'Jane Doe', 'customer_email' => 'jane@example.com', 'billing_address_1' => '1 Main St',
        'billing_city' => 'Springfield', 'billing_postcode' => '12345', 'billing_country' => 'NL', 'payment_method' => 'cod',
    ])->assertOk();

    return Order::firstOrFail();
}

it('prints an invoice for whoever holds the order link, in the store money format', function () {
    $order = paidOrder();

    $this->get(route('shop.order.invoice', ['orderNumber' => $order->order_number]))->assertNotFound();
    $this->get(route('shop.order.invoice', ['orderNumber' => $order->order_number, 'key' => 'wrong']))->assertNotFound();

    $this->get(route('shop.order.invoice', ['orderNumber' => $order->order_number, 'key' => $order->access_token]))
        ->assertOk()
        ->assertSee('Invoice')
        ->assertSee('Smoke Store')
        ->assertSee('VAT NL123')
        ->assertSee('Jane Doe')
        ->assertSee('1.234,50 EUR');
});

it('lets shop staff open any invoice, and nobody else', function () {
    $order = paidOrder();

    $this->actingAs(User::factory()->create());
    $this->get(route('shop.order.invoice', ['orderNumber' => $order->order_number]))->assertNotFound();

    $this->actingAs(makeAdminUserWithPermissions(['view shop orders']));
    $this->get(route('shop.order.invoice', ['orderNumber' => $order->order_number]))->assertOk();
});

it('sends the store money format and prices products in the store currency', function () {
    $product = createShopProduct(['price' => 10, 'currency' => 'USD']);
    app(CartService::class)->addItem($product->id, 1);

    $this->getJson('/shop/cart/mini')->assertOk()
        ->assertJsonPath('money.currency', 'EUR')
        ->assertJsonPath('money.decimal', ',')
        ->assertJsonPath('money.position', 'after');

    $this->getJson('/shop/'.$product->slug)->assertOk()->assertJsonPath('product.currency', 'EUR');
});
