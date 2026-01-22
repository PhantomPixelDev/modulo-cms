<?php

namespace App\Services;

use App\Models\Plugin;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PluginManager
{
    protected string $pluginPath;
    protected string $uninstallMarker = '.modulo-uninstalled';

    public function __construct()
    {
        $this->pluginPath = base_path('plugins');
        if (!File::exists($this->pluginPath)) {
            File::makeDirectory($this->pluginPath, 0755, true);
        }
    }

    /**
     * Discover plugins in the plugins directory.
     */
    public function discover(): array
    {
        if (!File::exists($this->pluginPath)) {
            return [];
        }

        $plugins = [];
        $directories = File::directories($this->pluginPath);

        foreach ($directories as $directory) {
            if ($this->isMarkedUninstalled($directory)) {
                continue;
            }
            $manifestPath = $directory . '/plugin.json';
            if (File::exists($manifestPath)) {
                $manifest = json_decode(File::get($manifestPath), true);
                if (!$manifest || !is_array($manifest)) {
                    continue;
                }

                $folderName = basename($directory);
                if (!$this->isValidManifest($manifest, $folderName)) {
                    continue;
                }

                $plugins[] = $this->syncPlugin($manifest, $directory);
            }
        }

        return $plugins;
    }

    protected function isMarkedUninstalled(string $pluginDirectory): bool
    {
        return File::exists(rtrim($pluginDirectory, '/') . '/' . $this->uninstallMarker);
    }

    protected function findPluginDirectoryBySlug(string $slug): ?string
    {
        if (!File::exists($this->pluginPath)) {
            return null;
        }

        foreach (File::directories($this->pluginPath) as $directory) {
            $manifestPath = $directory . '/plugin.json';
            if (!File::exists($manifestPath)) {
                continue;
            }

            $manifest = json_decode(File::get($manifestPath), true);
            if (!is_array($manifest)) {
                continue;
            }

            if (($manifest['slug'] ?? null) === $slug) {
                return $directory;
            }
        }

        return null;
    }

    protected function isValidManifest(array $manifest, string $folderName): bool
    {
        $required = ['name', 'slug', 'version', 'service_provider'];
        foreach ($required as $key) {
            if (!array_key_exists($key, $manifest)) {
                return false;
            }
        }

        if (!is_string($manifest['name']) || trim($manifest['name']) === '') {
            return false;
        }
        if (!is_string($manifest['slug']) || trim($manifest['slug']) === '') {
            return false;
        }
        if (!is_string($manifest['version']) || trim($manifest['version']) === '') {
            return false;
        }

        $provider = $manifest['service_provider'];
        if (!is_string($provider) || trim($provider) === '') {
            return false;
        }

        // Basic safety: no traversal-like patterns
        if (str_contains($provider, '..')) {
            return false;
        }

        // Convention: provider must be in Plugins\<FolderName>\...
        if (!Str::startsWith($provider, 'Plugins\\' . $folderName . '\\')) {
            return false;
        }

        return true;
    }

    /**
     * Sync plugin manifest with database.
     */
    protected function syncPlugin(array $manifest, string $path): Plugin
    {
        $plugin = Plugin::where('slug', $manifest['slug'])->first();
        
        $data = [
            'name' => (string) $manifest['name'],
            'version' => (string) $manifest['version'],
            'description' => $manifest['description'] ?? null,
            'author' => $manifest['author'] ?? null,
            'service_provider' => $manifest['service_provider'] ?? null,
        ];

        // If plugin doesn't exist, initialize with manifest settings
        if (!$plugin && isset($manifest['settings'])) {
            $data['settings'] = $manifest['settings'];
        }

        return Plugin::updateOrCreate(
            ['slug' => $manifest['slug']],
            $data
        );
    }

    /**
     * Activate a plugin.
     */
    public function activate(string $slug): bool
    {
        $plugin = Plugin::where('slug', $slug)->first();
        if (!$plugin) {
            return false;
        }

        // Run plugin migrations and seeder on first activation
        $wasInactive = !$plugin->is_active;
        
        $plugin->update(['is_active' => true]);
        
        if ($wasInactive) {
            $this->runPluginSetup($slug);
        }
        
        return true;
    }

    /**
     * Run plugin migrations and seeder.
     */
    protected function runPluginSetup(string $slug): void
    {
        $pluginDir = $this->findPluginDirectoryBySlug($slug);
        if (!$pluginDir) {
            return;
        }

        $manifestPath = $pluginDir . '/plugin.json';
        if (!File::exists($manifestPath)) {
            return;
        }

        $manifest = json_decode(File::get($manifestPath), true);
        if (!is_array($manifest)) {
            return;
        }

        // Run migrations if path specified
        if (!empty($manifest['migrations_path'])) {
            $migrationsPath = $pluginDir . '/' . ltrim($manifest['migrations_path'], '/');
            if (File::isDirectory($migrationsPath)) {
                try {
                    Artisan::call('migrate', [
                        '--path' => str_replace(base_path() . '/', '', $migrationsPath),
                        '--force' => true,
                    ]);
                    Log::info("Plugin '{$slug}' migrations executed successfully.");
                } catch (\Throwable $e) {
                    Log::error("Plugin '{$slug}' migration failed: " . $e->getMessage());
                }
            }
        }

        // Run seeder if specified
        if (!empty($manifest['seeder'])) {
            $seederClass = $manifest['seeder'];
            if (class_exists($seederClass)) {
                try {
                    Artisan::call('db:seed', [
                        '--class' => $seederClass,
                        '--force' => true,
                    ]);
                    Log::info("Plugin '{$slug}' seeder executed successfully.");
                } catch (\Throwable $e) {
                    Log::error("Plugin '{$slug}' seeder failed: " . $e->getMessage());
                }
            }
        }
    }

    /**
     * Deactivate a plugin.
     */
    public function deactivate(string $slug): bool
    {
        $plugin = Plugin::where('slug', $slug)->first();
        if (!$plugin) {
            return false;
        }

        $plugin->update(['is_active' => false]);
        
        return true;
    }

    /**
     * Update plugin settings.
     */
    public function updateSettings(string $slug, array $settings): bool
    {
        $plugin = Plugin::where('slug', $slug)->first();
        if (!$plugin) {
            return false;
        }

        $plugin->update(['settings' => array_merge($plugin->settings ?? [], $settings)]);
        
        return true;
    }

    /**
     * Delete/Uninstall a plugin.
     */
    public function uninstall(string $slug): bool
    {
        $plugin = Plugin::where('slug', $slug)->first();
        if (!$plugin) {
            return false;
        }

        // Deactivate first to prevent it from being loaded in the current request lifecycle
        try {
            $plugin->update(['is_active' => false]);
        } catch (\Throwable $e) {
            // best effort
        }

        // Persist uninstall intent: mark plugin folder so filesystem discovery won't re-add it
        $dir = $this->findPluginDirectoryBySlug($slug);
        if ($dir) {
            try {
                File::put(rtrim($dir, '/') . '/' . $this->uninstallMarker, (string) now());
            } catch (\Throwable $e) {
                // If we can't mark it, don't delete the DB row; otherwise it will re-discover
                return false;
            }
        }

        // Run plugin-specific uninstall logic if needed
        $plugin->delete();
        
        // Note: We don't delete the files automatically for safety, 
        // just remove from DB and deactivate.
        
        return true;
    }

    /**
     * Get all active plugins.
     */
    public function getActivePlugins()
    {
        return Plugin::active()->get();
    }
}
