@component('mail::message')
# Welcome to {{ app(\App\Services\SiteSettingsService::class)->siteName() }}

Hi {{ $user->name }},

Your account is ready. You can now sign in and start using the site.

Thanks,  
{{ app(\App\Services\SiteSettingsService::class)->siteName() }}
@endcomponent
