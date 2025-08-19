<header class="site-header">
    <div class="container flex items-center justify-between py-4">
        <a class="brand" href="/">{{ config('app.name') }}</a>
        @includeIf('themes::modern.partials.navigation')
    </div>
</header>
