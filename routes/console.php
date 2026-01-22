<?php

use App\Models\SiteSetting;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mail:test {email?}', function () {
    $recipient = $this->argument('email')
        ?? SiteSetting::get('admin_email', config('mail.admin_address'))
        ?: config('mail.admin_address');

    if (!$recipient) {
        $this->error('No recipient email provided or configured.');
        return 1;
    }

    Mail::raw('Mail configuration test from ' . config('app.name'), function ($message) use ($recipient) {
        $message->to($recipient)
            ->subject('Mail test - ' . config('app.name'));
    });

    $this->info('Mail test sent to ' . $recipient);

    return 0;
})->purpose('Send a test email using the configured mailer');
