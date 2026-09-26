{{-- Every email carries the site's own name and logo (Site settings), not the app's --}}
@php
    $siteName = app(\App\Services\SiteSettingsService::class)->siteName();
    $logo = (string) \App\Models\SiteSetting::get('site_logo', '');
    $logoUrl = $logo === '' ? null : (preg_match('#^https?://#i', $logo) ? $logo : url($logo));
@endphp
<x-mail::layout>
{{-- Header --}}
<x-slot:header>
<x-mail::header :url="config('app.url')">
@if ($logoUrl)
<img src="{{ $logoUrl }}" alt="{{ $siteName }}" style="max-height: 48px; max-width: 220px; height: auto;">
@else
{{ $siteName }}
@endif
</x-mail::header>
</x-slot:header>

{{-- Body --}}
{!! $slot !!}

{{-- Subcopy --}}
@isset($subcopy)
<x-slot:subcopy>
<x-mail::subcopy>
{!! $subcopy !!}
</x-mail::subcopy>
</x-slot:subcopy>
@endisset

{{-- Footer --}}
<x-slot:footer>
<x-mail::footer>
© {{ date('Y') }} {{ $siteName }}. {{ __('All rights reserved.') }}
</x-mail::footer>
</x-slot:footer>
</x-mail::layout>
