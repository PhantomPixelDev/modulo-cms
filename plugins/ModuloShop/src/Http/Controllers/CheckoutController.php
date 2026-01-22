<?php

namespace Plugins\ModuloShop\src\Http\Controllers;

use App\Models\SiteSetting;
use App\Services\ReactTemplateRenderer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Inertia\Response;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Models\OrderItem;
use Plugins\ModuloShop\src\Mail\OrderPlacedAdmin;
use Plugins\ModuloShop\src\Mail\OrderPlacedCustomer;
use Plugins\ModuloShop\src\Services\CartService;

class CheckoutController
{
    protected CartService $cartService;
    protected ReactTemplateRenderer $reactRenderer;

    public function __construct(CartService $cartService, ReactTemplateRenderer $reactRenderer)
    {
        $this->cartService = $cartService;
        $this->reactRenderer = $reactRenderer;
    }

    public function index(Request $request): JsonResponse|Response|RedirectResponse
    {
        $cart = $this->cartService->getCartWithProducts();
        $totals = $this->cartService->getTotals();

        if ($cart['is_empty']) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Cart is empty'], 400);
            }
            return redirect('/shop/cart')->with('error', 'Your cart is empty');
        }

        $user = $request->user();

        if ($request->wantsJson()) {
            return response()->json([
                'cart' => $cart,
                'totals' => $totals,
                'user' => $user ? [
                    'name' => $user->name,
                    'email' => $user->email,
                ] : null,
            ]);
        }

        return $this->reactRenderer->render('Shop/Checkout', [
            'cart' => $cart,
            'totals' => $totals,
            'user' => $user ? [
                'name' => $user->name,
                'email' => $user->email,
            ] : null,
            'countries' => $this->getCountries(),
        ]);
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $cart = $this->cartService->getCartWithProducts();
        
        if ($cart['is_empty']) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Cart is empty'], 400);
            }
            return back()->withErrors(['cart' => 'Your cart is empty']);
        }

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'nullable|string|max:50',
            'billing_address_1' => 'required|string|max:255',
            'billing_address_2' => 'nullable|string|max:255',
            'billing_city' => 'required|string|max:255',
            'billing_state' => 'nullable|string|max:255',
            'billing_postcode' => 'required|string|max:20',
            'billing_country' => 'required|string|size:2',
            'ship_to_different' => 'boolean',
            'shipping_address_1' => 'required_if:ship_to_different,true|nullable|string|max:255',
            'shipping_address_2' => 'nullable|string|max:255',
            'shipping_city' => 'required_if:ship_to_different,true|nullable|string|max:255',
            'shipping_state' => 'nullable|string|max:255',
            'shipping_postcode' => 'required_if:ship_to_different,true|nullable|string|max:20',
            'shipping_country' => 'required_if:ship_to_different,true|nullable|string|size:2',
            'customer_note' => 'nullable|string|max:1000',
            'payment_method' => 'required|string|in:cod,bank_transfer,stripe',
        ]);

        $totals = $this->cartService->getTotals();

        try {
            $order = DB::transaction(function () use ($validated, $cart, $totals, $request) {
                $order = Order::create([
                    'order_number' => Order::generateOrderNumber(),
                    'user_id' => $request->user()?->id,
                    'status' => Order::STATUS_PENDING,
                    'subtotal' => $totals['subtotal'],
                    'discount' => $totals['discount'],
                    'shipping' => $totals['shipping'],
                    'tax' => $totals['tax'],
                    'total' => $totals['total'],
                    'currency' => $totals['currency'],
                    'customer_name' => $validated['customer_name'],
                    'customer_email' => $validated['customer_email'],
                    'customer_phone' => $validated['customer_phone'] ?? null,
                    'billing_address_1' => $validated['billing_address_1'],
                    'billing_address_2' => $validated['billing_address_2'] ?? null,
                    'billing_city' => $validated['billing_city'],
                    'billing_state' => $validated['billing_state'] ?? null,
                    'billing_postcode' => $validated['billing_postcode'],
                    'billing_country' => $validated['billing_country'],
                    'ship_to_different' => $validated['ship_to_different'] ?? false,
                    'shipping_address_1' => $validated['shipping_address_1'] ?? null,
                    'shipping_address_2' => $validated['shipping_address_2'] ?? null,
                    'shipping_city' => $validated['shipping_city'] ?? null,
                    'shipping_state' => $validated['shipping_state'] ?? null,
                    'shipping_postcode' => $validated['shipping_postcode'] ?? null,
                    'shipping_country' => $validated['shipping_country'] ?? null,
                    'customer_note' => $validated['customer_note'] ?? null,
                    'payment_method' => $validated['payment_method'],
                    'payment_status' => Order::PAYMENT_PENDING,
                ]);

                foreach ($cart['items'] as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['product_id'],
                        'product_name' => $item['product_name'],
                        'product_sku' => $item['sku'],
                        'price' => $item['price'],
                        'quantity' => $item['quantity'],
                        'subtotal' => $item['subtotal'],
                        'product_data' => [
                            'slug' => $item['product_slug'],
                            'image' => $item['product_image'],
                            'original_price' => $item['original_price'],
                        ],
                    ]);
                }

                return $order;
            });

            // Clear the cart after successful order
            $this->cartService->clear();

            $order->loadMissing('items');
            $this->sendOrderPlacedEmails($order);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'order' => [
                        'id' => $order->id,
                        'order_number' => $order->order_number,
                        'total' => $order->total,
                        'currency' => $order->currency,
                    ],
                    'redirect' => route('shop.order.confirmation', $order->order_number),
                ]);
            }

            return redirect()->route('shop.order.confirmation', $order->order_number)
                ->with('success', 'Order placed successfully!');

        } catch (\Exception $e) {
            logger()->error('Checkout error: ' . $e->getMessage());
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to process order. Please try again.',
                ], 500);
            }

            return back()->withErrors(['checkout' => 'Failed to process order. Please try again.']);
        }
    }

    public function confirmation(Request $request, string $orderNumber): JsonResponse|Response
    {
        $order = Order::where('order_number', $orderNumber)
            ->with('items')
            ->firstOrFail();

        // Only allow viewing own orders or if guest matches email
        $user = $request->user();
        if ($order->user_id && (!$user || $user->id !== $order->user_id)) {
            abort(403);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'order' => $this->transformOrder($order),
            ]);
        }

        return $this->reactRenderer->render('Shop/OrderConfirmation', [
            'order' => $this->transformOrder($order),
        ]);
    }

    protected function transformOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'status_label' => $order->getStatusLabel(),
            'payment_status' => $order->payment_status,
            'payment_status_label' => $order->getPaymentStatusLabel(),
            'subtotal' => (float) $order->subtotal,
            'discount' => (float) $order->discount,
            'shipping' => (float) $order->shipping,
            'tax' => (float) $order->tax,
            'total' => (float) $order->total,
            'currency' => $order->currency,
            'customer_name' => $order->customer_name,
            'customer_email' => $order->customer_email,
            'billing_address' => [
                'address_1' => $order->billing_address_1,
                'address_2' => $order->billing_address_2,
                'city' => $order->billing_city,
                'state' => $order->billing_state,
                'postcode' => $order->billing_postcode,
                'country' => $order->billing_country,
            ],
            'shipping_address' => $order->getShippingAddress(),
            'payment_method' => $order->payment_method,
            'customer_note' => $order->customer_note,
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
            'created_at' => $order->created_at->toISOString(),
        ];
    }

    protected function getCountries(): array
    {
        return [
            'US' => 'United States',
            'CA' => 'Canada',
            'GB' => 'United Kingdom',
            'AU' => 'Australia',
            'DE' => 'Germany',
            'FR' => 'France',
            'ES' => 'Spain',
            'IT' => 'Italy',
            'NL' => 'Netherlands',
            'BE' => 'Belgium',
            'AT' => 'Austria',
            'CH' => 'Switzerland',
            'SE' => 'Sweden',
            'NO' => 'Norway',
            'DK' => 'Denmark',
            'FI' => 'Finland',
            'IE' => 'Ireland',
            'PT' => 'Portugal',
            'PL' => 'Poland',
            'CZ' => 'Czech Republic',
            'JP' => 'Japan',
            'CN' => 'China',
            'IN' => 'India',
            'BR' => 'Brazil',
            'MX' => 'Mexico',
            'AR' => 'Argentina',
            'ZA' => 'South Africa',
            'NZ' => 'New Zealand',
            'SG' => 'Singapore',
            'HK' => 'Hong Kong',
        ];
    }

    protected function sendOrderPlacedEmails(Order $order): void
    {
        if ($order->customer_email) {
            try {
                Mail::to($order->customer_email)->send(new OrderPlacedCustomer($order));
            } catch (\Throwable $e) {
                logger()->error('Failed to send order placed customer email: ' . $e->getMessage());
            }
        }

        $adminEmail = SiteSetting::get('admin_email', config('mail.admin_address'))
            ?: config('mail.admin_address');

        if ($adminEmail) {
            try {
                Mail::to($adminEmail)->send(new OrderPlacedAdmin($order));
            } catch (\Throwable $e) {
                logger()->error('Failed to send order placed admin email: ' . $e->getMessage());
            }
        }
    }
}
