<?php

use App\Models\SiteSetting;
use App\Services\MailSettings;
use Illuminate\Support\Facades\Crypt;
use Inertia\Testing\AssertableInertia as Assert;

function mailAdmin()
{
    return makeAdminUserWithPermissions(['edit settings', 'view settings']);
}

function smtpForm(array $overrides = []): array
{
    return array_merge([
        'mode' => 'smtp', 'host' => 'smtp.example.com', 'port' => 465, 'security' => 'ssl',
        'username' => 'shop@example.com', 'password' => 's3cret-pass',
        'from_address' => 'shop@example.com', 'from_name' => 'Bakery Rosa',
    ], $overrides);
}

it('sends through the SMTP server entered in the admin', function () {
    $this->actingAs(mailAdmin())->put(route('dashboard.admin.system.email.update'), smtpForm())
        ->assertSessionHasNoErrors();

    // A fresh request applies it the way every request does
    app(MailSettings::class)->apply();

    expect(config('mail.default'))->toBe('smtp')
        ->and(config('mail.mailers.smtp.host'))->toBe('smtp.example.com')
        ->and(config('mail.mailers.smtp.port'))->toBe(465)
        ->and(config('mail.mailers.smtp.scheme'))->toBe('smtps')
        ->and(config('mail.mailers.smtp.password'))->toBe('s3cret-pass')
        ->and(config('mail.from.address'))->toBe('shop@example.com')
        ->and(config('mail.from.name'))->toBe('Bakery Rosa');
});

it('keeps the password encrypted and never shows it', function () {
    $this->actingAs(mailAdmin())->put(route('dashboard.admin.system.email.update'), smtpForm());

    $stored = (string) SiteSetting::where('key', 'mail_password')->value('value');
    expect($stored)->not->toContain('s3cret-pass')
        ->and(Crypt::decryptString($stored))->toBe('s3cret-pass');

    $this->get(route('dashboard.admin.system.email'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('mailSettings.has_password', true)
            ->missing('mailSettings.password'));

    $this->get(route('dashboard.admin.settings.index'))
        ->assertInertia(fn (Assert $page) => $page->missing('settings.email'));
});

it('keeps the saved password when the field is left empty, and forgets it on request', function () {
    $this->actingAs(mailAdmin())->put(route('dashboard.admin.system.email.update'), smtpForm());

    $this->put(route('dashboard.admin.system.email.update'), smtpForm(['password' => '', 'host' => 'mail.example.org']));
    app(MailSettings::class)->apply();
    expect(config('mail.mailers.smtp.password'))->toBe('s3cret-pass');

    $this->put(route('dashboard.admin.system.email.update'), smtpForm(['password' => '', 'forget_password' => true]));
    expect(SiteSetting::get('mail_password'))->toBe('');
});

it('needs a server for SMTP and leaves the environment settings alone otherwise', function () {
    $this->actingAs(mailAdmin())
        ->put(route('dashboard.admin.system.email.update'), smtpForm(['host' => '']))
        ->assertSessionHasErrors('host');

    $before = config('mail.default');
    $this->put(route('dashboard.admin.system.email.update'), ['mode' => 'env'])->assertSessionHasNoErrors();
    app(MailSettings::class)->apply();

    expect(config('mail.default'))->toBe($before);
});

it('sends a test message and says where it went', function () {
    $this->actingAs(mailAdmin())->put(route('dashboard.admin.system.email.update'), ['mode' => 'log']);
    app(MailSettings::class)->apply();

    $this->post(route('dashboard.admin.system.email.test'), ['to' => 'me@example.com'])
        ->assertSessionHas('success', __('dashboard.email.messages.test_logged'));
});

it('keeps email settings to people who may change settings', function () {
    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->get(route('dashboard.admin.system.email'))
        ->assertForbidden();
});
