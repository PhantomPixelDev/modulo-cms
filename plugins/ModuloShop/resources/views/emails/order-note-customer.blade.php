@component('mail::message')
# An update on your order

A note about order **{{ $order->order_number }}**:

@component('mail::panel')
{{ $note }}
@endcomponent

@component('mail::button', ['url' => $order->confirmationUrl()])
View your order
@endcomponent

Thanks,  
{{ config('app.name') }}
@endcomponent
