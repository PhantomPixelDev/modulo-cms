<?php

namespace Plugins\ModuloShop\src\Http\Controllers;

use App\Models\Post;
use App\Models\User;
use App\Services\PostService;
use App\Services\ReactTemplateRenderer;
use App\Services\SiteSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Response;
use Plugins\ModuloShop\src\Models\Coupon;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Models\OrderItem;
use Plugins\ModuloShop\src\Payments\Gateways\BankTransferGateway;
use Plugins\ModuloShop\src\Payments\PaymentException;
use Plugins\ModuloShop\src\Payments\PaymentGateway;
use Plugins\ModuloShop\src\Services\CartService;
use Plugins\ModuloShop\src\Services\ModuloShopSettings;
use Plugins\ModuloShop\src\Services\PaymentService;
use Plugins\ModuloShop\src\Services\StockService;

class CheckoutController
{
    protected CartService $cartService;

    protected ReactTemplateRenderer $reactRenderer;

    public function __construct(
        CartService $cartService,
        ReactTemplateRenderer $reactRenderer,
        protected StockService $stock,
        protected PaymentService $payments,
    ) {
        $this->cartService = $cartService;
        $this->reactRenderer = $reactRenderer;
    }

    public function index(Request $request): JsonResponse|Response|RedirectResponse
    {
        if ($closed = $this->closedResponse($request)) {
            return $closed;
        }

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
                'payment_methods' => $this->paymentMethods(),
                'saved_address' => $user ? $this->savedAddress($user) : null,
                'terms_url' => $this->termsUrl(),
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
            'payment_methods' => $this->paymentMethods(),
            'saved_address' => $user ? $this->savedAddress($user) : null,
            'terms_url' => $this->termsUrl(),
        ]);
    }

    /**
     * A returning customer's details from their last order, to fill in the form.
     *
     * @return array<string, mixed>|null
     */
    protected function savedAddress(User $user): ?array
    {
        $last = AccountController::ordersOf($user)->latest('id')->first();

        return $last?->only([
            'customer_phone',
            'billing_address_1', 'billing_address_2', 'billing_city', 'billing_state', 'billing_postcode', 'billing_country',
            'ship_to_different',
            'shipping_address_1', 'shipping_address_2', 'shipping_city', 'shipping_state', 'shipping_postcode', 'shipping_country',
        ]);
    }

    /** The published terms page chosen in shop settings, if any. */
    protected function termsUrl(): ?string
    {
        $pageId = app(ModuloShopSettings::class)->get('terms_page_id');
        $page = $pageId ? Post::query()->whereKey($pageId)->where('status', 'published')->first() : null;

        return $page ? app(SiteSettingsService::class)->formatPostUrl($page) : null;
    }

    /**
     * @return list<array{id: string, label: string, description: string, online: bool}>
     */
    protected function paymentMethods(): array
    {
        return array_values(array_map(fn (PaymentGateway $g) => [
            'id' => $g->id(),
            'label' => $g->label(),
            'description' => $g->description(),
            'online' => $g->isOnline(),
        ], $this->payments->available()));
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        if ($closed = $this->closedResponse($request)) {
            return $closed;
        }

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
            'payment_method' => ['required', 'string', Rule::in(array_keys($this->payments->available()))],
            'shipping_method' => 'nullable|string|max:100',
            'accept_terms' => $this->termsUrl() ? 'accepted' : 'nullable',
        ], [
            'accept_terms.accepted' => 'Please accept the terms and conditions.',
        ]);

        if (! empty($validated['shipping_method'])) {
            $this->cartService->setShippingMethod($validated['shipping_method']);
        }

        $totals = $this->cartService->getTotals($cart);

        // A coupon that stopped applying since it was added (expired, used up,
        // cart now below its minimum) must not be dropped silently at payment.
        if (! empty($this->cartService->getCart()['coupon_code']) && $totals['coupon'] === null) {
            throw ValidationException::withMessages([
                'coupon' => $totals['coupon_error'] ?? 'Your coupon can no longer be used. Remove it to continue.',
            ]);
        }
        $quantities = $this->cartService->quantities($cart);

        try {
            $order = DB::transaction(function () use ($validated, $cart, $totals, $request, $quantities) {
                // Locks the product rows and re-checks stock; throws (and rolls back) when short
                $this->stock->reserve($quantities);

                // Same for the coupon: two orders racing for its last use get one each at most.
                if ($totals['coupon'] !== null) {
                    $coupon = Coupon::query()->where('code', $totals['coupon']['code'])->lockForUpdate()->first();
                    $reason = $coupon ? $coupon->unusableReason((float) $totals['subtotal']) : 'This coupon is no longer available.';
                    if ($reason !== null) {
                        throw ValidationException::withMessages(['coupon' => $reason]);
                    }
                    $coupon->increment('used_count');
                }

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
                    'shipping_method' => $totals['shipping_method_name'],
                    'coupon_code' => $totals['coupon']['code'] ?? null,
                    'meta_data' => [
                        'tax_rate' => $totals['tax_rate'],
                        'prices_include_tax' => $totals['prices_include_tax'],
                    ],
                ]);

                foreach ($cart['items'] as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $item['product_id'],
                        'product_name' => $item['variant_name'] ? $item['product_name'].' — '.$item['variant_name'] : $item['product_name'],
                        'product_sku' => $item['sku'],
                        'price' => $item['price'],
                        'quantity' => $item['quantity'],
                        'subtotal' => $item['subtotal'],
                        'product_data' => [
                            'slug' => $item['product_slug'],
                            'image' => $item['product_image'],
                            'original_price' => $item['original_price'],
                            'variant_id' => $item['variant_id'],
                            'variant_name' => $item['variant_name'],
                        ],
                    ]);
                }

                return $order;
            });
        } catch (ValidationException $e) {
            // Stock problems: show them like any other validation error
            throw $e;
        } catch (\Throwable $e) {
            report($e);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to process order. Please try again.',
                ], 500);
            }

            return back()->withErrors(['checkout' => 'Failed to process order. Please try again.']);
        }

        app(PostService::class)->flushCache(); // stock changed
        $gateway = $this->payments->gateway($order->payment_method);

        // Online: off to the provider's page. If the provider refuses, the
        // order is undone (stock and coupon back) and the cart kept, so the
        // customer can pick another method straight away.
        if ($gateway?->isOnline()) {
            try {
                $paymentUrl = $this->payments->start($order, $gateway);
            } catch (PaymentException $e) {
                $this->payments->cancelUnpaid($order, 'the payment provider refused to start the payment');

                // 422, not 5xx: a proxy such as Cloudflare replaces 5xx bodies,
                // and the customer needs this message to choose another method.
                return $request->wantsJson()
                    ? response()->json(['success' => false, 'message' => $e->getMessage(), 'errors' => ['payment_method' => [$e->getMessage()]]], 422)
                    : back()->withErrors(['payment_method' => $e->getMessage()]);
            }

            $this->cartService->clear();

            return $request->wantsJson()
                ? response()->json(['success' => true, 'order' => ['id' => $order->id, 'order_number' => $order->order_number, 'total' => $order->total, 'currency' => $order->currency], 'redirect' => $paymentUrl])
                : redirect()->away($paymentUrl);
        }

        // Offline: the order is committed from here on; nothing below may turn it into an error response.
        $this->cartService->clear();
        $this->payments->sendPlacedEmails($order);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'order' => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'total' => $order->total,
                    'currency' => $order->currency,
                ],
                'redirect' => $order->confirmationUrl(),
            ]);
        }

        return redirect()->to($order->confirmationUrl())
            ->with('success', 'Order placed successfully!');
    }

    /**
     * The store owner switched checkout off: browsing and the cart keep working.
     */
    protected function closedResponse(Request $request): JsonResponse|RedirectResponse|null
    {
        if (app(ModuloShopSettings::class)->checkoutEnabled()) {
            return null;
        }

        $message = 'Checkout is currently closed. Please try again later.';

        if ($request->wantsJson()) {
            return response()->json(['error' => $message], 503);
        }

        return redirect('/shop/cart')->with('error', $message);
    }

    public function confirmation(Request $request, string $orderNumber): JsonResponse|Response
    {
        $order = Order::where('order_number', $orderNumber)
            ->with('items')
            ->firstOrFail();

        // Owners, or anyone holding the secret link from checkout. 404 so order numbers can't be probed.
        abort_unless($order->canBeViewedWith($request->user(), $request->query('key')), 404);

        if ($request->wantsJson()) {
            return response()->json([
                'order' => $this->transformOrder($order),
            ]);
        }

        return $this->reactRenderer->render('Shop/OrderConfirmation', [
            'order' => $this->transformOrder($order),
            'payment' => $this->paymentState($order, $request->query('key')),
            'flash' => [
                'success' => session('success'),
                'info' => session('info'),
                'warning' => session('warning'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * What the confirmation page can offer: pay (again) for an unpaid online
     * order, or the bank details for a transfer.
     *
     * @return array<string, mixed>
     */
    protected function paymentState(Order $order, mixed $key): array
    {
        $gateway = $this->payments->gateway($order->payment_method);
        $unpaid = ! $order->isPaid() && $order->status === Order::STATUS_PENDING;
        $online = array_values(array_filter($this->paymentMethods(), fn ($m) => $m['online']));

        return [
            'method_label' => $gateway?->label() ?? $order->payment_method,
            'can_pay' => $unpaid && $online !== [],
            'pay_url' => route('shop.order.pay', ['orderNumber' => $order->order_number, 'key' => is_string($key) ? $key : null]),
            'online_methods' => $unpaid ? $online : [],
            'current_online' => (bool) $gateway?->isOnline(),
            'instructions' => $unpaid && $gateway instanceof BankTransferGateway ? $gateway->instructions() : null,
        ];
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
            'shipping_method' => $order->shipping_method,
            'coupon_code' => $order->coupon_code,
            'prices_include_tax' => (bool) ($order->meta_data['prices_include_tax'] ?? false),
            'customer_note' => $order->customer_note,
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
}
