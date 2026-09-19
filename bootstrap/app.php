<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            \App\Http\Middleware\CheckMaintenanceMode::class,
            \App\Http\Middleware\SetLocale::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Register middleware aliases
        // Use custom permission middleware (supports pipe-delimited OR: 'edit media|delete media')
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
            // Use custom implementation to avoid hard dependency on Spatie middleware class
            'role_or_permission' => \App\Http\Middleware\RoleOrPermission::class,
            // Cache response headers for public pages
            'cache.response' => \App\Http\Middleware\CacheResponseHeaders::class,
            // Locale from URL prefix
            'locale.url' => \App\Http\Middleware\LocaleFromUrl::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Request context on every logged exception (Laravel already logs the exception itself)
        $exceptions->context(fn () => app()->runningInConsole() ? [] : [
            'url' => request()->fullUrl(),
            'method' => request()->method(),
            'ip' => request()->ip(),
        ]);

        // JSON for API routes, keeping real status codes (404, 422, 429...);
        // messages of 500s are hidden unless APP_DEBUG is on.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );

        // Sentry reports only when SENTRY_LARAVEL_DSN is configured
        if (class_exists(\Sentry\Laravel\Integration::class)) {
            \Sentry\Laravel\Integration::handles($exceptions);
        }
    })->create();
