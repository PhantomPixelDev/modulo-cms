<?php

namespace App\Console\Commands;

use App\Models\Plugin;
use App\Services\PluginManager;
use App\Services\Plugins\PluginInstaller;
use Illuminate\Console\Command;
use Throwable;

class PluginInstallCommand extends Command
{
    protected $signature = 'plugin:install {slug : Plugin slug from the registry}
        {--release= : Install this exact version instead of the newest}
        {--activate : Activate it once installed}';

    protected $description = 'Install a plugin from the registry';

    public function handle(PluginInstaller $installer, PluginManager $manager): int
    {
        $slug = (string) $this->argument('slug');

        // Worth stating plainly: this is not sandboxed and cannot be.
        $this->warn('A plugin runs as part of the application, with the same access it has.');

        try {
            $result = $installer->install($slug, $this->option('release') ? (string) $this->option('release') : null);
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->info(sprintf(
            '%s %s %s (checksum verified against the registry).',
            $result['updated'] ? 'Updated' : 'Installed',
            $slug,
            $result['version'],
        ));

        if ($this->option('activate')) {
            if (! $manager->activate($slug)) {
                $this->error('Installed, but activation failed: '.($manager->getLastError() ?? 'unknown error'));

                return self::FAILURE;
            }

            $this->info('Activated.');
        } elseif (! Plugin::where('slug', $slug)->value('is_active')) {
            $this->line('Activate it with: php artisan plugin:activate '.$slug);
        }

        return self::SUCCESS;
    }
}
