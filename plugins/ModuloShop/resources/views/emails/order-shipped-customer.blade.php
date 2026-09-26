@component('mail::message')
# Your order has shipped

Order **{{ $order->order_number }}** is on the way.

@if ($order->tracking_number)
**Tracking number:** {{ $order->tracking_number }}
@endif

If you have any questions, reply to this email.

Thanks,  
{{ config('app.name') }}
@endcomponent
