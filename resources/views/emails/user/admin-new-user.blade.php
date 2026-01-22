@component('mail::message')
# New user registration

A new user has registered on {{ config('app.name') }}.

**Name:** {{ $user->name }}  
**Email:** {{ $user->email }}

@endcomponent
