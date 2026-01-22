<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use App\Models\Post;
use App\Models\PostType;
use Plugins\ModuloShop\ModuloShopServiceProvider;
use Plugins\ModuloShop\src\Mail\OrderCompletedCustomer;
use Plugins\ModuloShop\src\Mail\OrderPlacedAdmin;
use Plugins\ModuloShop\src\Mail\OrderPlacedCustomer;
use Plugins\ModuloShop\src\Mail\OrderShippedCustomer;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Models\OrderItem;
use Plugins\ModuloShop\src\Services\CartService;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->app->register(ModuloShopServiceProvider::class);
    
    // Run shop plugin migrations
    $this->artisan('migrate', [
        '--path' => 'plugins/ModuloShop/database/migrations',
        '--realpath' => false,
    ]);
    
    config(['mail.admin_address' => 'admin@example.com']);
});

function createShopProduct(): Post
{
    $postType = PostType::factory()->create([
        'name' => 'product',
        'slug' => 'product',
        'route_prefix' => 'shop',
    ]);

    return Post::factory()->published()->create([
        'post_type_id' => $postType->id,
        'meta_data' => [
            'price' => 29.99,
            'currency' => 'USD',
            'sku' => 'SKU-TEST',
        ],
    ]);
}

test('checkout sends order placed emails', function () {
    Mail::fake();

    $product = createShopProduct();
    app(CartService::class)->addItem($product->id, 1);

    $payload = [
        'customer_name' => 'Jane Doe',
        'customer_email' => 'jane@example.com',
        'billing_address_1' => '123 Main St',
        'billing_city' => 'Springfield',
        'billing_postcode' => '12345',
        'billing_country' => 'US',
        'payment_method' => 'cod',
        'ship_to_different' => false,
    ];

    $response = $this->post('/shop/checkout', $payload);

    $response->assertRedirect();

    Mail::assertSent(OrderPlacedCustomer::class, function ($mail) use ($payload) {
        return $mail->hasTo($payload['customer_email']);
    });

    Mail::assertSent(OrderPlacedAdmin::class, function ($mail) {
        return $mail->hasTo('admin@example.com');
    });
});

test('order status updates send shipped and completed emails', function () {
    Mail::fake();

    $order = Order::create([
        'order_number' => 'ORD-TEST-0001',
        'status' => Order::STATUS_PENDING,
        'subtotal' => 29.99,
        'discount' => 0,
        'shipping' => 0,
        'tax' => 0,
        'total' => 29.99,
        'currency' => 'USD',
        'customer_email' => 'customer@example.com',
        'customer_name' => 'Customer Name',
        'billing_address_1' => '123 Main St',
        'billing_city' => 'Springfield',
        'billing_postcode' => '12345',
        'billing_country' => 'US',
        'payment_method' => 'cod',
        'payment_status' => Order::PAYMENT_PENDING,
    ]);

    OrderItem::create([
        'order_id' => $order->id,
        'product_name' => 'Test Product',
        'product_sku' => 'SKU-TEST',
        'price' => 29.99,
        'quantity' => 1,
        'subtotal' => 29.99,
    ]);

    $user = makeAdminUserWithPermissions(['manage shop orders']);
    $user->forceFill(['email_verified_at' => now()])->save();

    $this->actingAs($user)
        ->put("/dashboard/admin/shop/orders/{$order->id}", ['status' => 'shipped'])
        ->assertRedirect();

    Mail::assertSent(OrderShippedCustomer::class, function ($mail) {
        return $mail->hasTo('customer@example.com');
    });

    $this->actingAs($user)
        ->put("/dashboard/admin/shop/orders/{$order->id}", ['status' => 'completed'])
        ->assertRedirect();

    Mail::assertSent(OrderCompletedCustomer::class, function ($mail) {
        return $mail->hasTo('customer@example.com');
    });
});
