<?php

namespace Plugins\ModuloShop\src\Http\Controllers\Admin;

use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Plugins\ModuloShop\src\Mail\OrderCancelledCustomer;
use Plugins\ModuloShop\src\Mail\OrderCompletedCustomer;
use Plugins\ModuloShop\src\Mail\OrderNoteCustomer;
use Plugins\ModuloShop\src\Mail\OrderShippedCustomer;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Models\OrderNote;
use Plugins\ModuloShop\src\Models\Payment;
use Plugins\ModuloShop\src\Payments\PaymentException;
use Plugins\ModuloShop\src\Services\PaymentService;
use Plugins\ModuloShop\src\Services\StockService;

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

        $orders->through(fn ($order) => $this->transformForAdmin($order));

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

        $order->load('items', 'user', 'notes.user');

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

        $closed = [Order::STATUS_CANCELLED, Order::STATUS_REFUNDED];
        $previousStatus = $order->status;
        $previousPayment = $order->payment_status;
        $previousTracking = $order->tracking_number;

        if (isset($validated['status'])) {
            $order->status = $validated['status'];

            if (in_array($validated['status'], [Order::STATUS_SHIPPED, Order::STATUS_COMPLETED], true) && ! $order->shipped_at) {
                $order->shipped_at = now();
            }
        }

        if (isset($validated['payment_status'])) {
            $order->payment_status = $validated['payment_status'];

            if ($validated['payment_status'] === Order::PAYMENT_PAID && ! $order->paid_at) {
                $order->paid_at = now();
            }
        }

        if (array_key_exists('tracking_number', $validated)) {
            $order->tracking_number = $validated['tracking_number'];
        }

        // Legacy single note; new notes go through addNote()
        if (isset($validated['admin_note'])) {
            $order->admin_note = $validated['admin_note'];
        }

        $releasesStock = in_array($order->status, $closed, true) && ! in_array($previousStatus, $closed, true);
        // Reopening a cancelled order must take its items out of stock again
        $reservesStock = in_array($previousStatus, $closed, true) && ! in_array($order->status, $closed, true);
        $userId = $request->user()?->id;

        try {
            DB::transaction(function () use ($order, $releasesStock, $reservesStock, $previousStatus, $previousPayment, $previousTracking, $userId) {
                if ($reservesStock) {
                    app(StockService::class)->reserve($order->quantities());
                }

                $order->save();

                if ($releasesStock) {
                    app(StockService::class)->release($order);
                }

                if ($previousStatus !== $order->status) {
                    $order->addNote("Status changed from {$this->statusLabel($previousStatus)} to {$order->getStatusLabel()}.", OrderNote::STATUS, $userId);
                }
                if ($previousPayment !== $order->payment_status) {
                    $order->addNote("Payment marked as {$order->getPaymentStatusLabel()}.", OrderNote::PAYMENT, $userId);
                }
                if ($previousTracking !== $order->tracking_number && $order->tracking_number) {
                    $order->addNote("Tracking number set to {$order->tracking_number}.", OrderNote::STATUS, $userId);
                }
            });
        } catch (ValidationException $e) {
            $message = 'Not enough stock to reopen this order: '.collect($e->errors())->flatten()->implode(' ');

            return $request->wantsJson()
                ? response()->json(['message' => $message, 'errors' => ['status' => [$message]]], 422)
                : back()->with('error', $message);
        }

        if ($releasesStock || $reservesStock) {
            app(PostService::class)->flushCache();
        }

        if ($previousStatus !== $order->status) {
            $this->sendStatusEmails($order, $previousStatus);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'order' => $this->transformForAdmin($order->fresh(['items', 'user', 'notes.user']), true),
            ]);
        }

        return back()->with('success', 'Order updated');
    }

    /**
     * A note in the order's history, optionally emailed to the customer.
     */
    public function addNote(Request $request, Order $order): JsonResponse|RedirectResponse
    {
        $this->authorizeManage();

        $data = $request->validate([
            'message' => 'required|string|max:5000',
            'notify_customer' => 'boolean',
        ]);

        $notify = (bool) ($data['notify_customer'] ?? false) && $order->customer_email;
        $note = $order->addNote(trim($data['message']), OrderNote::NOTE, $request->user()?->id, (bool) $notify);

        if ($notify) {
            try {
                Mail::to($order->customer_email)->send(new OrderNoteCustomer($order, $note->message));
            } catch (\Throwable $e) {
                logger()->error('Failed to send order note email: '.$e->getMessage());
            }
        }

        return $request->wantsJson()
            ? response()->json(['success' => true, 'note' => $this->transformNote($note->load('user'))], 201)
            : back()->with('success', $notify ? 'Note added and emailed to the customer' : 'Note added');
    }

    /**
     * Refund the full amount: at the provider for online payments, as a
     * record only for cash and bank transfer (money goes back by hand).
     */
    public function refund(Request $request, Order $order): JsonResponse|RedirectResponse
    {
        $this->authorizeManage();

        if (! $order->isPaid()) {
            $message = 'Only paid orders can be refunded.';

            return $request->wantsJson() ? response()->json(['error' => $message], 422) : back()->with('error', $message);
        }

        $payments = app(PaymentService::class);
        $gateway = $payments->gateway($order->payment_method);

        try {
            if ($gateway?->isOnline()) {
                $gateway->refund($order);
            }
        } catch (PaymentException $e) {
            return $request->wantsJson() ? response()->json(['error' => $e->getMessage()], 422) : back()->with('error', $e->getMessage());
        }

        $payments->markRefunded($order, $gateway?->isOnline() ? "refunded via {$gateway->label()}" : 'marked as refunded');

        $message = $gateway?->isOnline()
            ? "Order refunded via {$gateway->label()}."
            : 'Order marked as refunded. Send the money back to the customer yourself.';

        return $request->wantsJson()
            ? response()->json(['success' => true, 'message' => $message])
            : back()->with('success', $message);
    }

    public function destroy(Request $request, Order $order): JsonResponse|RedirectResponse
    {
        $this->authorizeManage();

        // Only allow deletion of cancelled orders
        if (! in_array($order->status, ['cancelled', 'refunded'])) {
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
                'items' => $order->items->map(fn ($item) => [
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
                'notes' => $order->relationLoaded('notes') ? $order->notes->map(fn (OrderNote $note) => $this->transformNote($note))->all() : [],
                'payments' => Payment::where('order_id', $order->id)->oldest('id')->get()->map(fn (Payment $payment) => [
                    'id' => $payment->id,
                    'gateway' => $payment->gateway,
                    'provider_ref' => $payment->provider_ref,
                    'status' => $payment->status,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'created_at' => $payment->created_at?->toISOString(),
                ])->all(),
                'can_refund' => $order->isPaid(),
                'refunds_online' => (bool) app(PaymentService::class)->gateway($order->payment_method)?->isOnline(),
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
        if (! auth()->user()?->can('view shop orders')) {
            abort(403, 'Unauthorized');
        }
    }

    protected function authorizeManage(): void
    {
        if (! auth()->user()?->can('manage shop orders')) {
            abort(403, 'Unauthorized');
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function transformNote(OrderNote $note): array
    {
        return [
            'id' => $note->id,
            'type' => $note->type,
            'message' => $note->message,
            'customer_notified' => $note->customer_notified,
            'author' => $note->user?->name,
            'created_at' => $note->created_at?->toISOString(),
        ];
    }

    protected function statusLabel(string $status): string
    {
        return (new Order(['status' => $status]))->getStatusLabel();
    }

    protected function sendStatusEmails(Order $order, string $previousStatus): void
    {
        if (! $order->customer_email) {
            return;
        }

        if ($order->status === Order::STATUS_SHIPPED && $previousStatus !== Order::STATUS_SHIPPED) {
            try {
                Mail::to($order->customer_email)->send(new OrderShippedCustomer($order));
            } catch (\Throwable $e) {
                logger()->error('Failed to send order shipped email: '.$e->getMessage());
            }
        }

        if ($order->status === Order::STATUS_COMPLETED && $previousStatus !== Order::STATUS_COMPLETED) {
            try {
                Mail::to($order->customer_email)->send(new OrderCompletedCustomer($order));
            } catch (\Throwable $e) {
                logger()->error('Failed to send order completed email: '.$e->getMessage());
            }
        }

        // Refunds email from PaymentService::markRefunded, whichever way they happen
        if ($order->status === Order::STATUS_CANCELLED && $previousStatus !== Order::STATUS_CANCELLED) {
            try {
                Mail::to($order->customer_email)->send(new OrderCancelledCustomer($order));
            } catch (\Throwable $e) {
                logger()->error('Failed to send order cancelled email: '.$e->getMessage());
            }
        }
    }
}
