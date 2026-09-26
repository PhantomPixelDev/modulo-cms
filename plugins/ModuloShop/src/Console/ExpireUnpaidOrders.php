<?php

namespace Plugins\ModuloShop\src\Console;

use Illuminate\Console\Command;
use Plugins\ModuloShop\src\Services\ModuloShopSettings;
use Plugins\ModuloShop\src\Services\PaymentService;

/**
 * An online order holds its stock (and coupon use) while the customer is on
 * the provider's page. Orders abandoned there are cancelled after a while so
 * the stock is sold to someone else.
 */
class ExpireUnpaidOrders extends Command
{
    protected $signature = 'shop:expire-unpaid {--minutes= : Age after which an unpaid online order is cancelled}';

    protected $description = 'Cancel online-payment orders that were never paid, returning their stock';

    public function handle(PaymentService $payments, ModuloShopSettings $settings): int
    {
        $minutes = (int) ($this->option('minutes') ?: $settings->get('unpaid_order_minutes', 120));
        $count = $payments->expireUnpaid(max(15, $minutes));

        $this->info("Cancelled {$count} unpaid order(s).");

        return self::SUCCESS;
    }
}
