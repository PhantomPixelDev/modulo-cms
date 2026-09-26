@component('mail::message')
# New user registration

A new user has registered on {{ app(\App\Services\SiteSettingsService::class)->siteName() }}.

**Name:** {{ $user->name }}  
**Email:** {{ $user->email }}

@endcomponent
