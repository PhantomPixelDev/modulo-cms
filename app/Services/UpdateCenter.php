<?php

namespace App\Services;

use App\Models\Plugin;
use App\Services\Plugins\PluginRegistry;
use App\Support\SystemMeta;
use App\Support\Version;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Everything that can be updated on this site, in one place: core releases
 * and registry plugins.
 *
 * Checking talks to the network and is done by the daily scheduled
 * `modulo:check-updates` (or the admin's "Check now"); the results are stored
 * (core in the cache, plugins on their rows) so reading them -- the Updates
 * page, the sidebar badge -- never makes a request.
 */
class UpdateCenter
{
    public const PENDING_CACHE_KEY = 'modulo:updates-pending';

    public const LAST_CHECKED_KEY = 'updates_last_checked_at';

    public function __construct(
        protected UpdateChecker $checker,
        protected PluginRegistry $registry,
    ) {}

    /**
     * Ask the release feed and the plugin registry, and store the answers.
     *
     * @return array{core: array<string, mixed>, plugins: array<int, array<string, mixed>>, plugin_error: string|null}
     */
    public function refresh(): array
    {
        $core = $this->checker->check(force: true);
        $pluginError = $this->refreshPlugins();

        SystemMeta::put(self::LAST_CHECKED_KEY, now()->toIso8601String());
        Cache::forget(self::PENDING_CACHE_KEY);

        return ['core' => $core, 'plugins' => $this->pluginUpdates(), 'plugin_error' => $pluginError];
    }

    /**
     * What the Updates page shows. Uses the stored results; the core check
     * is only made here when nothing is cached yet.
     *
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        $core = $this->checker->check();
        $plugins = $this->pluginUpdates();

        return [
            'core' => $core,
            'commands' => $this->checker->upgradeCommands($core['latest'] ?? null),
            'plugins' => $plugins,
            'installedPlugins' => $this->installedPlugins(),
            'lastCheckedAt' => SystemMeta::get(self::LAST_CHECKED_KEY),
            'pending' => ($core['available'] ? 1 : 0) + count($plugins),
            'enabled' => (bool) config('updates.enabled'),
            'isDev' => Version::isDev(),
        ];
    }

    /**
     * Updates waiting to be applied, for the sidebar badge. Never makes a
     * network request, and at most one small query every few minutes.
     *
     * @return array{count: int, security: bool}
     */
    public function pending(): array
    {
        $value = Cache::remember(self::PENDING_CACHE_KEY, 300, function () {
            $core = $this->checker->cached();

            return [
                'count' => (($core['available'] ?? false) ? 1 : 0) + count($this->pluginUpdates()),
                'security' => (bool) ($core['security'] ?? false),
            ];
        });

        return is_array($value) ? $value : ['count' => 0, 'security' => false];
    }

    public function forgetPending(): void
    {
        Cache::forget(self::PENDING_CACHE_KEY);
    }

    /**
     * Plugins whose registry release is newer than the installed one, as
     * stored by the last check.
     *
     * @return array<int, array{slug: string, name: string, installed: string, available: string, active: bool, checked_at: string|null}>
     */
    public function pluginUpdates(): array
    {
        if (! schema_has_table('plugins')) {
            return [];
        }

        return Plugin::query()
            ->whereNotNull('available_version')
            ->orderBy('name')
            ->get()
            ->filter(fn (Plugin $plugin) => version_compare(
                Version::normalize((string) $plugin->available_version),
                Version::normalize((string) $plugin->version),
                '>',
            ))
            ->map(fn (Plugin $plugin) => [
                'slug' => $plugin->slug,
                'name' => $plugin->name,
                'installed' => (string) $plugin->version,
                'available' => (string) $plugin->available_version,
                'active' => (bool) $plugin->is_active,
                'checked_at' => $plugin->last_checked_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{slug: string, name: string, version: string, source: string|null, active: bool}>
     */
    protected function installedPlugins(): array
    {
        if (! schema_has_table('plugins')) {
            return [];
        }

        return Plugin::query()->orderBy('name')->get()
            ->map(fn (Plugin $plugin) => [
                'slug' => $plugin->slug,
                'name' => $plugin->name,
                'version' => (string) $plugin->version,
                'source' => $plugin->source,
                'active' => (bool) $plugin->is_active,
            ])
            ->all();
    }

    /**
     * Record the newest registry release on every installed plugin row.
     *
     * @return string|null The error, when the registry could not be read
     */
    protected function refreshPlugins(): ?string
    {
        if (! schema_has_table('plugins')) {
            return null;
        }

        $installed = Plugin::query()->pluck('version', 'slug')->map(fn ($v) => (string) $v)->all();

        if ($installed === []) {
            return null;
        }

        try {
            $updates = collect($this->registry->updatesFor($installed, force: true))->keyBy('slug');
        } catch (Throwable $e) {
            return $e->getMessage();
        }

        $now = Carbon::now();

        foreach (array_keys($installed) as $slug) {
            Plugin::query()->where('slug', $slug)->update([
                'available_version' => $updates->has($slug) ? $updates[$slug]['available'] : null,
                'last_checked_at' => $now,
            ]);
        }

        return null;
    }
}
