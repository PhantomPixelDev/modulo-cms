<?php

namespace Plugins\ModuloShop\src\Payments\Gateways;

use Illuminate\Http\Client\Response as HttpResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Payments\PaymentException;
use Plugins\ModuloShop\src\Payments\PaymentGateway;
use Plugins\ModuloShop\src\Services\PaymentService;
use Symfony\Component\HttpFoundation\Response;

abstract class AbstractGateway implements PaymentGateway
{
    /**
     * @param  array<string, mixed>  $config  Decrypted settings for this gateway
     */
    public function __construct(protected array $config = []) {}

    public function isOnline(): bool
    {
        return true;
    }

    public function description(): string
    {
        return '';
    }

    public function fields(): array
    {
        return [];
    }

    public function confirmReturn(Order $order, Request $request): void {}

    public function handleWebhook(Request $request): Response
    {
        return response('', 404);
    }

    public function refund(Order $order): void
    {
        throw new PaymentException("{$this->label()} payments are refunded outside the shop.");
    }

    protected function setting(string $key, mixed $default = null): mixed
    {
        $value = $this->config[$key] ?? null;

        return $value === null || $value === '' ? $default : $value;
    }

    protected function payments(): PaymentService
    {
        return app(PaymentService::class);
    }

    /**
     * Turn a failed provider call into a PaymentException the customer may
     * see, logging what the provider actually said.
     */
    protected function ensureOk(HttpResponse $response, string $action): HttpResponse
    {
        if ($response->successful()) {
            return $response;
        }

        Log::warning("{$this->label()} {$action} failed", ['status' => $response->status(), 'body' => $response->body()]);

        throw new PaymentException("{$this->label()} is not available right now. Please try again or choose another payment method.");
    }
}
