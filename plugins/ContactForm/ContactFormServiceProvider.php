<?php

namespace Plugins\ContactForm;

use App\Models\Plugin;
use App\Plugins\BasePluginServiceProvider;
use App\Services\ShortcodeService;
use Plugins\ContactForm\src\Services\ContactFormShortcodeService;

class ContactFormServiceProvider extends BasePluginServiceProvider
{
    protected string $pluginBasePath = __DIR__;

    protected string $pluginSlug = 'contact-form';

    public function register()
    {
        if (! $this->app->bound(ShortcodeService::class)) {
            $this->app->singleton(ShortcodeService::class);
        }
    }

    protected function bootPlugin(): void
    {
        $this->ensureDefaultSettings();

        $this->app->singleton(ContactFormShortcodeService::class, function ($app) {
            return new ContactFormShortcodeService($app->make(ShortcodeService::class));
        });

        $this->app->make(ContactFormShortcodeService::class);
    }

    protected function ensureDefaultSettings(): void
    {
        $plugin = Plugin::where('slug', 'contact-form')->first();
        if (! $plugin) {
            return;
        }

        $defaults = [
            'recipient_email' => '',
            'default_subject' => 'Contact request',
            'success_message' => 'Thanks! Your message has been sent.',
        ];

        $settings = is_array($plugin->settings) ? $plugin->settings : [];
        $merged = array_merge($defaults, $settings);

        if ($merged !== $settings) {
            $plugin->update(['settings' => $merged]);
        }
    }
}
