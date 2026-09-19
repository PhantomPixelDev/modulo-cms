<?php

use App\Http\Middleware\CacheResponseHeaders;
use App\Http\Middleware\CheckMaintenanceMode;
use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LocaleFromUrl;
use App\Http\Middleware\RoleOrPermission;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Sentry\Laravel\Integration;

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
            CheckMaintenanceMode::class,
            SetLocale::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Register middleware aliases
        // Use custom permission middleware (supports pipe-delimited OR: 'edit media|delete media')
        $middleware->alias([
            'role' => CheckRole::class,
            'permission' => CheckPermission::class,
            // Use custom implementation to avoid hard dependency on Spatie middleware class
            'role_or_permission' => RoleOrPermission::class,
            // Cache response headers for public pages
            'cache.response' => CacheResponseHeaders::class,
            // Locale from URL prefix
            'locale.url' => LocaleFromUrl::class,
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
        if (class_exists(Integration::class)) {
            Integration::handles($exceptions);
        }
    })->create();
