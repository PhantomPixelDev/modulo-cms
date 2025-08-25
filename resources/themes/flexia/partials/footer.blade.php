<footer class="site-footer" role="contentinfo">
    <div class="container footer-inner">
        <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        <nav aria-label="Footer">
            @if(empty($footer_links))
                @php throw new \RuntimeException("Flexia: footer_links is missing in footer partial"); @endphp
            @endif
            {!! $footer_links !!}
        </nav>
    </div>
</footer>
