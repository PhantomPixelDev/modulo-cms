<?php

namespace App\Console\Commands;

use App\Models\SiteSetting;
use App\Models\User;
use App\Notifications\UpdatesAvailable;
use App\Services\UpdateCenter;
use App\Support\SystemMeta;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;
use Throwable;

/**
 * The daily update check: core releases and registry plugins. Results are
 * stored for the Updates page and sidebar badge, and administrators are
 * mailed once for every new set of updates.
 */
class CheckUpdatesCommand extends Command
{
    public const NOTIFIED_KEY = 'updates_notified';

    protected $signature = 'modulo:check-updates
        {--no-notify : Only record the results; do not email administrators}';

    protected $description = 'Check for core and plugin updates and notify administrators';

    public function handle(UpdateCenter $center): int
    {
        if (! config('updates.enabled')) {
            $this->line('Update checks are disabled (MODULO_UPDATE_CHECK=false).');

            return self::SUCCESS;
        }

        $result = $center->refresh();
        $core = $result['core'];

        if ($core['error'] !== null) {
            $this->warn('Core: '.$core['error']);
        } elseif ($core['available']) {
            $this->info(sprintf('Core: %s -> %s%s', $core['current'], $core['latest'], $core['security'] ? ' (security release)' : ''));
        } else {
            $this->line('Core: up to date ('.$core['current'].').');
        }

        if ($result['plugin_error'] !== null) {
            $this->warn('Plugins: '.$result['plugin_error']);
        }

        foreach ($result['plugins'] as $plugin) {
            $this->info(sprintf('Plugin %s: %s -> %s', $plugin['slug'], $plugin['installed'], $plugin['available']));
        }

        if ($result['plugins'] === [] && $result['plugin_error'] === null) {
            $this->line('Plugins: up to date.');
        }

        if (! $this->option('no-notify') && config('updates.notify')) {
            $this->notify($core['available'] ? $core : null, $result['plugins']);
        }

        return self::SUCCESS;
    }

    /**
     * @param  array<string, mixed>|null  $core
     * @param  array<int, array<string, mixed>>  $plugins
     */
    protected function notify(?array $core, array $plugins): void
    {
        if ($core === null && $plugins === []) {
            return;
        }

        // One mail per distinct set of updates, not one a day until applied.
        $fingerprint = sha1(json_encode([
            $core['latest'] ?? null,
            collect($plugins)->map(fn ($p) => $p['slug'].'@'.$p['available'])->sort()->values()->all(),
        ]) ?: '');

        if (SystemMeta::get(self::NOTIFIED_KEY) === $fingerprint) {
            return;
        }

        $notification = new UpdatesAvailable($core, $plugins);

        try {
            $admins = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['admin', 'super-admin']))->get();

            if ($admins->isNotEmpty()) {
                Notification::send($admins, $notification);
            } elseif ($address = SiteSetting::get('admin_email', config('mail.admin_address'))) {
                Notification::route('mail', $address)->notify($notification);
            } else {
                return;
            }
        } catch (Throwable $e) {
            // A broken mailer must not fail the check; the page still shows it.
            $this->warn('Could not send the update email: '.$e->getMessage());

            return;
        }

        SystemMeta::put(self::NOTIFIED_KEY, $fingerprint);
        $this->line('Administrators notified.');
    }
}
