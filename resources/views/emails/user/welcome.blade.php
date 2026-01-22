@component('mail::message')
# Welcome to {{ config('app.name') }}

Hi {{ $user->name }},

Your account is ready. You can now sign in and start using the site.

Thanks,  
{{ config('app.name') }}
@endcomponent
