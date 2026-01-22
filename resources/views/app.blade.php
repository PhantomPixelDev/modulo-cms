<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @php
        $siteSettings = $page['props']['settings'] ?? [];
        $gaId = $siteSettings['analytics']['google_analytics_id'] ?? null;
        $gtmId = $siteSettings['analytics']['gtm_container_id'] ?? null;
        $googleVerify = $siteSettings['seo']['google_site_verification'] ?? null;
        $bingVerify = $siteSettings['seo']['bing_site_verification'] ?? null;
        $metaDescription = $siteSettings['seo']['meta_description'] ?? null;
        $titleSuffix = $siteSettings['seo']['meta_title_suffix'] ?? '';
    @endphp

    @if($googleVerify)
    <meta name="google-site-verification" content="{{ $googleVerify }}" />
    @endif
    @if($bingVerify)
    <meta name="msvalidate.01" content="{{ $bingVerify }}" />
    @endif
    @if($metaDescription)
    <meta name="description" content="{{ $metaDescription }}" />
    @endif

    @if($gtmId)
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','{{ $gtmId }}');</script>
    <!-- End Google Tag Manager -->
    @endif

    @if($gaId)
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag.js?id={{ $gaId }}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '{{ $gaId }}');
    </script>
    @endif

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    @routes
    @php
        $hasViteAssets = file_exists(public_path('hot')) || file_exists(public_path('build/manifest.json'));
    @endphp

    @if (!app()->runningInConsole() && ($hasViteAssets || app()->environment('production')))
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @endif
    @inertiaHead
</head>
<body class="font-sans antialiased">
    @inertia
</body>
</html>
