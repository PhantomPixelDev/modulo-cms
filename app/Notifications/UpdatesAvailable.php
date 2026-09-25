<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Sent by `modulo:check-updates` when something new can be installed, once
 * per distinct set of updates rather than every day until it is applied.
 */
class UpdatesAvailable extends Notification
{
    use Queueable;

    /**
     * @param  array<string, mixed>|null  $core  UpdateChecker result, when a core release is available
     * @param  array<int, array{name: string, installed: string, available: string}>  $plugins
     */
    public function __construct(
        public ?array $core,
        public array $plugins,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $site = config('app.name');
        $security = (bool) ($this->core['security'] ?? false);

        $message = (new MailMessage)
            ->subject(($security ? '[Security] ' : '').'Updates available for '.$site)
            ->greeting($security ? 'A security release is available' : 'Updates are available');

        if ($this->core !== null) {
            $message->line(sprintf('Modulo CMS %s is available (this site runs %s).', $this->core['latest'], $this->core['current']));

            if ($security) {
                $message->line('This release fixes a security issue. Please update soon.');
            }

            if ($this->core['breaking'] ?? false) {
                $message->line('It contains breaking changes: read the release notes before updating.');
            }

            foreach ($this->core['unmet_requirements'] ?? [] as $requirement) {
                $message->line('Requires '.$requirement.'.');
            }
        }

        if ($this->plugins !== []) {
            $message->line('Plugin updates:');
            foreach ($this->plugins as $plugin) {
                $message->line(sprintf('- %s %s → %s', $plugin['name'], $plugin['installed'], $plugin['available']));
            }
        }

        return $message
            ->action('Open the Updates page', route('dashboard.admin.system.updates'))
            ->line('Nothing is installed automatically. A backup is taken before every core update.');
    }
}
