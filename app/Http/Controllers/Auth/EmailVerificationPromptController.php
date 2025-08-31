<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\ReactTemplateRenderer;

class EmailVerificationPromptController extends Controller
{
    /**
     * Show the email verification prompt page.
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        return $request->user()->hasVerifiedEmail()
                    ? redirect()->intended(route('dashboard', absolute: false))
                    : $this->renderVerifyEmail($request);
    }

    protected function renderVerifyEmail(Request $request): Response
    {
        // Try themed React verify-email if available
        try {
            /** @var ReactTemplateRenderer $renderer */
            $renderer = app(ReactTemplateRenderer::class);
            if ($renderer->isReactTheme() && $renderer->canRender('verify-email')) {
                return $renderer->render('verify-email', [
                    'status' => $request->session()->get('status'),
                ]);
            }
        } catch (\Throwable $e) {
            // Fallback to default page rendering below
        }
        return Inertia::render('auth/verify-email', ['status' => $request->session()->get('status')]);
    }
}
