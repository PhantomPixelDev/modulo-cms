<?php

namespace Plugins\ModuloShop\src\Payments;

use Illuminate\Http\Request;
use Plugins\ModuloShop\src\Models\Order;
use Symfony\Component\HttpFoundation\Response;

/**
 * A way to pay for an order.
 *
 * Offline methods (cash on delivery, bank transfer) take no action at
 * checkout. Online methods send the customer to the provider's hosted payment
 * page, so card data never touches this site, and learn the outcome twice:
 * when the customer comes back (confirmReturn) and from the provider's webhook
 * (handleWebhook). Either may arrive first or alone; PaymentService makes
 * recording the result idempotent.
 */
interface PaymentGateway
{
    public function id(): string;

    public function label(): string;

    /** One line shown under the method at checkout. */
    public function description(): string;

    /** Offline methods skip the hosted payment page. */
    public function isOnline(): bool;

    /** Enough credentials to take payments. */
    public function isConfigured(): bool;

    /**
     * Create the payment at the provider and return the URL to send the
     * customer to. Throws PaymentException when the provider refuses.
     */
    public function start(Order $order, string $returnUrl, string $cancelUrl, string $webhookUrl): string;

    /**
     * The customer is back from the provider: ask the provider (never trust
     * the query string alone) and record the outcome.
     */
    public function confirmReturn(Order $order, Request $request): void;

    /** Provider-to-server notification. Must verify it came from the provider. */
    public function handleWebhook(Request $request): Response;

    /** Refund a paid order in full at the provider. */
    public function refund(Order $order): void;

    /**
     * Settings fields for the admin screen.
     *
     * @return list<array{key: string, label: string, type: 'text'|'secret'|'select'|'textarea', options?: array<string, string>, help?: string}>
     */
    public function fields(): array;
}
