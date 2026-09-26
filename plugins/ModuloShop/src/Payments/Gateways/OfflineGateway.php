<?php

namespace Plugins\ModuloShop\src\Payments\Gateways;

use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Payments\PaymentException;

abstract class OfflineGateway extends AbstractGateway
{
    public function isOnline(): bool
    {
        return false;
    }

    public function isConfigured(): bool
    {
        return true;
    }

    public function start(Order $order, string $returnUrl, string $cancelUrl, string $webhookUrl): string
    {
        throw new PaymentException("{$this->label()} has no online payment step.");
    }
}
