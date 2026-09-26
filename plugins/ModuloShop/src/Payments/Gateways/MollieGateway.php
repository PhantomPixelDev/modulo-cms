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
 * Mollie Payments API: iDEAL, Bancontact, cards, SOFORT and more, chosen on
 * Mollie's hosted page.
 *
 * Mollie's webhook carries only a payment id and no signature; the status is
 * always fetched back from Mollie with the API key, which is what makes it
 * trustworthy.
 */
class MollieGateway extends AbstractGateway
{
    protected const API = 'https://api.mollie.com/v2';

    public function id(): string
    {
        return 'mollie';
    }

    public function label(): string
    {
        return $this->setting('title', 'iDEAL, Bancontact & more (Mollie)');
    }

    public function description(): string
    {
        return $this->setting('description', 'Choose your payment method on the next page');
    }

    public function isConfigured(): bool
    {
        return $this->setting('api_key') !== null;
    }

    public function fields(): array
    {
        return [
            ['key' => 'title', 'label' => 'Title at checkout', 'type' => 'text'],
            ['key' => 'description', 'label' => 'Description at checkout', 'type' => 'text'],
            ['key' => 'api_key', 'label' => 'API key', 'type' => 'secret', 'help' => 'test_… to test, live_… to take real payments. Mollie dashboard → Developers → API keys. No webhook setup needed.'],
        ];
    }

    public function start(Order $order, string $returnUrl, string $cancelUrl, string $webhookUrl): string
    {
        $response = $this->ensureOk($this->http()->post(self::API.'/payments', [
            'amount' => [
                'currency' => strtoupper($order->currency),
                'value' => Money::string((float) $order->total, $order->currency),
            ],
            'description' => 'Order '.$order->order_number,
            'redirectUrl' => $returnUrl,
            'cancelUrl' => $cancelUrl,
            'webhookUrl' => $webhookUrl,
            'metadata' => ['order_number' => $order->order_number],
        ]), 'payment creation');

        $molliePayment = $response->json();
        $checkout = $molliePayment['_links']['checkout']['href'] ?? null;

        if (! is_string($checkout)) {
            throw new PaymentException('Mollie did not return a payment page. Please try another payment method.');
        }

        $this->payments()->recordAttempt($order, $this->id(), $molliePayment['id']);

        return $checkout;
    }

    public function confirmReturn(Order $order, Request $request): void
    {
        // Mollie adds nothing to the return URL: check the latest attempt
        $attempt = $this->payments()->latestAttempt($order, $this->id());

        if ($attempt?->provider_ref) {
            $this->sync($attempt->provider_ref);
        }
    }

    public function handleWebhook(Request $request): Response
    {
        $id = (string) $request->input('id', '');

        // Unknown ids get a 200 too, so the endpoint can't be used to probe
        if (preg_match('/^tr_[A-Za-z0-9]+$/', $id) === 1) {
            $this->sync($id);
        }

        return response('ok');
    }

    public function refund(Order $order): void
    {
        $payment = $this->payments()->paidAttempt($order, $this->id());

        if ($payment?->provider_ref === null) {
            throw new PaymentException('No Mollie payment found for this order.');
        }

        $this->ensureOk($this->http()->post(self::API.'/payments/'.urlencode($payment->provider_ref).'/refunds', [
            'amount' => [
                'currency' => strtoupper($payment->currency),
                'value' => Money::string($payment->amount, $payment->currency),
            ],
            'description' => 'Refund for order '.$order->order_number,
        ]), 'refund');
    }

    /**
     * Read a payment from Mollie and record what it says.
     */
    protected function sync(string $molliePaymentId): void
    {
        $response = $this->http()->get(self::API.'/payments/'.urlencode($molliePaymentId));

        if (! $response->successful()) {
            Log::warning('Mollie payment lookup failed', ['id' => $molliePaymentId, 'status' => $response->status()]);

            return;
        }

        $molliePayment = $response->json();
        $order = Order::where('order_number', $molliePayment['metadata']['order_number'] ?? '')->first();

        if ($order === null) {
            return;
        }

        $status = $molliePayment['status'] ?? '';

        if ($status === 'paid') {
            $currency = strtoupper((string) ($molliePayment['amount']['currency'] ?? $order->currency));
            $this->payments()->markPaid($order, $this->id(), $molliePaymentId, (float) ($molliePayment['amount']['value'] ?? 0), $currency);
        } elseif (in_array($status, ['failed', 'canceled', 'expired'], true)) {
            $this->payments()->markAttempt($this->id(), $molliePaymentId, $status === 'failed' ? Payment::FAILED : Payment::CANCELLED);
        }

        if (($molliePayment['amountRefunded']['value'] ?? '0.00') !== '0.00'
            && Money::covers((float) $molliePayment['amountRefunded']['value'], (float) $order->total, $order->currency)) {
            $this->payments()->markRefunded($order, 'Refunded in Mollie');
        }
    }

    protected function http(): PendingRequest
    {
        return Http::withToken((string) $this->setting('api_key'))->acceptJson()->asJson()->timeout(20);
    }
}
