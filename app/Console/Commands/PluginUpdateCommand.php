<?php

namespace App\Console\Commands;

use App\Models\Plugin;
use App\Services\Plugins\PluginInstaller;
use App\Services\Plugins\PluginRegistry;
use Illuminate\Console\Command;
use Throwable;

class PluginUpdateCommand extends Command
{
    protected $signature = 'plugin:update {slug? : Plugin to update; omit with --all}
        {--all : Update every plugin that has a newer release}';

    protected $description = 'Update installed plugins from the registry';

    public function handle(PluginRegistry $registry, PluginInstaller $installer): int
    {
        $slug = $this->argument('slug');

        if ($slug === null && ! $this->option('all')) {
            $this->error('Name a plugin, or pass --all.');

            return self::FAILURE;
        }

        $installed = Plugin::query()
            ->when($slug !== null, fn ($q) => $q->where('slug', $slug))
            ->pluck('version', 'slug')
            ->all();

        if ($installed === []) {
            $this->error($slug !== null ? "Plugin '{$slug}' is not installed." : 'No plugins installed.');

            return self::FAILURE;
        }

        try {
            $updates = $registry->updatesFor($installed, force: true);
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        if ($updates === []) {
            $this->info('Everything is up to date.');

            return self::SUCCESS;
        }

        $failed = 0;

        foreach ($updates as $update) {
            $this->line(sprintf('%s %s -> %s', $update['slug'], $update['installed'], $update['available']));

            try {
                $installer->install($update['slug']);
                $this->info('  updated.');
            } catch (Throwable $e) {
                // Keep going: one bad package should not block the rest.
                $this->error('  failed: '.$e->getMessage());
                $failed++;
            }
        }

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
