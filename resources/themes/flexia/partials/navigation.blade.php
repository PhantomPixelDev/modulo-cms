<nav class="site-nav" aria-label="Primary">
    <button class="nav-toggle" data-nav-toggle aria-expanded="false" aria-controls="primary-menu">Menu</button>
    @if(!empty($navigation_menu))
        {!! $navigation_menu !!}
    @endif
    
    {{-- Auth-aware actions --}}
    @auth
        <div class="auth-actions">
            <a href="{{ route('dashboard') }}" class="btn-dashboard">Dashboard</a>
            <form method="POST" action="{{ route('logout') }}" class="inline">
                @csrf
                <button type="submit" class="btn-logout">Logout</button>
            </form>
        </div>
    @else
        <div class="auth-actions">
            <a href="{{ route('login') }}" class="btn-login">Login</a>
            @if (Route::has('register'))
                <a href="{{ route('register') }}" class="btn btn-sm btn-primary">Register</a>
            @endif
        </div>
    @endauth
    <button class="theme-toggle" data-theme-toggle aria-label="Toggle color theme" title="Toggle color theme">
        <span data-theme-icon>🌙</span>
    </button>
</nav>
