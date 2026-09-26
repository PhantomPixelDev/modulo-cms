<?php

namespace Plugins\ModuloShop\src\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Plugins\ModuloShop\src\Models\Order;

class OrderRefundedCustomer extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function build(): self
    {
        return $this->subject('Refund for order '.$this->order->order_number)
            ->markdown('emails.shop.order-refunded-customer', [
                'order' => $this->order,
            ]);
    }
}
