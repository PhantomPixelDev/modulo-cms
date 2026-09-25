<?php

namespace Plugins\ModuloShop\src\Payments\Gateways;

class CashOnDeliveryGateway extends OfflineGateway
{
    public function id(): string
    {
        return 'cod';
    }

    public function label(): string
    {
        return $this->setting('title', 'Cash on Delivery');
    }

    public function description(): string
    {
        return $this->setting('description', 'Pay when you receive your order');
    }

    public function fields(): array
    {
        return [
            ['key' => 'title', 'label' => 'Title at checkout', 'type' => 'text'],
            ['key' => 'description', 'label' => 'Description at checkout', 'type' => 'text'],
        ];
    }
}
