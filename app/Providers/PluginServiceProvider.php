<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Services\PluginManager;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PluginServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(PluginManager::class, function ($app) {
            return new PluginManager();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        if (!Schema::hasTable('plugins')) {
            return;
        }

        $pluginManager = $this->app->make(PluginManager::class);
        // Ensure filesystem plugins are synced into DB (idempotent)
        $pluginManager->syncDiscoveredPluginsCached();
        $activePlugins = $pluginManager->getActivePlugins();

        foreach ($activePlugins as $plugin) {
            $provider = $plugin->service_provider;
            if (!$provider || !is_string($provider)) {
                continue;
            }

            if (!Str::startsWith($provider, 'Plugins\\')) {
                continue;
            }

            if (!class_exists($provider)) {
                continue;
            }

            if (!is_subclass_of($provider, ServiceProvider::class)) {
                continue;
            }

            $this->app->register($provider);
        }
    }
}
