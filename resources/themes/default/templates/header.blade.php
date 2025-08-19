<header id="masthead" class="site-header">
    <div class="container">
        <div class="header-content">
            <div class="site-branding">
                @if (!empty($has_logo))
                    <a href="{{ $home_url ?? '/' }}" class="site-logo">
                        <img src="{{ $logo_url ?? '' }}" alt="{{ $site_name ?? config('app.name') }}" />
                    </a>
                @else
                    <h1 class="site-title">
                        <a href="{{ $home_url ?? '/' }}" class="site-logo">{{ $site_name ?? config('app.name') }}</a>
                    </h1>
                @endif
                
                @if (!empty($site_tagline))
                    <p class="site-description">{{ $site_tagline }}</p>
                @endif
            </div>
            
            <nav id="site-navigation" class="main-navigation">
                <button class="mobile-menu-toggle" aria-expanded="false" aria-controls="primary-menu">
                    <span class="menu-toggle-text">Menu</span>
                    <span class="menu-icon">☰</span>
                </button>
                
                {!! $primary_menu ?? '' !!}
            </nav>
            
            <div class="header-tools">
                <form class="search-form" action="{{ $search_url ?? '/search' }}" method="get">
                    <input type="search" class="search-input" name="s" placeholder="Search..." value="{{ $search_query ?? '' }}">
                    <button type="submit" class="search-submit">
                        <span class="search-icon">🔍</span>
                    </button>
                </form>
                
                @if (!empty($user_logged_in))
                    <div class="user-menu">
                        <a href="{{ $dashboard_url ?? '/dashboard' }}" class="user-link">Dashboard</a>
                        <a href="{{ $logout_url ?? '/logout' }}" class="logout-link">Logout</a>
                    </div>
                @else
                    <div class="auth-links">
                        <a href="{{ $login_url ?? '/login' }}" class="login-link">Login</a>
                        <a href="{{ $register_url ?? '/register' }}" class="register-link">Register</a>
                    </div>
                @endif
            </div>
        </div>
    </div>
</header>
