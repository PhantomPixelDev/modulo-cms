<?php

namespace App\Console\Commands;

use App\Models\Plugin;
use App\Services\PluginManager;
use App\Services\Plugins\PluginRegistry;
use Illuminate\Console\Command;
use Throwable;

/**
 * Manage plugins from the command line.
 *
 * Installing a plugin means running someone else's PHP as the application, so
 * this is deliberately explicit about where a package came from and what was
 * verified before it landed.
 */
class PluginCommand extends Command
{
    protected $signature = 'plugin:list {--updates : Only show plugins with a newer release}
        {--available : Show what the registry offers}
        {--refresh : Bypass the cached registry}';

    protected $description = 'List installed plugins, and updates available for them';

    public function handle(PluginRegistry $registry, PluginManager $manager): int
    {
        $manager->syncDiscoveredPluginsCached();

        if ($this->option('available')) {
            return $this->listAvailable($registry);
        }

        $installed = Plugin::orderBy('slug')->get();

        if ($installed->isEmpty()) {
            $this->info('No plugins installed.');

            return self::SUCCESS;
        }

        $updates = [];

        try {
            $updates = collect($registry->updatesFor(
                $installed->pluck('version', 'slug')->all(),
                (bool) $this->option('refresh'),
            ))->keyBy('slug');
        } catch (Throwable $e) {
            // A registry that is down must not stop someone listing what they
            // already have.
            $this->warn('Could not check for updates: '.$e->getMessage());
            $updates = collect();
        }

        $rows = $installed
            ->filter(fn (Plugin $p) => ! $this->option('updates') || $updates->has($p->slug))
            ->map(fn (Plugin $p) => [
                $p->slug,
                $p->version,
                $updates->get($p->slug)['available'] ?? '-',
                $p->is_active ? 'active' : 'inactive',
                $p->source ?? 'local',
            ])
            ->all();

        if ($rows === []) {
            $this->info($this->option('updates') ? 'Everything is up to date.' : 'No plugins installed.');

            return self::SUCCESS;
        }

        $this->table(['Slug', 'Installed', 'Available', 'State', 'Source'], $rows);

        return self::SUCCESS;
    }

    protected function listAvailable(PluginRegistry $registry): int
    {
        try {
            $entries = $registry->all((bool) $this->option('refresh'));
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        if ($entries === []) {
            $this->info('The registry lists no installable plugins.');

            return self::SUCCESS;
        }

        $this->table(
            ['Slug', 'Version', 'Requires', 'Name'],
            array_map(fn (array $e) => [
                $e['slug'],
                $e['latest']['version'] ?? '?',
                $e['latest']['min_core_version'] ?? 'any',
                $e['name'] ?? '',
            ], $entries),
        );

        return self::SUCCESS;
    }
}
