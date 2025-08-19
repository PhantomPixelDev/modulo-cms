<footer class="site-footer">
    <div class="container py-8 text-sm text-gray-600">
        <div class="mb-3 text-center">
       
            @if(!empty($footer_links))
                {!! $footer_links !!}
            @else
                <?php
                    try {
                        /** @var \App\Services\MenuService $ms */
                        $ms = app(\App\Services\MenuService::class);
                        // Prefer slug-based lookup to avoid any mismatch on location
                        $runtimeFooter = $ms->renderMenuHtml($ms->getMenuBySlug('footer-links'), ['class' => $footerMenuClass]);
                    } catch (\Throwable $e) { $runtimeFooter = ''; }
                ?>
                @if(!empty($runtimeFooter))
                    {!! $runtimeFooter !!}
                @else
                    <ul class="flex gap-4 justify-center">
                        <li><a href="/about">About</a></li>
                        <li><a href="/contact">Contact</a></li>
                        <li><a href="/privacy">Privacy</a></li>
                    </ul>
                @endif
            @endif
        </div>
        <p class="text-center">&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
    </div>
</footer>
