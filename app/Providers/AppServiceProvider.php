<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;
use App\Models\Post;
use App\Models\User;
use App\Observers\PostObserver;
use App\Services\AdminStatsService;
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
        // Register PostObserver
        Post::observe(PostObserver::class);

        // Bust adminStats cache when user count changes
        User::created(fn () => app(AdminStatsService::class)->forget());
        User::deleted(fn () => app(AdminStatsService::class)->forget());

        // Register a Blade namespace for themes so templates can use 'themes::modern.*'
        View::addNamespace('themes', resource_path('themes'));

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

        $this->app->booted(function () {
            if (function_exists('do_action')) {
                do_action('cms_booted');
            }
        });
    }
}
