<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisteredUserRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\ReactTemplateRenderer;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        // Try themed React register if available
        try {
            /** @var ReactTemplateRenderer $renderer */
            $renderer = app(ReactTemplateRenderer::class);
            if ($renderer->isReactTheme() && $renderer->canRender('register')) {
                return $renderer->render('register');
            }
        } catch (\Throwable $e) {
            // Fallback to default page rendering below
        }
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(RegisteredUserRequest $request): SymfonyResponse
    {
        $data = $request->validated();
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        event(new Registered($user));

        Auth::login($user);
        // Force a full reload so we switch from themed auth root to standard app root
        $intended = $request->session()->pull('url.intended', route('dashboard', absolute: false));
        return \Inertia\Inertia::location($intended);
    }
}
