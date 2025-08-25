<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark">
    <title>{{ $meta_title ?? $title ?? config('app.name') }}</title>
    @if(!empty($meta_description))
      <meta name="description" content="{{ $meta_description }}" />
    @endif
    @if(!empty($canonical_url))
      <link rel="canonical" href="{{ $canonical_url }}" />
    @endif
    {{-- OpenGraph --}}
    @if(!empty($og_title))
      <meta property="og:title" content="{{ $og_title }}" />
    @endif
    @if(!empty($og_description))
      <meta property="og:description" content="{{ $og_description }}" />
    @endif
    @if(!empty($og_type))
      <meta property="og:type" content="{{ $og_type }}" />
    @endif
    @if(!empty($og_url))
      <meta property="og:url" content="{{ $og_url }}" />
    @endif
    @if(!empty($og_site_name))
      <meta property="og:site_name" content="{{ $og_site_name }}" />
    @endif
    @if(!empty($og_image))
      <meta property="og:image" content="{{ $og_image }}" />
    @endif
    {{-- Twitter Cards --}}
    @if(!empty($twitter_card))
      <meta name="twitter:card" content="{{ $twitter_card }}" />
    @endif
    @if(!empty($twitter_title))
      <meta name="twitter:title" content="{{ $twitter_title }}" />
    @endif
    @if(!empty($twitter_description))
      <meta name="twitter:description" content="{{ $twitter_description }}" />
    @endif
    @if(!empty($twitter_image))
      <meta name="twitter:image" content="{{ $twitter_image }}" />
    @endif
    <script>
      // Apply theme ASAP to avoid flash of incorrect theme
      (function() {
        try {
          var stored = localStorage.getItem('theme');
          var theme = stored || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          document.documentElement.setAttribute('data-theme', theme);
        } catch (e) {
          // no-op
        }
      })();
    </script>
    @if(isset($assets['css']))
        @foreach($assets['css'] as $css)
            <link rel="stylesheet" href="{{ $css }}" />
        @endforeach
    @endif
</head>
<body class="flexia-theme {{ $body_classes ?? '' }}">
    <a class="skip-link" href="#main">Skip to content</a>

    @includeIf('themes::flexia.templates.header')

    <main id="main" class="container p-6" role="main">
        @if(View::hasSection('content'))
            @yield('content')
        @elseif(isset($content) && $content !== '')
            {!! $content !!}
        @elseif(isset($post))
            @includeIf('themes::flexia.templates.post')
        @endif
    </main>

    @includeIf('themes::flexia.partials.footer')

    @if(isset($assets['js']))
        @foreach($assets['js'] as $js)
            <script src="{{ $js }}" defer></script>
        @endforeach
    @endif
</body>
</html>
