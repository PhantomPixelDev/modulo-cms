<?php

namespace Plugins\ModuloShop\src\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Plugins\ModuloShop\src\Models\Order;

class OrderPlacedCustomer extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function build(): self
    {
        return $this->subject('Order received: '.$this->order->order_number)
            ->markdown('modulo-shop::emails.order-placed-customer', [
                'order' => $this->order,
            ]);
    }
}
