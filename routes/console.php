<?php

use App\Models\Activity;
use App\Models\Post;
use App\Models\SiteSetting;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schedule;

// Nightly database dump, pruned to the last week (the scheduler container runs it)
Schedule::command('modulo:db-backup')->dailyAt('03:15')->onOneServer();

// Scheduled posts: clear caches, ping search engines and fire post_published when they go live
Schedule::command('modulo:publish-scheduled')->everyMinute()->withoutOverlapping()->onOneServer();

// Weekly full backup (database, media, plugins), pruned to MODULO_BACKUP_KEEP
Schedule::command('modulo:backup')->weeklyOn(0, '03:45')->onOneServer()
    ->when(fn () => (bool) config('backups.schedule'));

// Activity log retention (security.activity_retention_days) and trash purging (content.trash_days)
Schedule::command('model:prune', ['--model' => [Activity::class, Post::class]])->dailyAt('04:30')->onOneServer();

// Daily core + plugin update check; admins are mailed once per new set of updates
Schedule::command('modulo:check-updates')->dailyAt('04:10')->onOneServer()
    ->when(fn () => (bool) config('updates.enabled'));

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mail:test {email?}', function () {
    $recipient = $this->argument('email')
        ?? SiteSetting::get('admin_email', config('mail.admin_address'))
        ?: config('mail.admin_address');

    if (! $recipient) {
        $this->error('No recipient email provided or configured.');

        return 1;
    }

    Mail::raw('Mail configuration test from '.config('app.name'), function ($message) use ($recipient) {
        $message->to($recipient)
            ->subject('Mail test - '.config('app.name'));
    });

    $this->info('Mail test sent to '.$recipient);

    return 0;
})->purpose('Send a test email using the configured mailer');
