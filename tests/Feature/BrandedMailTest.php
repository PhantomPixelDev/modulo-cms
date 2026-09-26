<?php

use App\Models\SiteSetting;
use Illuminate\Notifications\Messages\MailMessage;

it('signs every email with the site name and logo', function () {
    SiteSetting::set('site_name', 'Bakery Rosa');
    SiteSetting::set('site_logo', '/storage/logo.png');

    $html = (string) (new MailMessage)->line('Your order is on its way.')->render();

    expect($html)->toContain('Bakery Rosa')
        ->toContain('src="'.url('/storage/logo.png').'"')
        ->toContain('© '.date('Y').' Bakery Rosa');
});

it('uses the site name when there is no logo', function () {
    SiteSetting::set('site_name', 'Bakery Rosa');

    $html = (string) (new MailMessage)->line('Hello')->render();

    expect($html)->toContain('Bakery Rosa')->not->toContain('<img src=');
});
