<?php

namespace Plugins\ModuloShop\src\Payments\Gateways;

class BankTransferGateway extends OfflineGateway
{
    public function id(): string
    {
        return 'bank_transfer';
    }

    public function label(): string
    {
        return $this->setting('title', 'Bank Transfer');
    }

    public function description(): string
    {
        return $this->setting('description', 'Pay directly into our bank account; we ship once it arrives');
    }

    /** Shown on the order confirmation until the order is paid. */
    public function instructions(): ?string
    {
        return $this->setting('instructions');
    }

    public function fields(): array
    {
        return [
            ['key' => 'title', 'label' => 'Title at checkout', 'type' => 'text'],
            ['key' => 'description', 'label' => 'Description at checkout', 'type' => 'text'],
            [
                'key' => 'instructions',
                'label' => 'Payment instructions',
                'type' => 'textarea',
                'help' => 'Account holder, IBAN/account number, bank. Customers see this after ordering and should use their order number as the reference.',
            ],
        ];
    }
}
