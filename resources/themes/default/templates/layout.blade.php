<!DOCTYPE html>
<html lang="{{ $site_language ?? app()->getLocale() }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $page_title ?? ($title ?? config('app.name')) }} - {{ $site_name ?? config('app.name') }}</title>
    <meta name="description" content="{{ $meta_description ?? '' }}">
    
    <!-- Theme CSS -->
    @if (!empty($theme_css_url))
        <link rel="stylesheet" href="{{ $theme_css_url }}">
    @endif
    @if (!empty($theme_responsive_css_url))
        <link rel="stylesheet" href="{{ $theme_responsive_css_url }}">
    @endif
    
    <!-- Favicon -->
    @if (!empty($favicon_url))
        <link rel="icon" type="image/x-icon" href="{{ $favicon_url }}">
    @endif
    
    {!! $extra_head ?? '' !!}
</head>
<body class="{{ $body_classes ?? '' }}">
    <div id="page" class="site">
        {!! $header ?? '' !!}
        
        <main id="main" class="site-main">
            <div class="container">
                {!! $content ?? '' !!}
            </div>
        </main>
        
        {!! $footer ?? '' !!}
    </div>
    
    <!-- Theme JavaScript -->
    @if (!empty($theme_js_url))
        <script src="{{ $theme_js_url }}" defer></script>
    @endif
    {!! $extra_scripts ?? '' !!}
</body>
</html>
