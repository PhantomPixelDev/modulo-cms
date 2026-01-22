<?php

namespace Plugins\ModuloShop\src\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Plugins\ModuloShop\src\Models\Order;

class OrderCompletedCustomer extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order)
    {
    }

    public function build(): self
    {
        return $this->subject('Order completed: ' . $this->order->order_number)
            ->markdown('emails.shop.order-completed-customer', [
                'order' => $this->order,
            ]);
    }
}
