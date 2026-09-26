<?php

namespace Plugins\ModuloShop\src\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Plugins\ModuloShop\src\Models\Order;

class OrderNoteCustomer extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order, public string $note) {}

    public function build(): self
    {
        return $this->subject('Update on order '.$this->order->order_number)
            ->markdown('emails.shop.order-note-customer', [
                'order' => $this->order,
                'note' => $this->note,
            ]);
    }
}
