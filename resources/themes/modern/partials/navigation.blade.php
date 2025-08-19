<nav class="nav main-nav">
    @if(!empty($navigation_menu))
        {!! $navigation_menu !!}
    @else
        <?php
            try {
                /** @var \App\Services\MenuService $ms */
                $ms = app(\App\Services\MenuService::class);
                $runtimeNav = $ms->renderMenuHtml($ms->getMenuBySlug('main-navigation'), ['class' => 'flex gap-4']);
            } catch (\Throwable $e) { $runtimeNav = ''; }
        ?>
        @if(!empty($runtimeNav))
            {!! $runtimeNav !!}
        @else
            <ul class="flex gap-4">
                <li><a href="/">Home</a></li>
                <li><a href="/posts">Posts</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
            </ul>
        @endif
    @endif
</nav>
