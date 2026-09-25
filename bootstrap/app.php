<?php

use App\Http\Middleware\CacheResponseHeaders;
use App\Http\Middleware\CheckMaintenanceMode;
use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureNotInstalled;
use App\Http\Middleware\EnsureSchemaIsCompatible;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\LocaleFromUrl;
use App\Http\Middleware\RedirectToInstaller;
use App\Http\Middleware\RequireTwoFactorForAdmins;
use App\Http\Middleware\RoleOrPermission;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\TrustProxies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Middleware\TrustProxies as BaseTrustProxies;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\AuthenticateSession;
use Illuminate\Support\Facades\Route;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        // Registered before web.php, whose catch-all would otherwise treat
        // /install as a content slug.
        then: function () {
            Route::middleware('web')->group(__DIR__.'/../routes/install.php');
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Real client IP and scheme behind the Docker nginx / a TLS proxy; see config/app.php.
        $middleware->replace(BaseTrustProxies::class, TrustProxies::class);

        $middleware->web(prepend: [
            // Before anything that reads site settings or sidebar data: on a
            // fresh install those tables do not exist yet.
            RedirectToInstaller::class,
            // An older build must not serve a database a newer one migrated.
            EnsureSchemaIsCompatible::class,
            // Early, so the CSP nonce exists before anything renders.
            SecurityHeaders::class,
        ]);

        $middleware->web(append: [
            // Invalidates a user's other sessions when their password changes
            AuthenticateSession::class,
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
            // 404s the installer once setup has completed
            'install.guard' => EnsureNotInstalled::class,
            // Administrators must have 2FA when security.require_two_factor_for_admins is on
            'two-factor.admin' => RequireTwoFactorForAdmins::class,
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
