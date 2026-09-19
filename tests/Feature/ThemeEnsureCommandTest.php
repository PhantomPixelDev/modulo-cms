<?php

use App\Models\Theme;

it('installs and activates the default theme on a fresh install', function () {
    expect(Theme::where('is_active', true)->exists())->toBeFalse();

    $this->artisan('theme:ensure')->assertSuccessful();

    expect(Theme::where('slug', 'modern-react')->value('is_active'))->toBeTrue();
});

it('is a no-op when a theme is already active', function () {
    $this->artisan('theme:ensure')->assertSuccessful();

    $this->artisan('theme:ensure')
        ->expectsOutputToContain('nothing to do')
        ->assertSuccessful();

    expect(Theme::where('is_active', true)->count())->toBe(1);
});

it('fails for unknown themes', function () {
    $this->artisan('theme:ensure', ['slug' => 'does-not-exist'])->assertFailed();
});
