<?php

namespace Plugins\ModuloShop\src\Payments\Gateways;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Models\Payment;
use Plugins\ModuloShop\src\Payments\Money;
use Plugins\ModuloShop\src\Payments\PaymentException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Stripe Checkout (hosted page): cards, Apple/Google Pay and whatever else is
 * switched on in the Stripe dashboard.
 */
class StripeGateway extends AbstractGateway
{
    protected const API = 'https://api.stripe.com/v1';

    /** Seconds a signed webhook stays acceptable (replay protection). */
    protected const SIGNATURE_TOLERANCE = 300;

    public function id(): string
    {
        return 'stripe';
    }

    public function label(): string
    {
        return $this->setting('title', 'Card (Stripe)');
    }

    public function description(): string
    {
        return $this->setting('description', 'Pay securely by card on Stripe');
    }

    public function isConfigured(): bool
    {
        return $this->setting('secret_key') !== null && $this->setting('webhook_secret') !== null;
    }

    public function fields(): array
    {
        return [
            ['key' => 'title', 'label' => 'Title at checkout', 'type' => 'text'],
            ['key' => 'description', 'label' => 'Description at checkout', 'type' => 'text'],
            ['key' => 'secret_key', 'label' => 'Secret key', 'type' => 'secret', 'help' => 'sk_test_… to test, sk_live_… to take real payments. Stripe dashboard → Developers → API keys.'],
            [
                'key' => 'webhook_secret',
                'label' => 'Webhook signing secret',
                'type' => 'secret',
                'help' => 'whsec_…. Add an endpoint for the webhook URL below with the events checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed and checkout.session.expired.',
            ],
        ];
    }

    public function start(Order $order, string $returnUrl, string $cancelUrl, string $webhookUrl): string
    {
        $currency = strtolower($order->currency);

        $response = $this->ensureOk($this->http()->asForm()->post(self::API.'/checkout/sessions', [
            'mode' => 'payment',
            // One line for the whole order: the total already has discount,
            // shipping and tax worked out, and must be charged exactly.
            'line_items' => [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => $currency,
                    'unit_amount' => Money::minor((float) $order->total, $order->currency),
                    'product_data' => ['name' => 'Order '.$order->order_number],
                ],
            ]],
            'customer_email' => $order->customer_email,
            'client_reference_id' => $order->order_number,
            'metadata' => ['order_number' => $order->order_number],
            'payment_intent_data' => ['metadata' => ['order_number' => $order->order_number]],
            'success_url' => $returnUrl.(str_contains($returnUrl, '?') ? '&' : '?').'session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => $cancelUrl,
        ]), 'checkout session');

        $session = $response->json();

        $this->payments()->recordAttempt($order, $this->id(), $session['id'], ['session_id' => $session['id']]);

        return (string) $session['url'];
    }

    public function confirmReturn(Order $order, Request $request): void
    {
        $sessionId = (string) $request->query('session_id', '');
        $payment = $this->payments()->attempt($order, $this->id(), $sessionId);

        if ($payment === null) {
            return;
        }

        $session = $this->http()->get(self::API.'/checkout/sessions/'.urlencode($sessionId))->json();
        $this->applySession($session ?? []);
    }

    public function handleWebhook(Request $request): Response
    {
        $event = $this->verifiedEvent($request);

        if ($event === null) {
            return response('Invalid signature', 400);
        }

        $session = $event['data']['object'] ?? [];

        match ($event['type'] ?? '') {
            'checkout.session.completed', 'checkout.session.async_payment_succeeded' => $this->applySession($session),
            'checkout.session.async_payment_failed' => $this->failSession($session, Payment::FAILED),
            'checkout.session.expired' => $this->failSession($session, Payment::CANCELLED),
            default => null,
        };

        return response('ok');
    }

    public function refund(Order $order): void
    {
        $payment = $this->payments()->paidAttempt($order, $this->id());
        $intent = $payment?->data['payment_intent'] ?? null;

        if ($intent === null) {
            throw new PaymentException('No Stripe payment found for this order.');
        }

        $this->ensureOk($this->http()->asForm()->post(self::API.'/refunds', [
            'payment_intent' => $intent,
            'metadata' => ['order_number' => $order->order_number],
        ]), 'refund');
    }

    /**
     * @param  array<string, mixed>  $session
     */
    protected function applySession(array $session): void
    {
        if (($session['payment_status'] ?? null) !== 'paid') {
            return;
        }

        $order = Order::where('order_number', $session['metadata']['order_number'] ?? $session['client_reference_id'] ?? '')->first();

        if ($order === null) {
            Log::warning('Stripe session for an unknown order', ['session' => $session['id'] ?? null]);

            return;
        }

        $currency = strtoupper((string) ($session['currency'] ?? $order->currency));

        $this->payments()->markPaid(
            $order,
            $this->id(),
            (string) $session['id'],
            Money::fromMinor((int) ($session['amount_total'] ?? 0), $currency),
            $currency,
            ['payment_intent' => $session['payment_intent'] ?? null],
        );
    }

    /**
     * @param  array<string, mixed>  $session
     */
    protected function failSession(array $session, string $status): void
    {
        $this->payments()->markAttempt($this->id(), (string) ($session['id'] ?? ''), $status);
    }

    /**
     * The event, if the Stripe-Signature header proves Stripe sent it recently.
     *
     * @return array<string, mixed>|null
     */
    protected function verifiedEvent(Request $request): ?array
    {
        $secret = $this->setting('webhook_secret');
        $header = (string) $request->header('Stripe-Signature', '');

        if ($secret === null || $header === '') {
            return null;
        }

        $timestamp = null;
        $signatures = [];
        foreach (explode(',', $header) as $part) {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, '');
            if ($key === 't') {
                $timestamp = (int) $value;
            } elseif ($key === 'v1') {
                $signatures[] = $value;
            }
        }

        if ($timestamp === null || abs(time() - $timestamp) > self::SIGNATURE_TOLERANCE) {
            return null;
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), (string) $secret);

        foreach ($signatures as $signature) {
            if (hash_equals($expected, $signature)) {
                $event = json_decode($request->getContent(), true);

                return is_array($event) ? $event : null;
            }
        }

        return null;
    }

    protected function http(): PendingRequest
    {
        return Http::withToken((string) $this->setting('secret_key'))->acceptJson()->timeout(20);
    }
}
