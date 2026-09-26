<?php

use App\Models\Plugin;
use App\Models\Post;
use App\Models\PostType;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Services\CartService;
use Plugins\ModuloShop\src\Services\ModuloShopSettings;

beforeEach(function () {
    bootShopPlugin($this);
    Mail::fake();
});

function orderFor(?User $user, string $email, array $extra = []): Order
{
    return Order::create(array_merge([
        'order_number' => Order::generateOrderNumber(), 'user_id' => $user?->id, 'status' => 'processing',
        'subtotal' => 10, 'total' => 10, 'currency' => 'USD', 'customer_email' => $email, 'customer_name' => 'X',
        'billing_address_1' => '1 Main St', 'billing_city' => 'Springfield', 'billing_postcode' => '12345', 'billing_country' => 'US',
        'payment_method' => 'cod',
    ], $extra));
}

it('shows signed-in customers their own orders only', function () {
    $jane = User::factory()->create(['email' => 'jane@example.com']);
    $mine = orderFor($jane, 'jane@example.com');
    $asGuest = orderFor(null, 'jane@example.com');
    orderFor(User::factory()->create(), 'someone@example.com');
    orderFor(null, 'someone@example.com');

    $this->get('/shop/account')->assertRedirect(route('login'));

    $numbers = $this->actingAs($jane)->getJson('/shop/account')->assertOk()->json('data.*.order_number');

    expect($numbers)->toEqualCanonicalizing([$mine->order_number, $asGuest->order_number]);
});

it('only claims guest orders by email once the email is verified', function () {
    $jane = User::factory()->unverified()->create(['email' => 'jane@example.com']);
    orderFor(null, 'jane@example.com');

    expect($this->actingAs($jane)->getJson('/shop/account')->json('data'))->toBe([]);
});

it('fills the checkout in from the last order', function () {
    $jane = User::factory()->create(['email' => 'jane@example.com']);
    orderFor($jane, 'jane@example.com', ['billing_address_1' => 'Old Road 1']);
    orderFor($jane, 'jane@example.com', ['billing_address_1' => 'New Road 2', 'billing_country' => 'NL', 'customer_phone' => '0612345678']);
    $product = createShopProduct(['price' => 10]);

    $this->actingAs($jane);
    app(CartService::class)->addItem($product->id, 1);

    $this->getJson('/shop/checkout')->assertOk()
        ->assertJsonPath('saved_address.billing_address_1', 'New Road 2')
        ->assertJsonPath('saved_address.billing_country', 'NL')
        ->assertJsonPath('saved_address.customer_phone', '0612345678');
});

it('requires accepting the terms when a terms page is set', function () {
    $pageType = PostType::factory()->create(['name' => 'page', 'slug' => 'page', 'route_prefix' => '/']);
    $terms = Post::factory()->published()->create(['post_type_id' => $pageType->id, 'slug' => 'terms']);
    Plugin::query()->updateOrCreate(['slug' => 'modulo-shop'], [
        'name' => 'Modulo Shop', 'version' => '1.4.0', 'service_provider' => 'Plugins\\ModuloShop\\ModuloShopServiceProvider',
        'is_active' => true, 'settings' => ['terms_page_id' => $terms->id],
    ]);
    app()->forgetInstance(ModuloShopSettings::class);

    $product = createShopProduct(['price' => 10]);
    app(CartService::class)->addItem($product->id, 1);
    $payload = [
        'customer_name' => 'Jane', 'customer_email' => 'jane@example.com', 'billing_address_1' => '1 St',
        'billing_city' => 'Town', 'billing_postcode' => '1', 'billing_country' => 'US', 'payment_method' => 'cod',
    ];

    $this->getJson('/shop/checkout')->assertJsonPath('terms_url', url('/terms'));
    $this->postJson('/shop/checkout', $payload)->assertStatus(422)->assertJsonValidationErrors('accept_terms');
    $this->postJson('/shop/checkout', [...$payload, 'accept_terms' => true])->assertOk();
});
