<?php

namespace App\Services;

use App\Models\SiteSetting;
use Illuminate\Support\Facades\Crypt;
use Throwable;

/**
 * How the site sends email, set from the admin instead of only .env.
 *
 * "env" (the default) leaves the MAIL_* environment settings alone; "smtp"
 * sends through the server entered here; "log" writes mails to the log (for
 * trying things out). The SMTP password is stored encrypted and never sent
 * back to the browser.
 */
class MailSettings
{
    public const MODES = ['env', 'smtp', 'log'];

    public const SECURITY = ['starttls', 'ssl'];

    /**
     * The settings as the admin form shows them.
     *
     * @return array<string, mixed>
     */
    public function current(): array
    {
        return [
            'mode' => $this->mode(),
            'host' => (string) SiteSetting::get('mail_host', ''),
            'port' => (int) SiteSetting::get('mail_port', 587) ?: 587,
            'security' => in_array(SiteSetting::get('mail_security'), self::SECURITY, true) ? SiteSetting::get('mail_security') : 'starttls',
            'username' => (string) SiteSetting::get('mail_username', ''),
            'has_password' => (string) SiteSetting::get('mail_password', '') !== '',
            'from_address' => (string) SiteSetting::get('mail_from_address', ''),
            'from_name' => (string) SiteSetting::get('mail_from_name', ''),
            // What .env configures, so "use the server settings" says what that means
            'env_mailer' => (string) config('mail.env_default', config('mail.default')),
        ];
    }

    /**
     * @param  array<string, mixed>  $data  validated form data; an empty password keeps the stored one
     */
    public function save(array $data): void
    {
        SiteSetting::set('mail_mailer', $data['mode'], 'email');
        foreach (['host', 'username', 'from_address', 'from_name'] as $key) {
            SiteSetting::set('mail_'.$key, (string) ($data[$key] ?? ''), 'email');
        }
        SiteSetting::set('mail_port', (int) ($data['port'] ?? 587), 'email', 'integer');
        SiteSetting::set('mail_security', $data['security'] ?? 'starttls', 'email');

        if (! empty($data['forget_password'])) {
            SiteSetting::set('mail_password', '', 'email');
        } elseif (isset($data['password']) && $data['password'] !== '') {
            SiteSetting::set('mail_password', Crypt::encryptString((string) $data['password']), 'email');
        }

        $this->apply();
    }

    /**
     * Point Laravel's mailer at these settings. Runs on boot and before
     * each queued job, so a long-running worker picks up changes too.
     */
    public function apply(): void
    {
        if (! schema_has_table('site_settings')) {
            return;
        }

        // Remember what the environment asked for, before overriding it
        if (config('mail.env_default') === null) {
            config(['mail.env_default' => config('mail.default')]);
        }

        $mode = $this->mode();
        if ($mode === 'env') {
            config(['mail.default' => config('mail.env_default')]);
        } elseif ($mode === 'log') {
            config(['mail.default' => 'log']);
        } else {
            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.url' => null,
                'mail.mailers.smtp.host' => (string) SiteSetting::get('mail_host', ''),
                'mail.mailers.smtp.port' => (int) SiteSetting::get('mail_port', 587),
                // Port 465 speaks TLS from the start; 587 and 25 upgrade with STARTTLS
                'mail.mailers.smtp.scheme' => SiteSetting::get('mail_security') === 'ssl' ? 'smtps' : 'smtp',
                'mail.mailers.smtp.username' => (string) SiteSetting::get('mail_username', '') ?: null,
                'mail.mailers.smtp.password' => $this->password(),
            ]);
        }

        if (($from = (string) SiteSetting::get('mail_from_address', '')) !== '') {
            config(['mail.from.address' => $from]);
        }
        if (($name = (string) SiteSetting::get('mail_from_name', '')) !== '') {
            config(['mail.from.name' => $name]);
        }

        // A mailer resolved earlier would keep the old transport
        if (app()->resolved('mail.manager')) {
            app('mail.manager')->forgetMailers();
        }
    }

    public function mode(): string
    {
        $mode = (string) SiteSetting::get('mail_mailer', 'env');

        return in_array($mode, self::MODES, true) ? $mode : 'env';
    }

    /**
     * Whether mail actually leaves the server (not the log or an in-memory array).
     */
    public function sendsMail(): bool
    {
        return ! in_array(config('mail.default'), ['log', 'array'], true);
    }

    protected function password(): ?string
    {
        $stored = (string) SiteSetting::get('mail_password', '');
        if ($stored === '') {
            return null;
        }

        try {
            return Crypt::decryptString($stored);
        } catch (Throwable) {
            // Encrypted with another APP_KEY: it has to be entered again
            return null;
        }
    }
}
