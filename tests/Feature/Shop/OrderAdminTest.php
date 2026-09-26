<?php

use Illuminate\Support\Facades\Mail;
use Plugins\ModuloShop\src\Mail\OrderCancelledCustomer;
use Plugins\ModuloShop\src\Mail\OrderNoteCustomer;
use Plugins\ModuloShop\src\Mail\OrderRefundedCustomer;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Models\OrderNote;
use Plugins\ModuloShop\src\Services\CartService;
use Plugins\ModuloShop\src\Services\PaymentService;
use Spatie\Permission\Models\Permission;

beforeEach(function () {
    bootShopPlugin($this);
    Mail::fake();
});

function placedOrder(int $stock = 5, int $qty = 2): array
{
    $product = createShopProduct(['price' => 10, 'stock' => $stock]);
    app(CartService::class)->addItem($product->id, $qty);

    test()->postJson('/shop/checkout', [
        'customer_name' => 'Jane Doe', 'customer_email' => 'jane@example.com', 'billing_address_1' => '1 Main St',
        'billing_city' => 'Springfield', 'billing_postcode' => '12345', 'billing_country' => 'US', 'payment_method' => 'cod',
    ])->assertOk();

    return [Order::firstOrFail(), $product];
}

function orderManager(): void
{
    test()->actingAs(makeAdminUserWithPermissions(['view shop orders', 'manage shop orders']));
}

it('records status changes in the history and emails a cancellation', function () {
    [$order, $product] = placedOrder();
    orderManager();

    $this->putJson(route('dashboard.admin.shop.orders.update', $order), ['status' => 'cancelled'])->assertOk();

    expect($order->fresh()->status)->toBe('cancelled')
        ->and($product->fresh()->meta_data['stock'])->toBe(5)
        ->and(OrderNote::where('order_id', $order->id)->where('type', 'status')->value('message'))->toBe('Status changed from Pending to Cancelled.');
    Mail::assertQueued(OrderCancelledCustomer::class, 1);
});

it('takes the stock again when a cancelled order is reopened, and refuses when it is gone', function () {
    [$order, $product] = placedOrder(5, 2);
    orderManager();
    $this->putJson(route('dashboard.admin.shop.orders.update', $order), ['status' => 'cancelled'])->assertOk();

    $this->putJson(route('dashboard.admin.shop.orders.update', $order), ['status' => 'processing'])->assertOk();
    expect($product->fresh()->meta_data['stock'])->toBe(3);

    $this->putJson(route('dashboard.admin.shop.orders.update', $order), ['status' => 'cancelled'])->assertOk();
    $meta = $product->fresh()->meta_data;
    $product->update(['meta_data' => [...$meta, 'stock' => 1]]); // sold elsewhere meanwhile

    $this->putJson(route('dashboard.admin.shop.orders.update', $order), ['status' => 'processing'])
        ->assertStatus(422)->assertJsonValidationErrors('status');
    expect($order->fresh()->status)->toBe('cancelled')
        ->and($product->fresh()->meta_data['stock'])->toBe(1);
});

it('adds staff notes and emails them to the customer on request', function () {
    [$order] = placedOrder();
    orderManager();

    $this->postJson(route('dashboard.admin.shop.orders.notes.store', $order), ['message' => 'Packed, waiting for the courier.'])->assertCreated();
    $this->postJson(route('dashboard.admin.shop.orders.notes.store', $order), ['message' => 'Your parcel leaves tomorrow.', 'notify_customer' => true])
        ->assertCreated()->assertJsonPath('note.customer_notified', true);

    Mail::assertQueued(OrderNoteCustomer::class, fn ($mail) => $mail->note === 'Your parcel leaves tomorrow.');
    Mail::assertQueued(OrderNoteCustomer::class, 1);

    $this->getJson(route('dashboard.admin.shop.orders.show', $order))
        ->assertOk()
        ->assertJsonCount(2, 'notes')
        ->assertJsonPath('notes.0.type', 'note');
});

it('notes payments and refunds, and tells the customer about the refund', function () {
    [$order, $product] = placedOrder(5, 2);
    app(PaymentService::class)->markPaid($order, 'cod', 'cash-1', 20, 'USD');
    orderManager();

    $this->postJson(route('dashboard.admin.shop.orders.refund', $order))->assertOk();

    expect($order->fresh()->status)->toBe('refunded')
        ->and($product->fresh()->meta_data['stock'])->toBe(5)
        ->and(OrderNote::where('order_id', $order->id)->where('type', 'payment')->pluck('message')->all())
        ->toBe(['Payment of 20.00 USD received via cod (cash-1).', 'Marked as refunded.']);
    Mail::assertQueued(OrderRefundedCustomer::class, 1);
});

it('keeps order management away from people who may only look', function () {
    [$order] = placedOrder();
    Permission::findOrCreate('manage shop orders', 'web');
    $this->actingAs(makeAdminUserWithPermissions(['view shop orders']));

    $this->putJson(route('dashboard.admin.shop.orders.update', $order), ['status' => 'cancelled'])->assertForbidden();
    $this->postJson(route('dashboard.admin.shop.orders.notes.store', $order), ['message' => 'x'])->assertForbidden();
});
