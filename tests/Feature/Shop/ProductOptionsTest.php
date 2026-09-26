<?php

use App\Models\Post;
use Illuminate\Support\Facades\Mail;
use Illuminate\Testing\TestResponse;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Services\CartService;
use Plugins\ModuloShop\src\Services\PaymentService;
use Plugins\ModuloShop\src\Support\ProductData;

beforeEach(function () {
    bootShopPlugin($this);
    Mail::fake();
});

function variantProduct(): Post
{
    return createShopProduct([
        'price' => 20,
        'variants' => ProductData::prepareVariants([
            ['name' => 'Red / S', 'sku' => 'TEE-R-S', 'stock' => 3],
            ['name' => 'Red / L', 'price' => 25, 'stock' => 1],
            ['name' => 'Blue / L'],
        ]),
    ]);
}

function buy(): TestResponse
{
    return test()->postJson('/shop/checkout', [
        'customer_name' => 'Jane', 'customer_email' => 'jane@example.com', 'billing_address_1' => '1 St',
        'billing_city' => 'Town', 'billing_postcode' => '1', 'billing_country' => 'US', 'payment_method' => 'cod',
    ]);
}

it('prices a sale only while it runs', function () {
    $meta = ['price' => 20, 'sale_price' => 15];

    expect(ProductData::unitPrice($meta))->toBe(15.0)
        ->and(ProductData::unitPrice([...$meta, 'sale_starts_at' => now()->addDay()->toDateString()]))->toBe(20.0)
        ->and(ProductData::unitPrice([...$meta, 'sale_ends_at' => now()->subDay()->toDateString()]))->toBe(20.0)
        // an end date runs through that whole day
        ->and(ProductData::unitPrice([...$meta, 'sale_ends_at' => now()->toDateString()]))->toBe(15.0)
        ->and(ProductData::unitPrice(['price' => 20, 'sale_price' => 25]))->toBe(20.0);
});

it('makes customers choose an option and prices each option', function () {
    $product = variantProduct();

    $this->postJson('/shop/cart/add', ['product_id' => $product->id])->assertStatus(400)->assertJsonPath('message', 'Please choose an option first');
    $this->postJson('/shop/cart/add', ['product_id' => $product->id, 'variant_id' => 'green'])->assertStatus(400);

    $this->postJson('/shop/cart/add', ['product_id' => $product->id, 'variant_id' => 'red-s', 'quantity' => 2])->assertOk();
    $this->postJson('/shop/cart/add', ['product_id' => $product->id, 'variant_id' => 'red-l'])->assertOk();

    $cart = app(CartService::class)->getCartWithProducts();
    expect(collect($cart['items'])->pluck('price', 'variant_id')->all())->toBe(['red-s' => 20.0, 'red-l' => 25.0])
        ->and($cart['subtotal'])->toBe(65.0)
        ->and(collect($cart['items'])->firstWhere('variant_id', 'red-s')['sku'])->toBe('TEE-R-S');

    // Only one Red / L exists
    $this->postJson('/shop/cart/add', ['product_id' => $product->id, 'variant_id' => 'red-l'])->assertStatus(400);
});

it('takes stock per option and gives it back on cancellation', function () {
    $product = variantProduct();
    app(CartService::class)->addItem($product->id, 2, 'red-s');
    app(CartService::class)->addItem($product->id, 1, 'blue-l');

    buy()->assertOk();

    $order = Order::with('items')->firstOrFail();
    $stock = fn () => collect($product->fresh()->meta_data['variants'])->pluck('stock', 'id')->all();

    expect($stock())->toBe(['red-s' => 1, 'red-l' => 1, 'blue-l' => null])
        ->and($order->items->pluck('product_name')->sort()->values()->all())->toBe([$product->title.' — Blue / L', $product->title.' — Red / S']);

    app(PaymentService::class)->cancelUnpaid($order, 'test');
    expect($stock()['red-s'])->toBe(3);
});

it('refuses checkout when an option sold out meanwhile', function () {
    $product = variantProduct();
    app(CartService::class)->addItem($product->id, 1, 'red-l');

    $meta = $product->fresh()->meta_data;
    $meta['variants'][1]['stock'] = 0;
    $product->update(['meta_data' => $meta]);

    buy()->assertStatus(422)->assertJsonValidationErrors('cart');
    expect(Order::count())->toBe(0);
});

it('saves the full product from the admin editor', function () {
    $this->actingAs(makeAdminUserWithPermissions(['view shop products', 'edit shop products']));
    $product = createShopProduct(['price' => 30]);

    $this->putJson(route('dashboard.admin.shop.products.update', $product), [
        'sale_price' => 25, 'sale_starts_at' => '2026-01-01', 'sale_ends_at' => '2099-12-31', 'weight' => 0.4,
        'gallery' => ['/storage/a.jpg', '/storage/b.jpg'],
        'variants' => [['name' => 'Small', 'stock' => 5], ['name' => 'Small', 'price' => 35]],
    ])->assertOk()
        ->assertJsonPath('sale_active', true)
        ->assertJsonPath('variants.1.id', 'small-2');

    $meta = $product->fresh()->meta_data;
    expect($meta['weight'])->toBe(0.4)
        ->and($meta['gallery'])->toBe(['/storage/a.jpg', '/storage/b.jpg'])
        ->and(array_column($meta['variants'], 'id'))->toBe(['small', 'small-2']);

    $this->putJson(route('dashboard.admin.shop.products.update', $product), ['sale_ends_at' => '2026-01-01', 'sale_starts_at' => '2026-02-01'])
        ->assertStatus(422)->assertJsonValidationErrors('sale_ends_at');
});
