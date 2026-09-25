<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * The second login step for users with two-factor authentication: the
 * password was right (LoginRequest), nobody is logged in yet, and the session
 * holds only who is trying.
 */
class TwoFactorChallengeController extends Controller
{
    public function create(Request $request): Response|RedirectResponse
    {
        if ($this->pendingUser($request) === null) {
            return redirect()->route('login');
        }

        return Inertia::render('auth/two-factor-challenge');
    }

    public function store(Request $request): SymfonyResponse
    {
        $user = $this->pendingUser($request);

        if ($user === null) {
            return redirect()->route('login');
        }

        $data = $request->validate([
            'code' => ['nullable', 'string', 'max:16'],
            'recovery_code' => ['nullable', 'string', 'max:32'],
        ]);

        $key = 'two-factor:'.$user->getKey().'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'code' => __('auth.throttle', ['seconds' => $seconds = RateLimiter::availableIn($key), 'minutes' => ceil($seconds / 60)]),
            ]);
        }

        $valid = filled($data['recovery_code'] ?? null)
            ? $user->useRecoveryCode((string) $data['recovery_code'])
            : $user->verifyTwoFactorCode((string) ($data['code'] ?? ''));

        if (! $valid) {
            RateLimiter::hit($key);
            ActivityLog::record('auth.2fa_failed', 'Wrong two-factor code', $user, [], $user->getKey());

            throw ValidationException::withMessages([
                filled($data['recovery_code'] ?? null) ? 'recovery_code' : 'code' => 'That code is not valid.',
            ]);
        }

        RateLimiter::clear($key);

        Auth::guard('web')->login($user, (bool) $request->session()->pull('login.remember', false));
        $request->session()->forget('login.id');
        $request->session()->regenerate();

        return Inertia::location($request->session()->pull('url.intended', route('dashboard', absolute: false)));
    }

    protected function pendingUser(Request $request): ?User
    {
        $id = $request->session()->get('login.id');
        $user = $id !== null ? User::find($id) : null;

        return $user !== null && $user->hasTwoFactorEnabled() ? $user : null;
    }
}
