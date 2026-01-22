@component('mail::message')
# Thanks for your order, {{ $order->customer_name }}

We have received your order **{{ $order->order_number }}**. We'll notify you when it ships.

@component('mail::table')
| Product | Qty | Price | Subtotal |
|:--|--:|--:|--:|
@foreach ($order->items as $item)
| {{ $item->product_name }} | {{ $item->quantity }} | {{ number_format($item->price, 2) }} | {{ number_format($item->subtotal, 2) }} |
@endforeach
@endcomponent

**Subtotal:** {{ number_format($order->subtotal, 2) }}  
**Shipping:** {{ number_format($order->shipping, 2) }}  
**Tax:** {{ number_format($order->tax, 2) }}  
**Total:** {{ number_format($order->total, 2) }}

Thanks,  
{{ config('app.name') }}
@endcomponent
