<footer id="colophon" class="site-footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section footer-about">
                <h3>{{ $site_name ?? config('app.name') }}</h3>
                <p>{{ $site_description ?? '' }}</p>
                
                @if (!empty($social_links))
                    <div class="social-links">
                        {!! $social_menu ?? '' !!}
                    </div>
                @endif
            </div>
            
            <div class="footer-section footer-links">
                <h3>Quick Links</h3>
                {!! $footer_menu ?? '' !!}
            </div>
            
            <div class="footer-section footer-contact">
                <h3>Contact Info</h3>
                @if (!empty($contact_email))
                    <p>Email: <a href="mailto:{{ $contact_email }}">{{ $contact_email }}</a></p>
                @endif
                @if (!empty($contact_phone))
                    <p>Phone: {{ $contact_phone }}</p>
                @endif
                @if (!empty($contact_address))
                    <p>Address: {{ $contact_address }}</p>
                @endif
            </div>
            
            <div class="footer-section footer-newsletter">
                <h3>Newsletter</h3>
                <p>Stay updated with our latest news and updates.</p>
                <form class="newsletter-form" action="{{ $newsletter_url ?? '#' }}" method="post">
                    <input type="email" name="email" placeholder="Your email address" required>
                    <button type="submit" class="btn btn-secondary">Subscribe</button>
                </form>
            </div>
        </div>
        
        <div class="footer-bottom">
            <div class="footer-info">
                <p>&copy; {{ $current_year ?? date('Y') }} {{ $site_name ?? config('app.name') }}. All rights reserved.</p>
                @if (!empty($privacy_policy_url))
                    <a href="{{ $privacy_policy_url }}">Privacy Policy</a>
                @endif
                @if (!empty($terms_url))
                    <a href="{{ $terms_url }}">Terms of Service</a>
                @endif
            </div>
            
            <div class="footer-credits">
                <p>Powered by <a href="https://github.com/PhantomPixelDev/modulo-cms">Modulo CMS</a></p>
            </div>
        </div>
    </div>
    
    <a href="#top" class="back-to-top" aria-label="Back to top">↑</a>
</footer>
