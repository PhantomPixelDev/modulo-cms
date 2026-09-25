<?php

use App\Models\Plugin;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Plugins\ModuloShop\src\Mail\OrderPlacedCustomer;
use Plugins\ModuloShop\src\Models\Coupon;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Models\Payment;
use Plugins\ModuloShop\src\Services\CartService;
use Plugins\ModuloShop\src\Services\ModuloShopSettings;
use Plugins\ModuloShop\src\Services\PaymentService;

beforeEach(function () {
    bootShopPlugin($this);
    Mail::fake();
    Http::preventStrayRequests();
    Plugin::query()->updateOrCreate(['slug' => 'modulo-shop'], [
        'name' => 'Modulo Shop', 'version' => '1.2.0',
        'service_provider' => 'Plugins\\ModuloShop\\ModuloShopServiceProvider', 'is_active' => true,
        'settings' => ['currency' => 'EUR'],
    ]);
    app()->forgetInstance(ModuloShopSettings::class);
});

function payWith(string $gateway, array $config): void
{
    app(PaymentService::class)->saveSettings($gateway, true, $config);
    app()->forgetScopedInstances();
}

function cartWith(float $price = 25, int $qty = 2, int $stock = 5)
{
    $product = createShopProduct(['price' => $price, 'stock' => $stock, 'currency' => 'EUR']);
    app(CartService::class)->addItem($product->id, $qty);

    return $product;
}

function checkoutAs(string $method)
{
    return test()->postJson('/shop/checkout', [
        'customer_name' => 'Jane Doe', 'customer_email' => 'jane@example.com', 'billing_address_1' => '1 Main St',
        'billing_city' => 'Springfield', 'billing_postcode' => '12345', 'billing_country' => 'NL', 'payment_method' => $method,
    ]);
}

function stripeSignature(string $payload, string $secret, ?int $time = null): string
{
    $time ??= time();

    return "t={$time},v1=".hash_hmac('sha256', "{$time}.{$payload}", $secret);
}

it('keeps cash on delivery as before: order placed, emails once, no payment page', function () {
    cartWith();

    checkoutAs('cod')->assertOk()->assertJsonPath('success', true);

    $order = Order::firstOrFail();
    expect($order->payment_status)->toBe('pending');
    Mail::assertQueued(OrderPlacedCustomer::class, 1);

    // Sending again is a no-op
    app(PaymentService::class)->sendPlacedEmails($order);
    Mail::assertQueued(OrderPlacedCustomer::class, 1);
});

it('only offers gateways that are switched on and fully configured', function () {
    cartWith();
    app(PaymentService::class)->saveSettings('stripe', true, ['secret_key' => 'sk_test_x']); // no webhook secret
    app()->forgetScopedInstances();

    checkoutAs('stripe')->assertStatus(422)->assertJsonValidationErrors('payment_method');
    checkoutAs('mollie')->assertStatus(422);
});

it('pays with Stripe: hosted page, then a signed webhook marks the order paid exactly once', function () {
    payWith('stripe', ['secret_key' => 'sk_test_123', 'webhook_secret' => 'whsec_abc']);
    $product = cartWith(25, 2);

    Http::fake(['api.stripe.com/v1/checkout/sessions' => Http::response(['id' => 'cs_test_1', 'url' => 'https://checkout.stripe.com/c/pay/cs_test_1'])]);

    checkoutAs('stripe')->assertOk()->assertJsonPath('redirect', 'https://checkout.stripe.com/c/pay/cs_test_1');

    $order = Order::firstOrFail();
    Http::assertSent(fn ($request) => $request['line_items'][0]['price_data']['unit_amount'] === 5000
        && $request['line_items'][0]['price_data']['currency'] === 'eur'
        && $request['metadata']['order_number'] === $order->order_number);
    expect($order->payment_status)->toBe('pending')
        ->and($product->fresh()->meta_data['stock'])->toBe(3) // held while paying
        ->and(app(CartService::class)->getItemCount())->toBe(0);
    Mail::assertNothingQueued(); // not until it is paid

    $event = json_encode(['type' => 'checkout.session.completed', 'data' => ['object' => [
        'id' => 'cs_test_1', 'payment_status' => 'paid', 'amount_total' => 5000, 'currency' => 'eur',
        'payment_intent' => 'pi_1', 'metadata' => ['order_number' => $order->order_number],
    ]]]);

    $this->call('POST', '/shop/payment/stripe/webhook', [], [], [], ['HTTP_STRIPE_SIGNATURE' => 'v1=forged', 'CONTENT_TYPE' => 'application/json'], $event)->assertStatus(400);
    expect($order->fresh()->payment_status)->toBe('pending');

    foreach ([1, 2] as $delivery) {
        $this->call('POST', '/shop/payment/stripe/webhook', [], [], [], [
            'HTTP_STRIPE_SIGNATURE' => stripeSignature($event, 'whsec_abc'), 'CONTENT_TYPE' => 'application/json',
        ], $event)->assertOk();
    }

    $order->refresh();
    expect($order->payment_status)->toBe('paid')
        ->and($order->status)->toBe('processing')
        ->and(Payment::where('order_id', $order->id)->value('data'))->toMatchArray(['payment_intent' => 'pi_1']);
    Mail::assertQueued(OrderPlacedCustomer::class, 1);
});

it('refuses old Stripe signatures and amounts that do not cover the order', function () {
    payWith('stripe', ['secret_key' => 'sk_test_123', 'webhook_secret' => 'whsec_abc']);
    cartWith(25, 2);
    Http::fake(['api.stripe.com/*' => Http::response(['id' => 'cs_2', 'url' => 'https://checkout.stripe.com/x'])]);
    checkoutAs('stripe')->assertOk();
    $order = Order::firstOrFail();

    $event = fn (int $amount) => json_encode(['type' => 'checkout.session.completed', 'data' => ['object' => [
        'id' => 'cs_2', 'payment_status' => 'paid', 'amount_total' => $amount, 'currency' => 'eur', 'metadata' => ['order_number' => $order->order_number],
    ]]]);

    $old = $event(5000);
    $this->call('POST', '/shop/payment/stripe/webhook', [], [], [], ['HTTP_STRIPE_SIGNATURE' => stripeSignature($old, 'whsec_abc', time() - 3600)], $old)->assertStatus(400);

    $short = $event(100);
    $this->call('POST', '/shop/payment/stripe/webhook', [], [], [], ['HTTP_STRIPE_SIGNATURE' => stripeSignature($short, 'whsec_abc')], $short)->assertOk();

    expect($order->fresh()->payment_status)->toBe('pending')
        ->and(Payment::where('provider_ref', 'cs_2')->value('status'))->toBe('failed');
});

it('pays with PayPal: approve on PayPal, captured when the customer returns', function () {
    payWith('paypal', ['mode' => 'sandbox', 'client_id' => 'cid', 'client_secret' => 'secret', 'webhook_id' => 'WH-1']);
    cartWith(25, 2);

    Http::fake([
        'api-m.sandbox.paypal.com/v1/oauth2/token' => Http::response(['access_token' => 'tok', 'expires_in' => 32400]),
        'api-m.sandbox.paypal.com/v2/checkout/orders' => Http::response(['id' => 'PP-ORDER-1', 'links' => [['rel' => 'payer-action', 'href' => 'https://www.sandbox.paypal.com/checkoutnow?token=PP-ORDER-1']]], 201),
        'api-m.sandbox.paypal.com/v2/checkout/orders/PP-ORDER-1/capture' => fn () => Http::response([
            'id' => 'PP-ORDER-1', 'status' => 'COMPLETED',
            'purchase_units' => [['custom_id' => Order::firstOrFail()->order_number, 'payments' => ['captures' => [
                ['id' => 'CAP-1', 'status' => 'COMPLETED', 'amount' => ['value' => '50.00', 'currency_code' => 'EUR']],
            ]]]],
        ], 201),
    ]);

    checkoutAs('paypal')->assertOk()->assertJsonPath('redirect', 'https://www.sandbox.paypal.com/checkoutnow?token=PP-ORDER-1');
    $order = Order::firstOrFail();
    Http::assertSent(fn ($request) => str_ends_with($request->url(), '/v2/checkout/orders') && $request['purchase_units'][0]['amount']['value'] === '50.00');

    $this->get(route('shop.payment.return', ['gateway' => 'paypal', 'orderNumber' => $order->order_number, 'key' => $order->access_token, 'token' => 'PP-ORDER-1']))
        ->assertRedirect($order->confirmationUrl());

    expect($order->fresh()->payment_status)->toBe('paid')
        ->and(Payment::where('provider_ref', 'PP-ORDER-1')->value('data'))->toMatchArray(['capture_id' => 'CAP-1']);
});

it('ignores PayPal webhooks that PayPal does not vouch for', function () {
    payWith('paypal', ['mode' => 'sandbox', 'client_id' => 'cid', 'client_secret' => 'secret', 'webhook_id' => 'WH-1']);
    Http::fake([
        '*/v1/oauth2/token' => Http::response(['access_token' => 'tok']),
        '*/v1/notifications/verify-webhook-signature' => Http::response(['verification_status' => 'FAILURE']),
    ]);

    $this->postJson('/shop/payment/paypal/webhook', ['event_type' => 'PAYMENT.CAPTURE.COMPLETED', 'resource' => []])->assertStatus(400);
});

it('pays with Mollie: the webhook id is looked up at Mollie before anything changes', function () {
    payWith('mollie', ['api_key' => 'test_abc']);
    cartWith(25, 2);

    Http::fake([
        'api.mollie.com/v2/payments' => Http::response(['id' => 'tr_ABC', '_links' => ['checkout' => ['href' => 'https://www.mollie.com/checkout/tr_ABC']]], 201),
        'api.mollie.com/v2/payments/tr_ABC' => fn () => Http::response([
            'id' => 'tr_ABC', 'status' => 'paid', 'amount' => ['value' => '50.00', 'currency' => 'EUR'],
            'amountRefunded' => ['value' => '0.00', 'currency' => 'EUR'],
            'metadata' => ['order_number' => Order::firstOrFail()->order_number],
        ]),
    ]);

    checkoutAs('mollie')->assertOk()->assertJsonPath('redirect', 'https://www.mollie.com/checkout/tr_ABC');
    Http::assertSent(fn ($request) => str_ends_with($request->url(), '/v2/payments') && $request['amount']['value'] === '50.00' && str_contains($request['webhookUrl'], '/shop/payment/mollie/webhook'));

    $this->post('/shop/payment/mollie/webhook', ['id' => 'not-a-mollie-id'])->assertOk();
    expect(Order::firstOrFail()->payment_status)->toBe('pending');

    $this->post('/shop/payment/mollie/webhook', ['id' => 'tr_ABC'])->assertOk();
    expect(Order::firstOrFail()->payment_status)->toBe('paid');
});

it('undoes the order and keeps the cart when the provider refuses to start', function () {
    payWith('mollie', ['api_key' => 'test_abc']);
    $coupon = Coupon::create(['code' => 'TEN', 'type' => 'fixed', 'amount' => 10]);
    $product = cartWith(25, 2, 5);
    $this->postJson('/shop/cart/coupon', ['code' => 'TEN'])->assertOk();

    Http::fake(['api.mollie.com/*' => Http::response(['detail' => 'The amount is lower than the minimum'], 422)]);

    checkoutAs('mollie')->assertStatus(422)->assertJsonPath('success', false)->assertJsonValidationErrors('payment_method');

    $order = Order::firstOrFail();
    expect($order->status)->toBe('cancelled')
        ->and($product->fresh()->meta_data['stock'])->toBe(5)
        ->and($coupon->fresh()->used_count)->toBe(0)
        ->and(app(CartService::class)->getItemCount())->toBe(2);
});

it('cancels online orders nobody paid for and gives the stock back', function () {
    payWith('stripe', ['secret_key' => 'sk_test_123', 'webhook_secret' => 'whsec_abc']);
    $product = cartWith(25, 2, 5);
    Http::fake(['api.stripe.com/*' => Http::response(['id' => 'cs_3', 'url' => 'https://checkout.stripe.com/x'])]);
    checkoutAs('stripe')->assertOk();

    $order = Order::firstOrFail();
    Artisan::call('shop:expire-unpaid', ['--minutes' => 60]);
    expect($order->fresh()->status)->toBe('pending'); // too recent

    $order->forceFill(['created_at' => now()->subHours(3)])->save();
    Artisan::call('shop:expire-unpaid', ['--minutes' => 60]);

    expect($order->fresh()->status)->toBe('cancelled')
        ->and($product->fresh()->meta_data['stock'])->toBe(5)
        ->and(Payment::where('provider_ref', 'cs_3')->value('status'))->toBe('cancelled');
});

it('refunds a Stripe order at Stripe and puts the stock back', function () {
    payWith('stripe', ['secret_key' => 'sk_test_123', 'webhook_secret' => 'whsec_abc']);
    $product = cartWith(25, 2, 5);
    Http::fake([
        'api.stripe.com/v1/checkout/sessions' => Http::response(['id' => 'cs_4', 'url' => 'https://checkout.stripe.com/x']),
        'api.stripe.com/v1/refunds' => Http::response(['id' => 're_1', 'status' => 'succeeded']),
    ]);
    checkoutAs('stripe')->assertOk();
    $order = Order::firstOrFail();
    app(PaymentService::class)->markPaid($order, 'stripe', 'cs_4', 50, 'EUR', ['payment_intent' => 'pi_4']);

    $this->actingAs(makeAdminUserWithPermissions(['manage shop orders']));
    $this->postJson(route('dashboard.admin.shop.orders.refund', $order))->assertOk();

    Http::assertSent(fn ($request) => str_ends_with($request->url(), '/v1/refunds') && $request['payment_intent'] === 'pi_4');
    expect($order->fresh()->payment_status)->toBe('refunded')
        ->and($order->fresh()->status)->toBe('refunded')
        ->and($product->fresh()->meta_data['stock'])->toBe(5);
});

it('never sends saved API keys back to the admin screen', function () {
    $this->actingAs(makeAdminUserWithPermissions(['manage shop settings']));

    $this->putJson(route('dashboard.admin.shop.payments.update', 'stripe'), [
        'enabled' => true, 'values' => ['secret_key' => 'sk_test_SECRET', 'webhook_secret' => 'whsec_SECRET'],
    ])->assertOk();

    // Saving again with empty secret fields keeps them
    $response = $this->putJson(route('dashboard.admin.shop.payments.update', 'stripe'), [
        'enabled' => true, 'values' => ['secret_key' => '', 'title' => 'Card'],
    ])->assertOk();

    expect($response->getContent())->not->toContain('SECRET');
    $stripe = collect($response->json('gateways'))->firstWhere('id', 'stripe');
    expect($stripe['values']['secret_key'])->toBeTrue()
        ->and($stripe['configured'])->toBeTrue()
        ->and(Plugin::where('slug', 'modulo-shop')->first()->toJson())->not->toContain('SECRET');

    $this->actingAs(makeAdminUserWithPermissions(['view shop products']));
    $this->getJson(route('dashboard.admin.shop.payments.index'))->assertForbidden();
});
