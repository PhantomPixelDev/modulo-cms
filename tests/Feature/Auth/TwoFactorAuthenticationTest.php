<?php

use App\Models\User;
use App\Support\Totp;
use Spatie\Permission\Models\Role;

/** The RFC 6238 test secret: ASCII "12345678901234567890". */
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

function userWithTwoFactor(array $attributes = []): User
{
    $user = User::factory()->create($attributes);
    $user->forceFill([
        'two_factor_secret' => Totp::generateSecret(),
        'two_factor_confirmed_at' => now(),
    ])->save();
    $user->regenerateRecoveryCodes();

    return $user->fresh();
}

it('generates the RFC 6238 reference codes', function () {
    // RFC 6238 appendix B (SHA1), last 6 of the 8 published digits.
    expect(Totp::at(RFC_SECRET, Totp::currentStep(59)))->toBe('287082')
        ->and(Totp::at(RFC_SECRET, Totp::currentStep(1111111109)))->toBe('081804')
        ->and(Totp::at(RFC_SECRET, Totp::currentStep(2000000000)))->toBe('279037')
        ->and(Totp::base32Decode(RFC_SECRET))->toBe('12345678901234567890')
        ->and(Totp::base32Encode('12345678901234567890'))->toBe(RFC_SECRET);
});

it('accepts one step of clock drift and nothing further', function () {
    $now = 1_700_000_000;
    $step = Totp::currentStep($now);

    expect(Totp::verify(RFC_SECRET, Totp::at(RFC_SECRET, $step - 1), $now))->toBe($step - 1)
        ->and(Totp::verify(RFC_SECRET, Totp::at(RFC_SECRET, $step + 1), $now))->toBe($step + 1)
        ->and(Totp::verify(RFC_SECRET, Totp::at(RFC_SECRET, $step + 2), $now))->toBeNull()
        ->and(Totp::verify(RFC_SECRET, 'abcdef', $now))->toBeNull();
});

it('asks for a code after the password and logs in only with a valid one', function () {
    $user = userWithTwoFactor(['password' => bcrypt('secret-password')]);

    $this->post(route('login'), ['email' => $user->email, 'password' => 'secret-password'])
        ->assertRedirect(route('two-factor.login'));
    $this->assertGuest();

    $this->get(route('two-factor.login'))->assertOk();

    $this->post(route('two-factor.login.store'), ['code' => '000000'])->assertSessionHasErrors('code');
    $this->assertGuest();

    $code = Totp::at($user->two_factor_secret, Totp::currentStep());
    $this->post(route('two-factor.login.store'), ['code' => $code]);
    $this->assertAuthenticatedAs($user);
});

it('does not accept the same code twice', function () {
    $user = userWithTwoFactor();
    $code = Totp::at($user->two_factor_secret, Totp::currentStep());

    expect($user->verifyTwoFactorCode($code))->toBeTrue()
        ->and($user->fresh()->verifyTwoFactorCode($code))->toBeFalse();
});

it('lets a recovery code in once', function () {
    $user = userWithTwoFactor(['password' => bcrypt('secret-password')]);
    $recovery = $user->two_factor_recovery_codes[0];

    $this->post(route('login'), ['email' => $user->email, 'password' => 'secret-password']);
    $this->post(route('two-factor.login.store'), ['recovery_code' => $recovery]);
    $this->assertAuthenticatedAs($user);

    expect($user->fresh()->two_factor_recovery_codes)->toHaveCount(7)
        ->and($user->fresh()->useRecoveryCode($recovery))->toBeFalse();
});

it('locks the challenge after five wrong codes', function () {
    $user = userWithTwoFactor(['password' => bcrypt('secret-password')]);
    $this->post(route('login'), ['email' => $user->email, 'password' => 'secret-password']);

    foreach (range(1, 5) as $ignored) {
        $this->post(route('two-factor.login.store'), ['code' => '000000']);
    }

    $code = Totp::at($user->two_factor_secret, Totp::currentStep());
    $this->post(route('two-factor.login.store'), ['code' => $code])->assertSessionHasErrors('code');
    $this->assertGuest();
});

it('sends people without a pending login back to the login page', function () {
    $this->get(route('two-factor.login'))->assertRedirect(route('login'));
});

it('logs users without two-factor straight in', function () {
    $user = User::factory()->create(['password' => bcrypt('secret-password')]);

    $this->post(route('login'), ['email' => $user->email, 'password' => 'secret-password']);

    $this->assertAuthenticatedAs($user);
});

it('sets two-factor up only once a code from the app is confirmed', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);

    $this->post(route('two-factor.enable'))->assertRedirect();
    $user->refresh();
    expect($user->two_factor_secret)->not->toBeNull()
        ->and($user->hasTwoFactorEnabled())->toBeFalse();

    $this->get(route('two-factor.edit'))->assertInertia(fn ($page) => $page
        ->where('pending', true)
        ->where('setup.secret', $user->two_factor_secret));

    $this->post(route('two-factor.confirm'), ['code' => '000000'])->assertSessionHasErrors('code');

    $this->post(route('two-factor.confirm'), ['code' => Totp::at($user->two_factor_secret, Totp::currentStep())])
        ->assertSessionHas('two_factor_recovery_codes');

    expect($user->fresh()->hasTwoFactorEnabled())->toBeTrue();
});

it('needs the password confirmed to turn two-factor off', function () {
    $user = userWithTwoFactor();

    $this->actingAs($user)->delete(route('two-factor.disable'))->assertRedirect(route('password.confirm'));
    expect($user->fresh()->hasTwoFactorEnabled())->toBeTrue();

    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()])->delete(route('two-factor.disable'));
    expect($user->fresh()->hasTwoFactorEnabled())->toBeFalse();
});

it('keeps the secret out of serialized users', function () {
    expect(userWithTwoFactor()->toArray())->not->toHaveKeys(['two_factor_secret', 'two_factor_recovery_codes']);
});

it('makes administrators set up two-factor when the site requires it', function () {
    config(['security.require_two_factor_for_admins' => true]);
    $admin = User::factory()->create();
    $admin->assignRole(Role::findOrCreate('admin', 'web'));

    $this->actingAs($admin)->get('/dashboard')->assertRedirect(route('two-factor.edit'));
    $this->actingAs($admin)->get(route('dashboard.admin.plugins.index'))->assertRedirect(route('two-factor.edit'));

    $admin->forceFill(['two_factor_secret' => Totp::generateSecret(), 'two_factor_confirmed_at' => now()])->save();
    $this->actingAs($admin->fresh())->get('/dashboard')->assertOk();
});
