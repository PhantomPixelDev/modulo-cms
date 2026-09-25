<?php

namespace App\Providers;

use App\Listeners\RecordActivity;
use App\Models\Post;
use App\Models\PostTranslation;
use App\Models\User;
use App\Observers\PostObserver;
use App\Services\AdminStatsService;
use App\Services\HookRegistry;
use App\Services\MenuService;
use App\Services\PostService;
use App\Services\ShortcodeService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Plugin action/filter hooks (add_action, apply_filters, ...)
        $this->app->singleton(HookRegistry::class);

        // One registry every plugin adds its shortcodes to. Owned by core so a
        // plugin re-binding it cannot wipe out another plugin's shortcodes.
        $this->app->singleton(ShortcodeService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Every password rule in the app uses Password::defaults(). Production
        // asks for a real password; elsewhere (tests, local) the framework's
        // 8-character minimum keeps fixtures simple.
        Password::defaults(function () {
            if (! $this->app->isProduction()) {
                return Password::min(8);
            }

            $rule = Password::min(max(8, (int) config('security.password_min_length')))->letters()->numbers();

            return config('security.password_uncompromised') ? $rule->uncompromised() : $rule;
        });

        // Audit trail: sign-ins and changes to content, users, roles, extensions
        Event::subscribe(RecordActivity::class);

        // Register PostObserver
        Post::observe(PostObserver::class);

        // Translations are cached together with their post
        PostTranslation::saved(fn () => app(PostService::class)->flushCache());
        PostTranslation::deleted(fn () => app(PostService::class)->flushCache());

        // Bust adminStats cache when user count changes
        User::created(fn () => app(AdminStatsService::class)->forget());
        User::deleted(fn () => app(AdminStatsService::class)->forget());

        // Register a Blade namespace for themes so templates can use 'themes::modern.*'
        View::addNamespace('themes', resource_path('themes'));

        // Share commonly-used menus with Inertia (header/footer)
        Inertia::share('menus', function () {
            try {
                /** @var MenuService $ms */
                $ms = app(MenuService::class);

                return [
                    'header' => $ms->menuArrayBySlug('main-navigation') ?: $ms->menuArrayByLocation('header'),
                    'footer' => $ms->menuArrayBySlug('footer-links') ?: $ms->menuArrayByLocation('footer'),
                ];
            } catch (\Throwable $e) {
                return [
                    'header' => [],
                    'footer' => [],
                ];
            }
        });

        // Define global rate limiters used by routes
        RateLimiter::for('api', function (Request $request) {
            $key = optional($request->user())->id ? 'user:'.$request->user()->id : 'ip:'.$request->ip();

            return [
                Limit::perMinute(60)->by($key),
            ];
        });

        // Stricter limits for auth-related endpoints to mitigate brute force
        RateLimiter::for('auth', function (Request $request) {
            $key = strtolower((string) $request->input('email')).'|'.$request->ip();

            return [
                Limit::perMinute(10)->by($key),
                Limit::perMinute(30)->by($request->ip()),
            ];
        });

        $this->app->booted(function () {
            if (function_exists('do_action')) {
                do_action('cms_booted');
            }
        });
    }
}
