<?php

namespace Plugins\ModuloShop\src\Services;

use App\Models\SiteSetting;
use App\Services\PostService;
use App\Support\ActivityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Plugins\ModuloShop\src\Mail\OrderPlacedAdmin;
use Plugins\ModuloShop\src\Mail\OrderPlacedCustomer;
use Plugins\ModuloShop\src\Mail\OrderRefundedCustomer;
use Plugins\ModuloShop\src\Models\Coupon;
use Plugins\ModuloShop\src\Models\GatewaySetting;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Models\OrderNote;
use Plugins\ModuloShop\src\Models\Payment;
use Plugins\ModuloShop\src\Payments\Gateways\BankTransferGateway;
use Plugins\ModuloShop\src\Payments\Gateways\CashOnDeliveryGateway;
use Plugins\ModuloShop\src\Payments\Gateways\MollieGateway;
use Plugins\ModuloShop\src\Payments\Gateways\PayPalGateway;
use Plugins\ModuloShop\src\Payments\Gateways\StripeGateway;
use Plugins\ModuloShop\src\Payments\Money;
use Plugins\ModuloShop\src\Payments\PaymentGateway;

/**
 * Payment methods and what happens to an order as it gets paid (or doesn't).
 *
 * Every outcome is recorded here so the rules hold whichever way it arrives
 * (customer returning, webhook, admin): the order row is locked, a result is
 * applied once, and the amount must match the order before it counts as paid.
 */
class PaymentService
{
    /** @var array<string, class-string<PaymentGateway>> */
    public const GATEWAYS = [
        'cod' => CashOnDeliveryGateway::class,
        'bank_transfer' => BankTransferGateway::class,
        'stripe' => StripeGateway::class,
        'paypal' => PayPalGateway::class,
        'mollie' => MollieGateway::class,
    ];

    /** Methods that work out of the box, as before gateways were configurable. */
    protected const ENABLED_BY_DEFAULT = ['cod', 'bank_transfer'];

    /** @var array<string, GatewaySetting>|null */
    protected ?array $settings = null;

    public function gateway(?string $id): ?PaymentGateway
    {
        $class = self::GATEWAYS[$id] ?? null;

        return $class ? new $class($this->setting((string) $id)->config ?? []) : null;
    }

    /** @return array<string, PaymentGateway> */
    public function all(): array
    {
        $gateways = [];
        foreach (array_keys(self::GATEWAYS) as $id) {
            $gateways[$id] = $this->gateway($id);
        }

        return array_filter($gateways);
    }

    public function isEnabled(string $id): bool
    {
        $setting = $this->setting($id);

        return $setting !== null ? $setting->enabled : in_array($id, self::ENABLED_BY_DEFAULT, true);
    }

    /** Switched on and able to take payments: what checkout offers. @return array<string, PaymentGateway> */
    public function available(): array
    {
        return array_filter($this->all(), fn (PaymentGateway $g) => $this->isEnabled($g->id()) && $g->isConfigured());
    }

    /**
     * Save a gateway's settings. Secret fields left empty keep their value,
     * so the admin screen never has to send a key back to the browser.
     *
     * @param  array<string, mixed>  $input
     */
    public function saveSettings(string $id, bool $enabled, array $input): void
    {
        $gateway = $this->gateway($id);
        abort_if($gateway === null, 404);

        $current = $this->setting($id)->config ?? [];
        $config = $current;

        foreach ($gateway->fields() as $field) {
            $key = $field['key'];
            if (! array_key_exists($key, $input)) {
                continue;
            }
            $value = is_string($input[$key]) ? trim($input[$key]) : $input[$key];
            if ($field['type'] === 'secret' && ($value === null || $value === '')) {
                continue;
            }
            $config[$key] = $value;
        }

        GatewaySetting::updateOrCreate(['gateway' => $id], ['enabled' => $enabled, 'config' => $config]);
        $this->settings = null;
    }

    public function forgetSecret(string $id, string $key): void
    {
        $setting = $this->setting($id);
        if ($setting) {
            $config = $setting->config ?? [];
            unset($config[$key]);
            $setting->update(['config' => $config]);
            $this->settings = null;
        }
    }

    /**
     * What the admin screen may see: no secret values, only whether one is set.
     *
     * @return list<array<string, mixed>>
     */
    public function adminSummary(): array
    {
        return array_values(array_map(function (PaymentGateway $gateway) {
            $config = $this->setting($gateway->id())->config ?? [];
            $values = [];
            foreach ($gateway->fields() as $field) {
                $values[$field['key']] = $field['type'] === 'secret'
                    ? ! empty($config[$field['key']])
                    : ($config[$field['key']] ?? null);
            }

            return [
                'id' => $gateway->id(),
                'label' => $gateway->label(),
                'online' => $gateway->isOnline(),
                'enabled' => $this->isEnabled($gateway->id()),
                'configured' => $gateway->isConfigured(),
                'fields' => $gateway->fields(),
                'values' => $values,
                'webhook_url' => $gateway->isOnline() ? route('shop.payment.webhook', ['gateway' => $gateway->id()]) : null,
            ];
        }, $this->all()));
    }

    /**
     * Send the customer to the provider's payment page.
     */
    public function start(Order $order, PaymentGateway $gateway): string
    {
        $params = ['gateway' => $gateway->id(), 'orderNumber' => $order->order_number, 'key' => $order->access_token];

        return $gateway->start(
            $order,
            route('shop.payment.return', $params),
            route('shop.payment.cancel', $params),
            route('shop.payment.webhook', ['gateway' => $gateway->id()]),
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function recordAttempt(Order $order, string $gateway, string $providerRef, array $data = []): Payment
    {
        return Payment::updateOrCreate(
            ['gateway' => $gateway, 'provider_ref' => $providerRef],
            ['order_id' => $order->id, 'status' => Payment::PENDING, 'amount' => (float) $order->total, 'currency' => $order->currency, 'data' => $data ?: null],
        );
    }

    public function attempt(Order $order, string $gateway, string $providerRef): ?Payment
    {
        return $providerRef === '' ? null : Payment::where('order_id', $order->id)->where('gateway', $gateway)->where('provider_ref', $providerRef)->first();
    }

    public function latestAttempt(Order $order, string $gateway): ?Payment
    {
        return Payment::where('order_id', $order->id)->where('gateway', $gateway)->latest('id')->first();
    }

    public function paidAttempt(Order $order, string $gateway): ?Payment
    {
        return Payment::where('order_id', $order->id)->where('gateway', $gateway)->where('status', Payment::PAID)->latest('id')->first();
    }

    /** A still-open attempt failed or was abandoned at the provider. */
    public function markAttempt(string $gateway, string $providerRef, string $status): void
    {
        if ($providerRef !== '') {
            Payment::where('gateway', $gateway)->where('provider_ref', $providerRef)->where('status', Payment::PENDING)->update(['status' => $status]);
        }
    }

    /**
     * The provider says this was paid. Returns true when that newly paid the order.
     *
     * @param  array<string, mixed>  $data
     */
    public function markPaid(Order $order, string $gateway, string $providerRef, float $amount, string $currency, array $data = []): bool
    {
        $newlyPaid = DB::transaction(function () use ($order, $gateway, $providerRef, $amount, $currency, $data) {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $payment = Payment::firstOrNew(['gateway' => $gateway, 'provider_ref' => $providerRef]);

            if ($payment->exists && $payment->order_id !== $locked->id) {
                Log::warning('Payment reference belongs to another order', ['gateway' => $gateway, 'ref' => $providerRef]);

                return false;
            }

            $payment->fill([
                'order_id' => $locked->id,
                'amount' => $amount,
                'currency' => strtoupper($currency),
                'data' => array_filter([...($payment->data ?? []), ...$data], fn ($v) => $v !== null) ?: null,
            ]);

            if (strtoupper($currency) !== strtoupper($locked->currency) || ! Money::covers($amount, (float) $locked->total, $locked->currency)) {
                // Never mark an order paid for less than it costs
                $payment->status = Payment::FAILED;
                $payment->save();
                $locked->addNote(sprintf('%s reported %s %s, which does not cover the order total; not marked as paid.', $gateway, number_format($amount, 2), strtoupper($currency)), OrderNote::PAYMENT);
                ActivityLog::record('shop.payment_mismatch', "Payment for order {$locked->order_number} did not match its total", $locked, [
                    'gateway' => $gateway, 'paid' => $amount, 'currency' => $currency, 'due' => (float) $locked->total,
                ]);

                return false;
            }

            $payment->status = Payment::PAID;
            $payment->save();

            if ($locked->payment_status === Order::PAYMENT_PAID) {
                return false;
            }

            $locked->payment_status = Order::PAYMENT_PAID;
            $locked->paid_at = now();
            $locked->transaction_id = $providerRef;
            $locked->payment_method = $gateway;

            if ($locked->status === Order::STATUS_PENDING) {
                $locked->status = Order::STATUS_PROCESSING;
            } elseif ($locked->status === Order::STATUS_CANCELLED) {
                // Paid after it expired: the stock is gone again, a person must decide
                ActivityLog::record('shop.paid_after_cancel', "Order {$locked->order_number} was paid after it had been cancelled; refund or restore it", $locked);
            }

            $locked->save();
            $locked->addNote(sprintf('Payment of %s %s received via %s (%s).', number_format($amount, 2), strtoupper($currency), $gateway, $providerRef), OrderNote::PAYMENT);

            return true;
        });

        if ($newlyPaid) {
            $order->refresh();
            ActivityLog::record('shop.order_paid', "Order {$order->order_number} paid via {$gateway}", $order);
            $this->sendPlacedEmails($order);
        }

        return $newlyPaid;
    }

    /**
     * Money went back to the customer (from the admin, or reported by the provider).
     */
    public function markRefunded(Order $order, string $note): void
    {
        $releasedStock = DB::transaction(function () use ($order, $note) {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($locked->payment_status === Order::PAYMENT_REFUNDED) {
                return false;
            }

            $releases = ! in_array($locked->status, [Order::STATUS_CANCELLED, Order::STATUS_REFUNDED], true);

            $locked->payment_status = Order::PAYMENT_REFUNDED;
            $locked->status = Order::STATUS_REFUNDED;
            $locked->save();

            Payment::where('order_id', $locked->id)->where('status', Payment::PAID)->update(['status' => Payment::REFUNDED]);

            if ($releases) {
                app(StockService::class)->release($locked);
            }

            $locked->addNote(ucfirst($note).'.', OrderNote::PAYMENT, auth()->id());

            return ['releases' => $releases];
        });

        if ($releasedStock === false) {
            return; // already refunded
        }
        $releasedStock = $releasedStock['releases'];

        $order->refresh();
        ActivityLog::record('shop.order_refunded', "Order {$order->order_number}: {$note}", $order);

        if ($order->customer_email) {
            try {
                Mail::to($order->customer_email)->send(new OrderRefundedCustomer($order));
            } catch (\Throwable $e) {
                logger()->error('Failed to send order refunded email: '.$e->getMessage());
            }
        }

        if ($releasedStock) {
            app(PostService::class)->flushCache();
        }
    }

    /**
     * Give an unpaid order up: stock and the coupon use go back.
     */
    public function cancelUnpaid(Order $order, string $reason): bool
    {
        $cancelled = DB::transaction(function () use ($order) {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($locked->payment_status === Order::PAYMENT_PAID || $locked->status !== Order::STATUS_PENDING) {
                return false;
            }

            $locked->status = Order::STATUS_CANCELLED;
            $locked->payment_status = Order::PAYMENT_FAILED;
            $locked->save();

            Payment::where('order_id', $locked->id)->where('status', Payment::PENDING)->update(['status' => Payment::CANCELLED]);
            app(StockService::class)->release($locked);

            if ($locked->coupon_code) {
                Coupon::where('code', $locked->coupon_code)->where('used_count', '>', 0)->decrement('used_count');
            }

            return true;
        });

        if ($cancelled) {
            $order->addNote("Cancelled: {$reason}. Stock returned.", OrderNote::SYSTEM);
        }

        if ($cancelled) {
            $order->refresh();
            ActivityLog::record('shop.order_expired', "Order {$order->order_number} cancelled: {$reason}", $order);
            app(PostService::class)->flushCache();
        }

        return $cancelled;
    }

    /**
     * Cancel online-payment orders nobody paid for within the time limit.
     */
    public function expireUnpaid(int $minutes): int
    {
        $online = array_keys(array_filter($this->all(), fn (PaymentGateway $g) => $g->isOnline()));

        $count = 0;
        Order::query()
            ->where('status', Order::STATUS_PENDING)
            ->where('payment_status', Order::PAYMENT_PENDING)
            ->whereIn('payment_method', $online)
            ->where('created_at', '<', now()->subMinutes($minutes))
            ->each(function (Order $order) use (&$count) {
                $count += $this->cancelUnpaid($order, 'not paid in time') ? 1 : 0;
            });

        return $count;
    }

    /**
     * Order confirmation emails, sent once: at checkout for offline methods,
     * when the payment arrives for online ones.
     */
    public function sendPlacedEmails(Order $order): void
    {
        $sent = DB::transaction(function () use ($order) {
            $locked = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $meta = $locked->meta_data ?? [];
            if (! empty($meta['placed_emails_sent'])) {
                return true;
            }
            $locked->meta_data = [...$meta, 'placed_emails_sent' => true];
            $locked->save();

            return false;
        });

        if ($sent) {
            return;
        }

        $order->loadMissing('items');

        if ($order->customer_email) {
            try {
                Mail::to($order->customer_email)->send(new OrderPlacedCustomer($order));
            } catch (\Throwable $e) {
                logger()->error('Failed to send order placed customer email: '.$e->getMessage());
            }
        }

        $adminEmail = SiteSetting::get('admin_email', config('mail.admin_address')) ?: config('mail.admin_address');

        if ($adminEmail) {
            try {
                Mail::to($adminEmail)->send(new OrderPlacedAdmin($order));
            } catch (\Throwable $e) {
                logger()->error('Failed to send order placed admin email: '.$e->getMessage());
            }
        }
    }

    protected function setting(string $id): ?GatewaySetting
    {
        if ($this->settings === null) {
            $this->settings = schema_has_table('shop_gateway_settings')
                ? GatewaySetting::all()->keyBy('gateway')->all()
                : [];
        }

        return $this->settings[$id] ?? null;
    }
}
