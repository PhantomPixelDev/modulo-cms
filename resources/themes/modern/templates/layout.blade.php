<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ $title ?? config('app.name') }}</title>
    @if(isset($assets['css']))
        @foreach($assets['css'] as $css)
            <link rel="stylesheet" href="{{ $css }}" />
        @endforeach
    @endif
</head>
<body class="modern-theme dark-theme">
    @includeIf('themes::modern.templates.header')

    <main class="container">
        <p style="color: red;">MODERN THEME LOADED</p>
        @if(isset($post))
            @includeIf('themes::modern.templates.post')
        @elseif(isset($content) && $content !== '')
            {!! $content !!}
        @else
            @yield('content')
        @endif
    </main>

    @includeIf('themes::modern.partials.footer')

    @if(isset($assets['js']))
        @foreach($assets['js'] as $js)
            <script src="{{ $js }}" defer></script>
        @endforeach
    @endif
</body>
</html>
