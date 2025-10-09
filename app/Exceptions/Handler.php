<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Throwable;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            // Log all exceptions in production
            if ($this->shouldReport($e) && app()->environment('production')) {
                logger()->error('Unhandled exception', [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'url' => request()->fullUrl(),
                    'user_id' => auth()->id(),
                    'user_agent' => request()->userAgent(),
                    'ip' => request()->ip(),
                ]);
            }
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        // Handle 404 errors with custom page
        if ($e instanceof NotFoundHttpException) {
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'Page not found',
                    'message' => 'The requested resource could not be found.',
                ], 404);
            }

            return response()->view('errors.404', [], 404);
        }

        // Handle other HTTP exceptions
        if ($this->isHttpException($e)) {
            $statusCode = $e->getStatusCode();

            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'HTTP Error',
                    'message' => $e->getMessage(),
                ], $statusCode);
            }

            // Use custom error pages for common HTTP errors
            if (in_array($statusCode, [500, 503, 419, 429])) {
                return response()->view("errors.{$statusCode}", ['exception' => $e], $statusCode);
            }
        }

        // Handle validation exceptions with better feedback
        if ($e instanceof \Illuminate\Validation\ValidationException) {
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'message' => 'Please check your input and try again.',
                    'errors' => $e->errors(),
                ], 422);
            }

            return redirect()->back()
                ->withErrors($e->errors())
                ->withInput();
        }

        // Handle authentication exceptions
        if ($e instanceof \Illuminate\Auth\AuthenticationException) {
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'Unauthenticated',
                    'message' => 'You must be logged in to access this resource.',
                ], 401);
            }

            return redirect()->guest(route('login'));
        }

        // Handle authorization exceptions
        if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'Forbidden',
                    'message' => 'You do not have permission to access this resource.',
                ], 403);
            }

            abort(403, 'You do not have permission to access this resource.');
        }

        return parent::render($request, $e);
    }
}
