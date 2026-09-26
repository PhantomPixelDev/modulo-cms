@component('mail::message')
# Your refund is on its way

We have refunded **{{ number_format($order->total, 2) }} {{ $order->currency }}** for order **{{ $order->order_number }}**.

@if (in_array($order->payment_method, ['stripe', 'paypal', 'mollie'], true))
It goes back to the way you paid and usually shows within 5–10 business days, depending on your bank.
@else
We will send it back to you directly.
@endif

Thanks,  
{{ config('app.name') }}
@endcomponent
