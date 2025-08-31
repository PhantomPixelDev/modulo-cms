<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Register middleware aliases
        // Use custom permission middleware (supports pipe-delimited OR: 'edit media|delete media')
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'permission' => \App\Http\Middleware\CheckPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Structured logging for all exceptions
        $exceptions->report(function (\Throwable $e) {
            try {
                \Log::error('app.exception', [
                    'type' => get_class($e),
                    'message' => $e->getMessage(),
                    'code' => $e->getCode(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => collect($e->getTrace())->take(10)->all(),
                    'env' => app()->environment(),
                    'url' => request()->fullUrl() ?? null,
                    'method' => request()->method() ?? null,
                    'ip' => request()->ip() ?? null,
                    'user_id' => optional(auth()->user())->id,
                ]);

                // Optional: Sentry capture when configured
                if (env('SENTRY_LARAVEL_DSN') && function_exists('Sentry\\captureException')) {
                    \Sentry\captureException($e);
                }
            } catch (\Throwable $inner) {
                // Avoid cascading failures in the reporter
            }
        });

        // Optionally render JSON for API routes
        $exceptions->render(function (\Throwable $e) {
            $request = request();
            if ($request && $request->is('api/*')) {
                return response()->json([
                    'error' => [
                        'message' => 'Server Error',
                        'type' => class_basename($e),
                    ],
                ], 500);
            }
        });
    })->create();
