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
      // Pull active theme assets via the same mechanism TemplateRenderingService uses
      $themeAssets = app(\App\Services\ThemeManager::class)->getAssets();
      // Build header/footer variables expected by theme partials
      $menuService = app(\App\Services\MenuService::class);
      // Header navigation (optional)
      try {
        $primaryMenu = $menuService->getMenuByLocation('primary');
        $navigation_menu = $menuService->renderMenuHtml($primaryMenu, [
          'id' => 'primary-menu',
          'class' => 'menu',
          'wrap' => false,
        ]);
      } catch (\Throwable $e) {
        $navigation_menu = '';
      }
      // Footer links (required by footer partial)
      try {
        $footerMenu = $menuService->getMenuByLocation('footer');
        $footer_links = $menuService->renderMenuHtml($footerMenu, [
          'class' => 'menu',
          'wrap' => false,
        ]);
      } catch (\Throwable $e) {
        $footer_links = '';
      }
    @endphp

    @if(isset($themeAssets['css']))
      @foreach($themeAssets['css'] as $css)
        <link rel="stylesheet" href="{{ $css }}" />
      @endforeach
    @endif
  </head>
  <body class="flexia-theme">
    @includeIf('themes::flexia.templates.header')

    <main id="main" class="container p-6" role="main">
      @inertia
    </main>

    @includeIf('themes::flexia.partials.footer')

    @if(isset($themeAssets['js']))
      @foreach($themeAssets['js'] as $js)
        <script src="{{ $js }}" defer></script>
      @endforeach
    @endif
  </body>
</html>
