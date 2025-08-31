<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    @routes
    @viteReactRefresh
    @vite('resources/js/app.tsx')
    @inertiaHead

      @php
      // Pull active theme assets via ThemeManager so React themes can include their CSS/JS
      $themeAssets = app(\App\Services\ThemeManager::class)->getAssets();
    @endphp

    @if(isset($themeAssets['css']))
      @foreach($themeAssets['css'] as $css)
        <link rel="stylesheet" href="{{ $css }}" />
      @endforeach
    @endif
  </head>
  <body>
    @inertia

    @if(isset($themeAssets['js']))
      @foreach($themeAssets['js'] as $js)
        <script src="{{ $js }}" defer></script>
      @endforeach
    @endif
  </body>
</html>
