<?php

namespace Plugins\ModuloShop\src\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Payments\PaymentException;
use Plugins\ModuloShop\src\Services\PaymentService;
use Symfony\Component\HttpFoundation\Response;

class PaymentController
{
    public function __construct(protected PaymentService $payments) {}

    /**
     * Back from the provider's page. The outcome is fetched from the provider;
     * the webhook may already have recorded it, or may still be on its way.
     */
    public function return(Request $request, string $gateway, string $orderNumber): RedirectResponse
    {
        $order = $this->order($request, $orderNumber);
        $handler = $this->payments->gateway($gateway);
        abort_if($handler === null || ! $handler->isOnline(), 404);

        try {
            $handler->confirmReturn($order, $request);
        } catch (\Throwable $e) {
            // The webhook will still settle it; the customer sees the order either way
            Log::warning("Confirming a {$gateway} return failed: ".$e->getMessage(), ['order' => $order->order_number]);
        }

        $order->refresh();

        return redirect()->to($order->confirmationUrl())->with(
            $order->isPaid() ? 'success' : 'info',
            $order->isPaid() ? 'Payment received. Thank you!' : 'We are waiting for the payment to be confirmed. This page will show it as soon as it arrives.',
        );
    }

    public function cancel(Request $request, string $gateway, string $orderNumber): RedirectResponse
    {
        $order = $this->order($request, $orderNumber);

        return redirect()->to($order->confirmationUrl())
            ->with('warning', 'The payment was not completed. You can try again below.');
    }

    /**
     * Pay (again) for an unpaid order: after cancelling on the provider's
     * page, or to switch to another method.
     */
    public function pay(Request $request, string $orderNumber): RedirectResponse
    {
        $order = $this->order($request, $orderNumber);
        $method = (string) $request->input('payment_method', $order->payment_method);

        if ($order->isPaid() || $order->status !== Order::STATUS_PENDING) {
            return redirect()->to($order->confirmationUrl());
        }

        $gateway = $this->payments->available()[$method] ?? null;

        if ($gateway === null || ! $gateway->isOnline()) {
            return redirect()->to($order->confirmationUrl())->with('error', 'That payment method is not available.');
        }

        try {
            $url = $this->payments->start($order, $gateway);
        } catch (PaymentException $e) {
            return redirect()->to($order->confirmationUrl())->with('error', $e->getMessage());
        }

        $order->update(['payment_method' => $gateway->id()]);

        return redirect()->away($url);
    }

    public function webhook(Request $request, string $gateway): Response
    {
        $handler = $this->payments->gateway($gateway);

        if ($handler === null || ! $handler->isOnline() || ! $this->payments->isEnabled($gateway)) {
            return response('', 404);
        }

        return $handler->handleWebhook($request);
    }

    protected function order(Request $request, string $orderNumber): Order
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();
        abort_unless($order->canBeViewedWith($request->user(), $request->query('key', $request->input('key'))), 404);

        return $order;
    }
}
