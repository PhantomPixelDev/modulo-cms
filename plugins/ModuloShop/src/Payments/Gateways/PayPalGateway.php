<?php

namespace Plugins\ModuloShop\src\Payments\Gateways;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Payments\Money;
use Plugins\ModuloShop\src\Payments\PaymentException;
use Symfony\Component\HttpFoundation\Response;

/**
 * PayPal Checkout (Orders v2): the customer approves on PayPal, then the
 * order is captured from here, on return or from the webhook, whichever
 * comes first.
 */
class PayPalGateway extends AbstractGateway
{
    public function id(): string
    {
        return 'paypal';
    }

    public function label(): string
    {
        return $this->setting('title', 'PayPal');
    }

    public function description(): string
    {
        return $this->setting('description', 'Pay with your PayPal account or card via PayPal');
    }

    public function isConfigured(): bool
    {
        return $this->setting('client_id') !== null && $this->setting('client_secret') !== null && $this->setting('webhook_id') !== null;
    }

    public function fields(): array
    {
        return [
            ['key' => 'title', 'label' => 'Title at checkout', 'type' => 'text'],
            ['key' => 'description', 'label' => 'Description at checkout', 'type' => 'text'],
            ['key' => 'mode', 'label' => 'Mode', 'type' => 'select', 'options' => ['sandbox' => 'Sandbox (testing)', 'live' => 'Live']],
            ['key' => 'client_id', 'label' => 'Client ID', 'type' => 'text', 'help' => 'developer.paypal.com → Apps & Credentials → your REST app.'],
            ['key' => 'client_secret', 'label' => 'Client secret', 'type' => 'secret'],
            [
                'key' => 'webhook_id',
                'label' => 'Webhook ID',
                'type' => 'text',
                'help' => 'Add a webhook for the URL below in the same app, with CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED and PAYMENT.CAPTURE.REFUNDED, then paste its ID.',
            ],
        ];
    }

    public function start(Order $order, string $returnUrl, string $cancelUrl, string $webhookUrl): string
    {
        $response = $this->ensureOk($this->api()->post('/v2/checkout/orders', [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'reference_id' => $order->order_number,
                'custom_id' => $order->order_number,
                'invoice_id' => $order->order_number,
                'description' => 'Order '.$order->order_number,
                'amount' => [
                    'currency_code' => strtoupper($order->currency),
                    'value' => Money::string((float) $order->total, $order->currency),
                ],
            ]],
            'payment_source' => [
                'paypal' => [
                    'experience_context' => [
                        'return_url' => $returnUrl,
                        'cancel_url' => $cancelUrl,
                        'user_action' => 'PAY_NOW',
                        'shipping_preference' => 'NO_SHIPPING',
                        'brand_name' => mb_substr((string) config('app.name'), 0, 127),
                    ],
                ],
            ],
        ]), 'order creation');

        $paypalOrder = $response->json();
        $approve = collect($paypalOrder['links'] ?? [])->first(fn ($link) => in_array($link['rel'] ?? '', ['payer-action', 'approve'], true));

        if (! $approve) {
            throw new PaymentException('PayPal did not return a payment page. Please try another payment method.');
        }

        $this->payments()->recordAttempt($order, $this->id(), $paypalOrder['id']);

        return (string) $approve['href'];
    }

    public function confirmReturn(Order $order, Request $request): void
    {
        $paypalOrderId = (string) $request->query('token', '');

        if ($this->payments()->attempt($order, $this->id(), $paypalOrderId) !== null) {
            $this->capture($paypalOrderId);
        }
    }

    public function handleWebhook(Request $request): Response
    {
        if (! $this->verified($request)) {
            return response('Invalid signature', 400);
        }

        $event = $request->json()->all();
        $resource = $event['resource'] ?? [];

        switch ($event['event_type'] ?? '') {
            case 'CHECKOUT.ORDER.APPROVED':
                // The customer approved but never came back to the shop
                $this->capture((string) ($resource['id'] ?? ''));
                break;
            case 'PAYMENT.CAPTURE.COMPLETED':
                $this->applyCapture($resource, $resource['supplementary_data']['related_ids']['order_id'] ?? null);
                break;
            case 'PAYMENT.CAPTURE.DENIED':
                $this->payments()->markAttempt($this->id(), (string) ($resource['supplementary_data']['related_ids']['order_id'] ?? ''), 'failed');
                break;
            case 'PAYMENT.CAPTURE.REFUNDED':
                $order = Order::where('order_number', $resource['custom_id'] ?? '')->first();
                if ($order) {
                    $this->payments()->markRefunded($order, 'Refunded in PayPal');
                }
                break;
        }

        return response('ok');
    }

    public function refund(Order $order): void
    {
        $captureId = $this->payments()->paidAttempt($order, $this->id())?->data['capture_id'] ?? null;

        if ($captureId === null) {
            throw new PaymentException('No PayPal capture found for this order.');
        }

        $this->ensureOk($this->api()->post('/v2/payments/captures/'.urlencode($captureId).'/refund', [
            'invoice_id' => $order->order_number,
        ]), 'refund');
    }

    protected function capture(string $paypalOrderId): void
    {
        if ($paypalOrderId === '') {
            return;
        }

        $response = $this->api()->withHeaders(['PayPal-Request-Id' => 'capture-'.$paypalOrderId])
            ->post('/v2/checkout/orders/'.urlencode($paypalOrderId).'/capture', (object) []);

        // Already captured (return and webhook raced): read the order instead
        $body = $response->successful()
            ? $response->json()
            : $this->api()->get('/v2/checkout/orders/'.urlencode($paypalOrderId))->json();

        $capture = $body['purchase_units'][0]['payments']['captures'][0] ?? null;

        if (is_array($capture)) {
            $this->applyCapture($capture + ['custom_id' => $body['purchase_units'][0]['custom_id'] ?? null], $paypalOrderId);
        }
    }

    /**
     * @param  array<string, mixed>  $capture
     */
    protected function applyCapture(array $capture, ?string $paypalOrderId): void
    {
        if (($capture['status'] ?? null) !== 'COMPLETED' || $paypalOrderId === null) {
            return;
        }

        $order = Order::where('order_number', $capture['custom_id'] ?? '')->first();

        if ($order === null) {
            Log::warning('PayPal capture for an unknown order', ['paypal_order' => $paypalOrderId]);

            return;
        }

        $currency = strtoupper((string) ($capture['amount']['currency_code'] ?? $order->currency));

        $this->payments()->markPaid(
            $order,
            $this->id(),
            $paypalOrderId,
            (float) ($capture['amount']['value'] ?? 0),
            $currency,
            ['capture_id' => $capture['id'] ?? null],
        );
    }

    /**
     * PayPal signs webhooks with a certificate; asking PayPal to check the
     * signature is the documented way to verify one.
     */
    protected function verified(Request $request): bool
    {
        $webhookId = $this->setting('webhook_id');
        $event = json_decode($request->getContent(), true);

        if ($webhookId === null || ! is_array($event)) {
            return false;
        }

        $response = $this->api()->post('/v1/notifications/verify-webhook-signature', [
            'auth_algo' => $request->header('PAYPAL-AUTH-ALGO'),
            'cert_url' => $request->header('PAYPAL-CERT-URL'),
            'transmission_id' => $request->header('PAYPAL-TRANSMISSION-ID'),
            'transmission_sig' => $request->header('PAYPAL-TRANSMISSION-SIG'),
            'transmission_time' => $request->header('PAYPAL-TRANSMISSION-TIME'),
            'webhook_id' => $webhookId,
            'webhook_event' => $event,
        ]);

        return $response->successful() && ($response->json('verification_status') === 'SUCCESS');
    }

    protected function baseUrl(): string
    {
        return $this->setting('mode', 'sandbox') === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    }

    protected function api(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl())->withToken($this->accessToken())->acceptJson()->asJson()->timeout(20);
    }

    protected function accessToken(): string
    {
        $clientId = (string) $this->setting('client_id');
        $key = 'shop.paypal.token.'.sha1($this->baseUrl().$clientId);

        $token = Cache::get($key);
        if (is_string($token)) {
            return $token;
        }

        $response = $this->ensureOk(
            Http::baseUrl($this->baseUrl())->withBasicAuth($clientId, (string) $this->setting('client_secret'))
                ->asForm()->acceptJson()->timeout(20)
                ->post('/v1/oauth2/token', ['grant_type' => 'client_credentials']),
            'authentication',
        );

        $token = (string) $response->json('access_token');
        // Tokens live about 9 hours; renew well before
        Cache::put($key, $token, now()->addSeconds(max(60, (int) $response->json('expires_in', 3600) - 300)));

        return $token;
    }
}
