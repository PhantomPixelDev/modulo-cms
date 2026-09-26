@component('mail::message')
# Your order was cancelled

Order **{{ $order->order_number }}** has been cancelled.

@if ($order->payment_status === 'paid')
You paid for this order; we will refund {{ number_format($order->total, 2) }} {{ $order->currency }} and email you when it is done.
@else
Nothing has been charged.
@endif

If this is unexpected, reply to this email.

Thanks,  
{{ config('app.name') }}
@endcomponent
