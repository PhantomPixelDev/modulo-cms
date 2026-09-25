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

    /*
    |--------------------------------------------------------------------------
    | Lifecycle hooks
    |--------------------------------------------------------------------------
    |
    | Called by the plugin manager on a fresh instance of the provider, which
    | has not been registered or booted: use $this->app, not state set up in
    | boot(). An exception aborts the action where it can (activation is
    | undone) and is reported otherwise.
    |
    */

    /** After the plugin's migrations and seeder ran, when it is switched on. */
    public function onActivate(): void {}

    /** When the plugin is switched off. Its data stays. */
    public function onDeactivate(): void {}

    /**
     * Before the plugin is removed. With $deleteData the operator asked for
     * its data to go too: the plugin's migrations are rolled back after this
     * returns, so only clean up what they do not cover (files, settings rows
     * in core tables, ...).
     */
    public function onUninstall(bool $deleteData): void {}

    /** After a newer version's migrations ran. */
    public function onUpgrade(string $from, string $to): void {}

    protected function bootPluginResources(): void
    {
        if (! isset($this->pluginBasePath) || ! is_dir($this->pluginBasePath)) {
            return;
        }

        $routes = $this->pluginBasePath.'/routes/web.php';
        if (is_file($routes)) {
            Route::middleware('web')->group($routes);
        }

        $migrations = $this->pluginBasePath.'/database/migrations';
        if (is_dir($migrations)) {
            $this->loadMigrationsFrom($migrations);
        }

        $translations = $this->pluginBasePath.'/lang';
        if (is_dir($translations) && isset($this->pluginSlug)) {
            $this->loadTranslationsFrom($translations, $this->pluginSlug);
        }

        $views = $this->pluginBasePath.'/resources/views';
        if (is_dir($views) && isset($this->pluginSlug)) {
            $this->loadViewsFrom($views, $this->pluginSlug);
        }
    }
}
