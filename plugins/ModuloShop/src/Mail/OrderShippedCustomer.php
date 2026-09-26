<?php

namespace Plugins\ModuloShop\src\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Plugins\ModuloShop\src\Models\Order;

class OrderShippedCustomer extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function build(): self
    {
        return $this->subject('Order shipped: '.$this->order->order_number)
            ->markdown('modulo-shop::emails.order-shipped-customer', [
                'order' => $this->order,
            ]);
    }
}
