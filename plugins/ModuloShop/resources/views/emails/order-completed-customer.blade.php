@component('mail::message')
# Order completed

Order **{{ $order->order_number }}** is marked as completed. Thanks for shopping with us!

If anything looks wrong, reply to this email and we’ll help.

Thanks,  
{{ config('app.name') }}
@endcomponent
