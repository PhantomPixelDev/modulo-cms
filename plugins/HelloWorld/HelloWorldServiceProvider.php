<?php

namespace Plugins\HelloWorld;

use Illuminate\Support\Facades\Log;
use App\Plugins\BasePluginServiceProvider;

class HelloWorldServiceProvider extends BasePluginServiceProvider
{
    protected string $pluginBasePath = __DIR__;
    protected string $pluginSlug = 'hello-world';

    public function register()
    {
        // Register plugin-specific services
    }

    protected function bootPlugin(): void
    {
        // Example of using the hook system
        add_action('cms_booted', function() {
            Log::info('Hello World plugin is active and CMS has booted!');
        });

        add_filter('site_name', function($name) {
            return $name . ' (Hello World)';
        });
    }
}
