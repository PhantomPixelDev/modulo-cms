<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Support\Totp;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Turning two-factor authentication on and off for the signed-in user.
 * Everything but viewing sits behind password confirmation.
 */
class TwoFactorController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $pending = $user->two_factor_secret !== null && $user->two_factor_confirmed_at === null;

        return Inertia::render('settings/two-factor', [
            'enabled' => $user->hasTwoFactorEnabled(),
            'pending' => $pending,
            // Only while setting up: afterwards the secret is never shown again.
            'setup' => $pending ? [
                'secret' => $user->two_factor_secret,
                'uri' => Totp::uri($user->two_factor_secret, $user->email, (string) config('app.name')),
            ] : null,
            'recoveryCodes' => $request->session()->get('two_factor_recovery_codes'),
            'recoveryCodesLeft' => $user->hasTwoFactorEnabled() ? count((array) $user->two_factor_recovery_codes) : null,
            'required' => config('security.require_two_factor_for_admins') && $user->hasRole(['admin', 'super-admin']),
        ]);
    }

    /** Start setting up: a new secret, not yet active. */
    public function store(Request $request): RedirectResponse
    {
        $request->user()->forceFill([
            'two_factor_secret' => Totp::generateSecret(),
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_last_step' => null,
        ])->save();

        return back();
    }

    /** Finish setting up with a code from the app, which proves it is set up. */
    public function confirm(Request $request): RedirectResponse
    {
        $request->validate(['code' => ['required', 'string']]);
        $user = $request->user();

        if ($user->two_factor_secret === null || $user->two_factor_confirmed_at !== null
            || ! $user->verifyTwoFactorCode((string) $request->input('code'))) {
            throw ValidationException::withMessages(['code' => 'That code is not valid. Check the time on your phone and try the next one.']);
        }

        $user->forceFill(['two_factor_confirmed_at' => now()])->save();
        $codes = $user->regenerateRecoveryCodes();

        return back()
            ->with('two_factor_recovery_codes', $codes)
            ->with('success', 'Two-factor authentication is on.');
    }

    public function regenerateRecoveryCodes(Request $request): RedirectResponse
    {
        abort_unless($request->user()->hasTwoFactorEnabled(), 404);

        return back()->with('two_factor_recovery_codes', $request->user()->regenerateRecoveryCodes());
    }

    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (config('security.require_two_factor_for_admins') && $user->hasRole(['admin', 'super-admin'])) {
            return back()->with('error', 'Two-factor authentication is required for administrators on this site.');
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_last_step' => null,
        ])->save();

        return back()->with('success', 'Two-factor authentication is off.');
    }
}
