<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark">
    <title>{{ $title ?? config('app.name') }}</title>
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
