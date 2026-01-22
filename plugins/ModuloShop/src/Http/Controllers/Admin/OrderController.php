<?php

namespace Plugins\ModuloShop\src\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Plugins\ModuloShop\src\Mail\OrderCompletedCustomer;
use Plugins\ModuloShop\src\Mail\OrderShippedCustomer;
use Plugins\ModuloShop\src\Models\Order;

class OrderController
{
    public function index(Request $request): JsonResponse|Response
    {
        $this->authorizeView();

        $query = Order::with('items')
            ->orderByDesc('created_at');

        // Search by order number or customer email
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        // Filter by payment status
        if ($paymentStatus = $request->get('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }

        $orders = $query->paginate(20);

        $orders->through(fn($order) => $this->transformForAdmin($order));

        if ($request->wantsJson()) {
            return response()->json($orders);
        }

        return Inertia::render('Dashboard', [
            'adminSection' => 'shop-orders',
            'shopOrders' => $orders,
            'orderStatuses' => $this->getStatusOptions(),
            'paymentStatuses' => $this->getPaymentStatusOptions(),
        ]);
    }

    public function show(Request $request, Order $order): JsonResponse|Response
    {
        $this->authorizeView();

        $order->load('items', 'user');

        if ($request->wantsJson()) {
            return response()->json($this->transformForAdmin($order, true));
        }

        return Inertia::render('Dashboard', [
            'adminSection' => 'shop-orders-view',
            'shopOrder' => $this->transformForAdmin($order, true),
            'orderStatuses' => $this->getStatusOptions(),
            'paymentStatuses' => $this->getPaymentStatusOptions(),
        ]);
    }

    public function update(Request $request, Order $order): JsonResponse|RedirectResponse
    {
        $this->authorizeManage();

        $validated = $request->validate([
            'status' => 'nullable|string|in:pending,processing,shipped,completed,cancelled,refunded',
            'payment_status' => 'nullable|string|in:pending,paid,failed,refunded',
            'tracking_number' => 'nullable|string|max:255',
            'admin_note' => 'nullable|string|max:2000',
        ]);

        $previousStatus = $order->status;

        // Update status if provided
        if (isset($validated['status'])) {
            $order->status = $validated['status'];
            
            if ($validated['status'] === 'shipped' && !$order->shipped_at) {
                $order->shipped_at = now();
            }

            if ($validated['status'] === 'completed' && !$order->shipped_at) {
                $order->shipped_at = now();
            }
        }

        // Update payment status if provided
        if (isset($validated['payment_status'])) {
            $order->payment_status = $validated['payment_status'];
            
            if ($validated['payment_status'] === 'paid' && !$order->paid_at) {
                $order->paid_at = now();
            }
        }

        // Update tracking number
        if (isset($validated['tracking_number'])) {
            $order->tracking_number = $validated['tracking_number'];
        }

        // Update admin note
        if (isset($validated['admin_note'])) {
            $order->admin_note = $validated['admin_note'];
        }

        $order->save();

        if ($previousStatus !== $order->status) {
            $this->sendStatusEmails($order, $previousStatus);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'order' => $this->transformForAdmin($order),
            ]);
        }

        return back()->with('success', 'Order updated successfully');
    }

    public function destroy(Request $request, Order $order): JsonResponse|RedirectResponse
    {
        $this->authorizeManage();

        // Only allow deletion of cancelled orders
        if (!in_array($order->status, ['cancelled', 'refunded'])) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Only cancelled or refunded orders can be deleted',
                ], 400);
            }
            return back()->withErrors(['error' => 'Only cancelled or refunded orders can be deleted']);
        }

        $order->items()->delete();
        $order->delete();

        if ($request->wantsJson()) {
            return response()->json(['success' => true]);
        }

        return redirect()->route('dashboard.admin.shop.orders.index')
            ->with('success', 'Order deleted successfully');
    }

    protected function transformForAdmin(Order $order, bool $detailed = false): array
    {
        $data = [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'status_label' => $order->getStatusLabel(),
            'payment_status' => $order->payment_status,
            'payment_status_label' => $order->getPaymentStatusLabel(),
            'total' => (float) $order->total,
            'currency' => $order->currency,
            'customer_name' => $order->customer_name,
            'customer_email' => $order->customer_email,
            'item_count' => $order->items->count(),
            'created_at' => $order->created_at->toISOString(),
        ];

        if ($detailed) {
            $data = array_merge($data, [
                'subtotal' => (float) $order->subtotal,
                'discount' => (float) $order->discount,
                'shipping' => (float) $order->shipping,
                'tax' => (float) $order->tax,
                'customer_phone' => $order->customer_phone,
                'billing_address' => [
                    'address_1' => $order->billing_address_1,
                    'address_2' => $order->billing_address_2,
                    'city' => $order->billing_city,
                    'state' => $order->billing_state,
                    'postcode' => $order->billing_postcode,
                    'country' => $order->billing_country,
                ],
                'ship_to_different' => $order->ship_to_different,
                'shipping_address' => $order->getShippingAddress(),
                'payment_method' => $order->payment_method,
                'transaction_id' => $order->transaction_id,
                'paid_at' => $order->paid_at?->toISOString(),
                'shipping_method' => $order->shipping_method,
                'tracking_number' => $order->tracking_number,
                'shipped_at' => $order->shipped_at?->toISOString(),
                'customer_note' => $order->customer_note,
                'admin_note' => $order->admin_note,
                'coupon_code' => $order->coupon_code,
                'user' => $order->user ? [
                    'id' => $order->user->id,
                    'name' => $order->user->name,
                    'email' => $order->user->email,
                ] : null,
                'items' => $order->items->map(fn($item) => [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'product_sku' => $item->product_sku,
                    'price' => (float) $item->price,
                    'quantity' => $item->quantity,
                    'subtotal' => (float) $item->subtotal,
                    'product_data' => $item->product_data,
                ])->toArray(),
                'updated_at' => $order->updated_at->toISOString(),
            ]);
        }

        return $data;
    }

    protected function getStatusOptions(): array
    {
        return [
            ['value' => 'pending', 'label' => 'Pending'],
            ['value' => 'processing', 'label' => 'Processing'],
            ['value' => 'shipped', 'label' => 'Shipped'],
            ['value' => 'completed', 'label' => 'Completed'],
            ['value' => 'cancelled', 'label' => 'Cancelled'],
            ['value' => 'refunded', 'label' => 'Refunded'],
        ];
    }

    protected function getPaymentStatusOptions(): array
    {
        return [
            ['value' => 'pending', 'label' => 'Pending'],
            ['value' => 'paid', 'label' => 'Paid'],
            ['value' => 'failed', 'label' => 'Failed'],
            ['value' => 'refunded', 'label' => 'Refunded'],
        ];
    }

    protected function authorizeView(): void
    {
        if (!auth()->user()?->can('view shop orders')) {
            abort(403, 'Unauthorized');
        }
    }

    protected function authorizeManage(): void
    {
        if (!auth()->user()?->can('manage shop orders')) {
            abort(403, 'Unauthorized');
        }
    }

    protected function sendStatusEmails(Order $order, string $previousStatus): void
    {
        if (!$order->customer_email) {
            return;
        }

        if ($order->status === Order::STATUS_SHIPPED && $previousStatus !== Order::STATUS_SHIPPED) {
            try {
                Mail::to($order->customer_email)->send(new OrderShippedCustomer($order));
            } catch (\Throwable $e) {
                logger()->error('Failed to send order shipped email: ' . $e->getMessage());
            }
        }

        if ($order->status === Order::STATUS_COMPLETED && $previousStatus !== Order::STATUS_COMPLETED) {
            try {
                Mail::to($order->customer_email)->send(new OrderCompletedCustomer($order));
            } catch (\Throwable $e) {
                logger()->error('Failed to send order completed email: ' . $e->getMessage());
            }
        }
    }
}
