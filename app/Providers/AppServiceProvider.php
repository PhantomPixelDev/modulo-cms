<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use App\Services\MenuService;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
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
            $key = optional($request->user())->id ? 'user:' . $request->user()->id : 'ip:' . $request->ip();
            return [
                Limit::perMinute(60)->by($key),
            ];
        });

        // Stricter limits for auth-related endpoints to mitigate brute force
        RateLimiter::for('auth', function (Request $request) {
            $key = strtolower((string) $request->input('email')) . '|' . $request->ip();
            return [
                Limit::perMinute(10)->by($key),
                Limit::perMinute(30)->by($request->ip()),
            ];
        });
    }
}
