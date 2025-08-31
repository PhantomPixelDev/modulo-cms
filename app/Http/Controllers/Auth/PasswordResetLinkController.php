<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\PasswordResetLinkRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\ReactTemplateRenderer;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(Request $request): Response
    {
        // Try themed React forgot password if available
        try {
            /** @var ReactTemplateRenderer $renderer */
            $renderer = app(ReactTemplateRenderer::class);
            if ($renderer->isReactTheme() && $renderer->canRender('forgot-password')) {
                return $renderer->render('forgot-password', [
                    'status' => $request->session()->get('status'),
                ]);
            }
        } catch (\Throwable $e) {
            // Fallback to default page rendering below
        }
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(PasswordResetLinkRequest $request): RedirectResponse
    {
        Password::sendResetLink(
            $request->validated()
        );

        return back()->with('status', __('A reset link will be sent if the account exists.'));
    }
}
