@component('mail::message')
# New order received

A new order **{{ $order->order_number }}** has been placed.

**Customer:** {{ $order->customer_name }}  
**Email:** {{ $order->customer_email }}  
**Total:** {{ number_format($order->total, 2) }} {{ $order->currency }}
@if ($order->shipping_method)
**Shipping:** {{ $order->shipping_method }} ({{ number_format($order->shipping, 2) }})
@endif
@if ($order->coupon_code)
**Coupon:** {{ $order->coupon_code }} (-{{ number_format($order->discount, 2) }})
@endif

@component('mail::table')
| Product | Qty | Price | Subtotal |
|:--|--:|--:|--:|
@foreach ($order->items as $item)
| {{ $item->product_name }} | {{ $item->quantity }} | {{ number_format($item->price, 2) }} | {{ number_format($item->subtotal, 2) }} |
@endforeach
@endcomponent

@endcomponent
