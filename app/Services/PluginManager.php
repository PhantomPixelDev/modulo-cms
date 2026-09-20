<?php

namespace App\Services;

use App\Models\Plugin;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PluginManager
{
    protected string $pluginPath;

    protected string $uninstallPath;

    /**
     * Legacy marker, written inside the plugin's own directory.
     *
     * Still read so an existing install keeps its uninstall decisions, but no
     * longer written: replacing a package during an update wipes anything
     * inside it, which silently resurrected plugins an operator had removed.
     */
    protected string $uninstallMarker = '.modulo-uninstalled';

    protected ?string $lastError = null;

    public function __construct()
    {
        $this->pluginPath = (string) config('plugins.path', base_path('plugins'));
        $this->uninstallPath = (string) config('plugins.uninstall_path', storage_path('app/plugins/uninstalled'));

        if (! File::exists($this->pluginPath)) {
            File::makeDirectory($this->pluginPath, 0755, true);
        }
    }

    /**
     * Discover plugins in the plugins directory.
     */
    public function discover(): array
    {
        $this->lastError = null;

        if (! File::exists($this->pluginPath)) {
            return [];
        }

        $plugins = [];
        $directories = File::directories($this->pluginPath);

        foreach ($directories as $directory) {
            if ($this->isMarkedUninstalled($directory)) {
                continue;
            }
            $manifestPath = $directory.'/plugin.json';
            if (File::exists($manifestPath)) {
                $manifest = json_decode(File::get($manifestPath), true);
                if (! $manifest || ! is_array($manifest)) {
                    continue;
                }

                $folderName = basename($directory);
                $rejection = $this->rejectionReason($manifest, $folderName);

                if ($rejection !== null) {
                    // Silently vanishing is the worst failure a plugin author
                    // can hit: nothing appears and nothing explains why.
                    $this->lastError = "Skipped '{$folderName}': {$rejection}";
                    Log::warning('Plugin discovery skipped a package.', [
                        'directory' => $folderName,
                        'reason' => $rejection,
                    ]);

                    continue;
                }

                $plugins[] = $this->syncPlugin($manifest, $directory);
            }
        }

        return $plugins;
    }

    /**
     * Explicit "sync from filesystem": also clears uninstall markers, so a
     * previously uninstalled plugin can be installed again from the admin.
     */
    public function rediscover(): array
    {
        foreach (File::directories($this->pluginPath) as $directory) {
            $marker = rtrim($directory, '/').'/'.$this->uninstallMarker;
            if (File::exists($marker)) {
                File::delete($marker);
            }
        }

        if (File::isDirectory($this->uninstallPath)) {
            File::cleanDirectory($this->uninstallPath);
        }

        Cache::forget($this->discoveryCacheKey());

        return $this->discover();
    }

    /**
     * Sync filesystem plugins into DB only when plugin manifests changed.
     */
    public function syncDiscoveredPluginsCached(): void
    {
        $cacheKey = $this->discoveryCacheKey();
        $fingerprint = $this->getDiscoveryFingerprint();

        if (Cache::get($cacheKey) === $fingerprint) {
            return;
        }

        $this->discover();
        Cache::forever($cacheKey, $fingerprint);
    }

    /**
     * Cache key for the discovery fingerprint.
     *
     * Versioned because the fingerprint's inputs changed when uninstall
     * records moved out of the package directory: a stale entry from before
     * that change would skip rediscovery on the first request after upgrading.
     */
    protected function discoveryCacheKey(): string
    {
        return 'plugins.discovery.fingerprint.v2';
    }

    /**
     * Build a stable fingerprint for plugin discovery inputs.
     */
    protected function getDiscoveryFingerprint(): string
    {
        if (! File::exists($this->pluginPath)) {
            return 'none';
        }

        $directories = File::directories($this->pluginPath);
        sort($directories);

        $parts = [];
        foreach ($directories as $directory) {
            $name = basename($directory);
            $manifestPath = $directory.'/plugin.json';
            $markerPath = rtrim($directory, '/').'/'.$this->uninstallMarker;

            $manifestMtime = File::exists($manifestPath) ? (string) @filemtime($manifestPath) : 'none';
            $manifestSize = File::exists($manifestPath) ? (string) @filesize($manifestPath) : 'none';
            $markerMtime = File::exists($markerPath) ? (string) @filemtime($markerPath) : 'none';

            $slug = $this->slugForDirectory($directory);
            $recordPath = $slug !== null ? $this->uninstallRecordPath($slug) : null;
            $recordMtime = $recordPath !== null && File::exists($recordPath)
                ? (string) @filemtime($recordPath)
                : 'none';

            $parts[] = implode('|', [$name, $manifestMtime, $manifestSize, $markerMtime, $recordMtime]);
        }

        return sha1(implode(';', $parts));
    }

    /**
     * Whether this package has been uninstalled.
     *
     * Checks the record kept outside the package, then the legacy marker that
     * older installs wrote inside it.
     */
    protected function isMarkedUninstalled(string $pluginDirectory): bool
    {
        if (File::exists(rtrim($pluginDirectory, '/').'/'.$this->uninstallMarker)) {
            return true;
        }

        $slug = $this->slugForDirectory($pluginDirectory);

        return $slug !== null && File::exists($this->uninstallRecordPath($slug));
    }

    protected function uninstallRecordPath(string $slug): string
    {
        return rtrim($this->uninstallPath, '/').'/'.$slug.'.json';
    }

    protected function slugForDirectory(string $directory): ?string
    {
        $manifestPath = rtrim($directory, '/').'/plugin.json';

        if (! File::exists($manifestPath)) {
            return null;
        }

        $manifest = json_decode(File::get($manifestPath), true);

        return is_array($manifest) && isset($manifest['slug']) ? (string) $manifest['slug'] : null;
    }

    protected function findPluginDirectoryBySlug(string $slug): ?string
    {
        if (! File::exists($this->pluginPath)) {
            return null;
        }

        foreach (File::directories($this->pluginPath) as $directory) {
            $manifestPath = $directory.'/plugin.json';
            if (! File::exists($manifestPath)) {
                continue;
            }

            $manifest = json_decode(File::get($manifestPath), true);
            if (! is_array($manifest)) {
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
        return $this->rejectionReason($manifest, $folderName) === null;
    }

    /**
     * Why this manifest cannot be loaded, or null when it can.
     *
     * Returns a reason rather than a boolean so discovery can say what is
     * wrong instead of skipping the package without a word.
     */
    protected function rejectionReason(array $manifest, string $folderName): ?string
    {
        foreach (['name', 'slug', 'version', 'service_provider'] as $key) {
            if (! array_key_exists($key, $manifest)) {
                return 'plugin.json is missing "'.$key.'".';
            }

            if (! is_string($manifest[$key]) || trim((string) $manifest[$key]) === '') {
                return 'plugin.json has an empty "'.$key.'".';
            }
        }

        if (! preg_match('/^[a-z0-9-]+$/', $manifest['slug'])) {
            return 'the slug must be lowercase letters, numbers and hyphens.';
        }

        if (! preg_match(ThemeValidator::SEMVER_PATTERN, $manifest['version'])) {
            return 'the version "'.$manifest['version'].'" is not semantic versioning (e.g. 1.0.0 or 1.0.0-beta.1).';
        }

        $provider = $manifest['service_provider'];

        if (str_contains($provider, '..')) {
            return 'the service provider contains a path traversal pattern.';
        }

        // The namespace and the directory name are one contract: PSR-4 resolves
        // the Plugins namespace by path, so a mismatch means the class never loads.
        $expected = $this->expectedNamespace($manifest, $folderName);

        if (! Str::startsWith($provider, $expected.'\\')) {
            return 'the service provider must start with "'.$expected.'\\" to match the directory name.';
        }

        return null;
    }

    /**
     * The namespace a package's classes must live under.
     *
     * A manifest may declare it explicitly, which matters for remote installs:
     * a GitHub archive always extracts as <repo>-<ref>, so the directory name
     * cannot be trusted to carry the contract on its own.
     */
    protected function expectedNamespace(array $manifest, string $folderName): string
    {
        $declared = $manifest['namespace'] ?? null;

        if (is_string($declared) && trim($declared) !== '') {
            return 'Plugins\\'.trim($declared, '\\');
        }

        return 'Plugins\\'.$folderName;
    }

    /**
     * Reconcile a manifest on disk with what the database records.
     *
     * The version is compared rather than overwritten. Blindly writing whatever
     * the manifest said meant that replacing a plugin's files bumped the
     * recorded version and never ran the migrations that came with it, leaving
     * the plugin pointing at tables that did not exist.
     */
    protected function syncPlugin(array $manifest, string $path): Plugin
    {
        $plugin = Plugin::where('slug', $manifest['slug'])->first();

        $data = [
            'name' => (string) $manifest['name'],
            'description' => $manifest['description'] ?? null,
            'author' => $manifest['author'] ?? null,
            'service_provider' => $manifest['service_provider'] ?? null,
        ];

        if (! $plugin) {
            $data['version'] = (string) $manifest['version'];
            $data['installed_at'] = now();

            if (isset($manifest['settings'])) {
                $data['settings'] = $manifest['settings'];
            }

            return Plugin::create(['slug' => $manifest['slug']] + $data);
        }

        $onDisk = (string) $manifest['version'];
        $recorded = (string) $plugin->version;
        $comparison = version_compare($onDisk, $recorded);

        if ($comparison > 0) {
            // Migrations first: if they fail the recorded version stays behind,
            // so the upgrade is retried rather than silently assumed done.
            [$ok, $error] = $this->runPluginMigrations($manifest, $path);

            if (! $ok) {
                $this->lastError = $error;
                Log::error("Plugin '{$manifest['slug']}' update failed; keeping version {$recorded}.", [
                    'error' => $error,
                ]);

                $plugin->update($data);

                return $plugin;
            }

            $data['version'] = $onDisk;
            Log::info("Plugin '{$manifest['slug']}' updated from {$recorded} to {$onDisk}.");
        } elseif ($comparison < 0) {
            // Older files than the database expects. Rolling back a plugin's
            // schema is not something this can do safely, so record the
            // mismatch and leave the version alone.
            $this->lastError = "Plugin '{$manifest['slug']}' on disk is {$onDisk}, older than the installed {$recorded}.";
            Log::warning($this->lastError);
        }

        if ($plugin->installed_at === null) {
            $data['installed_at'] = now();
        }

        $plugin->update($data);

        return $plugin->refresh();
    }

    /**
     * Run a plugin's migrations.
     *
     * Split out of runPluginSetup() so an update runs them too. Previously they
     * only ran on first activation, which is why updating a plugin never
     * applied the schema changes it shipped with.
     *
     * @return array{0: bool, 1: string|null}
     */
    protected function runPluginMigrations(array $manifest, string $pluginDir): array
    {
        if (empty($manifest['migrations_path'])) {
            return [true, null];
        }

        $migrationsPath = $pluginDir.'/'.ltrim((string) $manifest['migrations_path'], '/');

        if (! File::isDirectory($migrationsPath)) {
            return [true, null];
        }

        $slug = $manifest['slug'];

        try {
            Artisan::call('migrate', [
                '--path' => $this->relativeMigrationPath($migrationsPath),
                '--realpath' => ! Str::startsWith($migrationsPath, base_path()),
                '--force' => true,
            ]);

            $output = Artisan::output();

            if (str_contains(strtolower($output), 'error') || str_contains(strtolower($output), 'failed')) {
                return [false, "Plugin '{$slug}' migration reported an error."];
            }

            Log::info("Plugin '{$slug}' migrations executed successfully.");
        } catch (\Throwable $e) {
            Log::error("Plugin '{$slug}' migration failed: ".$e->getMessage());

            return [false, "Plugin migration failed: {$e->getMessage()}"];
        }

        return [true, null];
    }

    /**
     * Artisan wants a path relative to the project root, unless it is elsewhere
     * entirely -- which it is for a configured plugin directory outside it.
     */
    protected function relativeMigrationPath(string $migrationsPath): string
    {
        $base = base_path().DIRECTORY_SEPARATOR;
        $normalised = str_replace('\\', '/', $migrationsPath);
        $normalisedBase = str_replace('\\', '/', $base);

        if (Str::startsWith($normalised, $normalisedBase)) {
            return Str::after($normalised, $normalisedBase);
        }

        return $migrationsPath;
    }

    /**
     * Activate a plugin.
     */
    public function activate(string $slug): bool
    {
        $this->lastError = null;

        $plugin = Plugin::where('slug', $slug)->first();
        if (! $plugin) {
            $this->lastError = 'Plugin not found.';

            return false;
        }

        // Run plugin migrations and seeder on first activation
        $wasInactive = ! $plugin->is_active;

        $plugin->update(['is_active' => true]);

        if ($wasInactive) {
            [$ok, $error] = $this->runPluginSetup($slug);

            if (! $ok) {
                $plugin->update(['is_active' => false]);
                $this->lastError = $error ?? 'Plugin setup failed.';

                return false;
            }
        }

        return true;
    }

    /**
     * Run plugin migrations and seeder.
     */
    protected function runPluginSetup(string $slug): array
    {
        $pluginDir = $this->findPluginDirectoryBySlug($slug);
        if (! $pluginDir) {
            return [false, "Plugin directory not found for '{$slug}'."];
        }

        $manifestPath = $pluginDir.'/plugin.json';
        if (! File::exists($manifestPath)) {
            return [false, "Plugin manifest not found for '{$slug}'."];
        }

        $manifest = json_decode(File::get($manifestPath), true);
        if (! is_array($manifest)) {
            return [false, "Plugin manifest is invalid for '{$slug}'."];
        }

        [$ok, $error] = $this->runPluginMigrations($manifest, $pluginDir);

        if (! $ok) {
            return [false, $error];
        }

        // Run seeder if specified
        if (! empty($manifest['seeder'])) {
            $seederClass = $manifest['seeder'];
            if (class_exists($seederClass)) {
                try {
                    Artisan::call('db:seed', [
                        '--class' => $seederClass,
                        '--force' => true,
                    ]);

                    $output = Artisan::output();
                    if (str_contains(strtolower($output), 'error') || str_contains(strtolower($output), 'failed')) {
                        return [false, "Plugin '{$slug}' seeder reported an error."];
                    }

                    Log::info("Plugin '{$slug}' seeder executed successfully.");
                } catch (\Throwable $e) {
                    Log::error("Plugin '{$slug}' seeder failed: ".$e->getMessage());

                    return [false, "Plugin seeder failed: {$e->getMessage()}"];
                }
            }
        }

        return [true, null];
    }

    /**
     * Deactivate a plugin.
     */
    public function deactivate(string $slug): bool
    {
        $this->lastError = null;

        $plugin = Plugin::where('slug', $slug)->first();
        if (! $plugin) {
            $this->lastError = 'Plugin not found.';

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
        $this->lastError = null;

        $plugin = Plugin::where('slug', $slug)->first();
        if (! $plugin) {
            $this->lastError = 'Plugin not found.';

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
        $this->lastError = null;

        $plugin = Plugin::where('slug', $slug)->first();
        if (! $plugin) {
            $this->lastError = 'Plugin not found.';

            return false;
        }

        // Deactivate first to prevent it from being loaded in the current request lifecycle
        try {
            $plugin->update(['is_active' => false]);
        } catch (\Throwable $e) {
            // best effort
        }

        // Record the intent outside the package. Writing it inside would be
        // destroyed the next time those files are replaced, silently bringing
        // back a plugin the operator removed.
        try {
            File::ensureDirectoryExists($this->uninstallPath);
            File::put($this->uninstallRecordPath($slug), json_encode([
                'slug' => $slug,
                'uninstalled_at' => now()->toIso8601String(),
                'version' => $plugin->version,
            ], JSON_PRETTY_PRINT));
        } catch (\Throwable $e) {
            // Without the record, discovery would re-add the row immediately,
            // so leave the database alone rather than flip-flopping.
            $this->lastError = 'Failed to record the uninstall: '.$e->getMessage();

            return false;
        }

        Cache::forget($this->discoveryCacheKey());

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

    public function getLastError(): ?string
    {
        return $this->lastError;
    }
}
