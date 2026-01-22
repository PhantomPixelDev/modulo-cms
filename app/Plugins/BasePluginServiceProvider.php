<?php

namespace App\Plugins;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

abstract class BasePluginServiceProvider extends ServiceProvider
{
    /**
     * Plugin root directory on disk.
     */
    protected string $pluginBasePath;

    /**
     * Unique plugin slug (should match plugin.json slug)
     */
    protected string $pluginSlug;

    public function boot(): void
    {
        $this->bootPluginResources();
        $this->bootPlugin();
    }

    /**
     * Hook for plugins to add their own boot logic.
     */
    protected function bootPlugin(): void
    {
        // Intentionally empty
    }

    protected function bootPluginResources(): void
    {
        if (!isset($this->pluginBasePath) || !is_dir($this->pluginBasePath)) {
            return;
        }

        $routes = $this->pluginBasePath . '/routes/web.php';
        if (is_file($routes)) {
            Route::middleware('web')->group($routes);
        }

        $migrations = $this->pluginBasePath . '/database/migrations';
        if (is_dir($migrations)) {
            $this->loadMigrationsFrom($migrations);
        }

        $translations = $this->pluginBasePath . '/lang';
        if (is_dir($translations) && isset($this->pluginSlug)) {
            $this->loadTranslationsFrom($translations, $this->pluginSlug);
        }

        $views = $this->pluginBasePath . '/resources/views';
        if (is_dir($views) && isset($this->pluginSlug)) {
            $this->loadViewsFrom($views, $this->pluginSlug);
        }
    }
}
