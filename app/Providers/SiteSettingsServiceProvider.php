<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Models\SiteSetting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;

class SiteSettingsServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        try {
            if (!Schema::hasTable('site_settings')) {
                return;
            }
        } catch (\Illuminate\Database\QueryException $e) {
            // Table check failed (e.g. missing driver during tests)
            return;
        }

        try {
            // Only try to load settings if table exists
            if (Schema::hasTable('site_settings')) {
                // Override app name
                $siteName = SiteSetting::get('site_name');
                if ($siteName) {
                    Config::set('app.name', $siteName);
                    Config::set('mail.from.name', $siteName);
                }

                // Override app URL
                $siteUrl = SiteSetting::get('site_url');
                if ($siteUrl) {
                    Config::set('app.url', $siteUrl);
                    \Illuminate\Support\Facades\URL::forceRootUrl($siteUrl);
                }

                // Override admin email
                $adminEmail = SiteSetting::get('admin_email');
                if ($adminEmail) {
                    Config::set('mail.from.address', $adminEmail);
                }

                // Override timezone
                $timezone = SiteSetting::get('timezone');
                if ($timezone) {
                    Config::set('app.timezone', $timezone);
                    date_default_timezone_set($timezone);
                }
            }
        } catch (\Exception $e) {
            // Settings table doesn't exist yet (fresh install)
            // Use default config values
        }
    }
}
