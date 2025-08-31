<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\ReactTemplateRenderer;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        // Try themed React login if available
        try {
            /** @var ReactTemplateRenderer $renderer */
            $renderer = app(ReactTemplateRenderer::class);
            if ($renderer->isReactTheme() && $renderer->canRender('login')) {
                return $renderer->render('login', [
                    'canResetPassword' => Route::has('password.request'),
                    'status' => $request->session()->get('status'),
                ]);
            }
        } catch (\Throwable $e) {
            // Fallback to default page rendering below
        }
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): SymfonyResponse
    {
        $request->authenticate();

        $request->session()->regenerate();
        // Force a full page reload so the Inertia root view switches from
        // themed (auth pages) to the standard app root for the dashboard.
        $intended = $request->session()->pull('url.intended', route('dashboard', absolute: false));
        return Inertia::location($intended);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): SymfonyResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
        // Force a full reload so we switch back to the themed root cleanly
        return Inertia::location(route('login'));
    }
}
