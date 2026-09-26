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
        $titleSuffix = $siteSettings['seo']['meta_title_suffix'] ?? '';
        $favicon = $siteSettings['site_favicon'] ?? null;
    @endphp

    @if($googleVerify)
    <meta name="google-site-verification" content="{{ $googleVerify }}" />
    @endif
    @if($bingVerify)
    <meta name="msvalidate.01" content="{{ $bingVerify }}" />
    @endif
    @if($favicon)
    <link rel="icon" href="{{ $favicon }}">
    <link rel="apple-touch-icon" href="{{ $favicon }}">
    @endif

    @if($gtmId)
    <!-- Google Tag Manager -->
    <script nonce="{{ Vite::cspNonce() }}">(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','{{ $gtmId }}');</script>
    <!-- End Google Tag Manager -->
    @endif

    @if($gaId)
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id={{ $gaId }}" nonce="{{ Vite::cspNonce() }}"></script>
    <script nonce="{{ Vite::cspNonce() }}">
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '{{ $gaId }}');
    </script>
    @endif

    @isset($pageMeta)
    {{-- Public pages: the tags the theme sets in the browser, for crawlers and link previews.
         `inertia` marks them for the theme to replace on load. --}}
    <title inertia>{{ $pageMeta['title'] }}</title>
    @if($pageMeta['description'])
    <meta inertia name="description" content="{{ $pageMeta['description'] }}">
    @endif
    <meta inertia name="robots" content="{{ $pageMeta['robots'] }}">
    <link inertia rel="canonical" href="{{ $pageMeta['canonical'] }}">
    <meta inertia property="og:title" content="{{ $pageMeta['title'] }}">
    @if($pageMeta['description'])
    <meta inertia property="og:description" content="{{ $pageMeta['description'] }}">
    <meta inertia name="twitter:description" content="{{ $pageMeta['description'] }}">
    @endif
    <meta inertia property="og:url" content="{{ $pageMeta['canonical'] }}">
    <meta inertia property="og:site_name" content="{{ $pageMeta['site'] }}">
    <meta inertia property="og:type" content="{{ $pageMeta['type'] }}">
    @if($pageMeta['image'])
    <meta inertia property="og:image" content="{{ $pageMeta['image'] }}">
    <meta inertia name="twitter:image" content="{{ $pageMeta['image'] }}">
    @endif
    @if($pageMeta['published'])
    <meta inertia property="article:published_time" content="{{ $pageMeta['published'] }}">
    @endif
    <meta inertia name="twitter:card" content="{{ $pageMeta['image'] ? 'summary_large_image' : 'summary' }}">
    <meta inertia name="twitter:title" content="{{ $pageMeta['title'] }}">
    @foreach($pageMeta['json_ld'] as $schema)
    <script inertia type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) !!}</script>
    @endforeach
    @else
    <title inertia>{{ config('app.name', 'Laravel') }}</title>
    @endisset

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

    <!-- Scripts -->
    {{-- Plugin bundles import react, react-dom, react/jsx-runtime and
         @inertiajs/react as bare specifiers; these shims hand them the core's
         own instances (window.Modulo.vendor). Must precede every module script. --}}
    <script type="importmap" nonce="{{ Vite::cspNonce() }}">
    {"imports": {
        "react": "{{ asset('modulo-sdk/react.js') }}",
        "react-dom": "{{ asset('modulo-sdk/react-dom.js') }}",
        "react/jsx-runtime": "{{ asset('modulo-sdk/react-jsx-runtime.js') }}",
        "@inertiajs/react": "{{ asset('modulo-sdk/inertia-react.js') }}"
    }}
    </script>
    @routes(null, Vite::cspNonce())
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
