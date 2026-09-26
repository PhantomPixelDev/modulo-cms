<?php

namespace App\Services;

use App\Models\Plugin;
use App\Plugins\BasePluginServiceProvider;
use App\Services\Plugins\PluginRequirements;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;
use Symfony\Component\Process\PhpExecutableFinder;

class PluginManager
{
    /**
     * Legacy marker, written inside the plugin's own directory.
     *
     * Still read so an existing install keeps its uninstall decisions, but no
     * longer written: replacing a package during an update wipes anything
     * inside it, which silently resurrected plugins an operator had removed.
     */
    protected string $uninstallMarker = '.modulo-uninstalled';

    protected ?string $lastError = null;

    protected function pluginPath(): string
    {
        $path = (string) config('plugins.path', base_path('plugins'));

        if (! File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }

        return $path;
    }

    /**
     * Plugin directories, excluding dot-prefixed ones.
     *
     * Installs and syncs stage a package next to its destination -- a rename
     * only works within one filesystem, and in Docker the plugins directory is
     * its own volume -- so a half-copied package must never be discovered.
     *
     * @return array<int, string>
     */
    public function pluginDirectories(): array
    {
        if (! File::isDirectory($this->pluginPath())) {
            return [];
        }

        return array_values(array_filter(
            File::directories($this->pluginPath()),
            fn (string $directory) => ! str_starts_with(basename($directory), '.'),
        ));
    }

    protected function uninstallPath(): string
    {
        return (string) config('plugins.uninstall_path', storage_path('app/plugins/uninstalled'));
    }

    /**
     * Discover plugins in the plugins directory.
     */
    public function discover(): array
    {
        $this->lastError = null;

        if (! File::exists($this->pluginPath())) {
            return [];
        }

        $plugins = [];
        $directories = $this->pluginDirectories();

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
        foreach ($this->pluginDirectories() as $directory) {
            $marker = rtrim($directory, '/').'/'.$this->uninstallMarker;
            if (File::exists($marker)) {
                File::delete($marker);
            }
        }

        if (File::isDirectory($this->uninstallPath())) {
            File::cleanDirectory($this->uninstallPath());
        }

        Cache::forget($this->discoveryCacheKey());

        return $this->discover();
    }

    /**
     * Re-read one plugin from disk, clearing any uninstall record for it.
     *
     * Used after installing or updating a package: full rediscovery would
     * also resurrect every other plugin an operator had deliberately removed.
     */
    public function rediscoverSlug(string $slug): void
    {
        File::delete($this->uninstallRecordPath($slug));

        $directory = $this->findPluginDirectoryBySlug($slug);

        if ($directory !== null) {
            File::delete(rtrim($directory, '/').'/'.$this->uninstallMarker);
        }

        Cache::forget($this->discoveryCacheKey());

        $this->discover();
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
        if (! File::exists($this->pluginPath())) {
            return 'none';
        }

        $directories = $this->pluginDirectories();
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
        return rtrim($this->uninstallPath(), '/').'/'.$slug.'.json';
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
        if (! File::exists($this->pluginPath())) {
            return null;
        }

        foreach ($this->pluginDirectories() as $directory) {
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
            'requires' => PluginRequirements::fromManifest($manifest),
            'min_core_version' => is_string($manifest['requires']['core'] ?? null)
                ? PluginRequirements::minimumOf($manifest['requires']['core'])
                : ($manifest['min_core_version'] ?? null),
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

            $this->callLifecycle($data['service_provider'], 'onUpgrade', [$recorded, $onDisk]);
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
            $exitCode = Artisan::call('migrate', [
                '--path' => $this->relativeMigrationPath($migrationsPath),
                '--realpath' => ! Str::startsWith($migrationsPath, base_path()),
                '--force' => true,
            ]);

            // The exit code, not the output: a migration named
            // "create_error_log_table" is not a failure.
            if ($exitCode !== 0) {
                return [false, "Plugin '{$slug}' migration failed: ".trim(Artisan::output())];
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

        // Checked against the manifest on disk: that is the code about to run.
        $manifest = $this->manifestFor($slug) ?? ['requires' => $plugin->requires, 'min_core_version' => $plugin->min_core_version];
        $unmet = app(PluginRequirements::class)->unmet($manifest);

        if ($unmet !== []) {
            $this->lastError = "{$plugin->name} needs ".implode(', ', $unmet).'.';

            return false;
        }

        // Migrations and seeder run whenever the plugin goes from inactive to
        // active, not only the first time -- a plugin updated while switched
        // off catches up here. Plugin seeders must therefore be idempotent
        // (firstOrCreate / updateOrCreate), as the bundled ones are.
        $wasInactive = ! $plugin->is_active;

        $plugin->update(['is_active' => true]);

        if ($wasInactive) {
            [$ok, $error] = $this->runPluginSetup($slug);

            if (! $ok) {
                $plugin->update(['is_active' => false]);
                $this->lastError = $error ?? 'Plugin setup failed.';

                return false;
            }

            try {
                $this->callLifecycle($plugin->service_provider, 'onActivate', [], rethrow: true);
            } catch (\Throwable $e) {
                $plugin->update(['is_active' => false]);
                $this->lastError = "{$plugin->name} could not be activated: ".$e->getMessage();

                return false;
            }

            $this->refreshRouteCache();
        }

        return true;
    }

    /**
     * The plugin.json on disk for an installed plugin.
     *
     * @return array<string, mixed>|null
     */
    protected function manifestFor(string $slug): ?array
    {
        $directory = $this->findPluginDirectoryBySlug($slug);

        if ($directory === null || ! File::exists($directory.'/plugin.json')) {
            return null;
        }

        $manifest = json_decode((string) File::get($directory.'/plugin.json'), true);

        return is_array($manifest) ? $manifest : null;
    }

    /**
     * Run a lifecycle hook on a fresh instance of the plugin's provider.
     *
     * @param  array<int, mixed>  $arguments
     */
    protected function callLifecycle(?string $providerClass, string $hook, array $arguments = [], bool $rethrow = false): void
    {
        if ($providerClass === null || ! class_exists($providerClass) || ! is_subclass_of($providerClass, BasePluginServiceProvider::class)) {
            return;
        }

        try {
            (new $providerClass(app()))->{$hook}(...$arguments);
        } catch (\Throwable $e) {
            Log::error("Plugin lifecycle hook {$providerClass}::{$hook}() failed: ".$e->getMessage());

            if ($rethrow) {
                throw $e;
            }
        }
    }

    /**
     * Refuse to take away a plugin other active plugins declare they need.
     */
    protected function blockedByDependents(Plugin $plugin): bool
    {
        $dependents = app(PluginRequirements::class)->dependents($plugin->slug);

        if ($dependents === []) {
            return false;
        }

        $this->lastError = sprintf('%s is needed by %s. Deactivate %s first.',
            $plugin->name, implode(', ', $dependents), count($dependents) === 1 ? 'it' : 'them');

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
                    $exitCode = Artisan::call('db:seed', [
                        '--class' => $seederClass,
                        '--force' => true,
                    ]);

                    if ($exitCode !== 0) {
                        return [false, "Plugin '{$slug}' seeder failed: ".trim(Artisan::output())];
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

        if ($plugin->is_active && $this->blockedByDependents($plugin)) {
            return false;
        }

        $wasActive = $plugin->is_active;

        $plugin->update(['is_active' => false]);
        $this->callLifecycle($plugin->service_provider, 'onDeactivate');

        if ($wasActive) {
            $this->refreshRouteCache();
        }

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
    public function uninstall(string $slug, bool $deleteData = false): bool
    {
        $this->lastError = null;

        $plugin = Plugin::where('slug', $slug)->first();
        if (! $plugin) {
            $this->lastError = 'Plugin not found.';

            return false;
        }

        if ($this->blockedByDependents($plugin)) {
            return false;
        }

        $this->callLifecycle($plugin->service_provider, 'onUninstall', [$deleteData]);

        if ($deleteData && ! $this->dropPluginData($slug)) {
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
            File::ensureDirectoryExists($this->uninstallPath());
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

        $this->refreshRouteCache();

        // Note: We don't delete the files automatically for safety,
        // just remove from DB and deactivate.

        return true;
    }

    /**
     * Roll back every migration the plugin shipped, dropping its tables.
     */
    protected function dropPluginData(string $slug): bool
    {
        $manifest = $this->manifestFor($slug);
        $directory = $this->findPluginDirectoryBySlug($slug);

        if ($manifest === null || $directory === null || empty($manifest['migrations_path'])) {
            return true;
        }

        $path = $directory.'/'.ltrim((string) $manifest['migrations_path'], '/');

        if (! File::isDirectory($path)) {
            return true;
        }

        try {
            $exitCode = Artisan::call('migrate:reset', [
                '--path' => $this->relativeMigrationPath($path),
                '--realpath' => ! Str::startsWith($path, base_path()),
                '--force' => true,
            ]);
        } catch (\Throwable $e) {
            $this->lastError = "Could not remove the plugin's data: ".$e->getMessage();

            return false;
        }

        if ($exitCode !== 0) {
            $this->lastError = "Could not remove the plugin's data: ".trim(Artisan::output());

            return false;
        }

        return true;
    }

    /**
     * Plugins add their routes when their provider boots, so a cached route
     * table (production) goes stale whenever one is switched on, off or
     * replaced: its pages 404, or keep answering after it was removed.
     *
     * Dropping the cache is safe in-process. Rebuilding is not -- route:cache
     * boots a second application, which must not happen inside a web request
     * -- so that runs as its own process. If it fails the site keeps working
     * from uncached routes until the next deploy rebuilds them.
     */
    public function refreshRouteCache(): void
    {
        // The file itself, not routesAreCached(): what matters is whether a
        // stale table is on disk now for the next request to load.
        if (! File::exists(app()->getCachedRoutesPath())) {
            return;
        }

        Artisan::call('route:clear');

        try {
            $result = Process::path(base_path())
                ->timeout(120)
                ->run([(new PhpExecutableFinder)->find(false) ?: 'php', 'artisan', 'route:cache']);

            if ($result->failed()) {
                Log::warning('Could not rebuild the route cache after a plugin change: '.trim($result->errorOutput() ?: $result->output()));
            }
        } catch (\Throwable $e) {
            Log::warning('Could not rebuild the route cache after a plugin change: '.$e->getMessage());
        }
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

    /** @var array<string, array<string, mixed>|null> */
    protected array $manifests = [];

    /**
     * A plugin's plugin.json, read once per request.
     *
     * @return array<string, mixed>|null
     */
    public function manifest(string $slug): ?array
    {
        if (! array_key_exists($slug, $this->manifests)) {
            $directory = $this->findPluginDirectoryBySlug($slug);
            $manifest = $directory !== null ? json_decode((string) File::get($directory.'/plugin.json'), true) : null;
            $this->manifests[$slug] = is_array($manifest) ? $manifest : null;
        }

        return $this->manifests[$slug];
    }
}
