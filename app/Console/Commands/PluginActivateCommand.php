<?php

namespace App\Console\Commands;

use App\Services\PluginManager;
use Illuminate\Console\Command;

class PluginActivateCommand extends Command
{
    protected $signature = 'plugin:activate {slug} {--off : Deactivate instead}';

    protected $description = 'Activate or deactivate an installed plugin';

    public function handle(PluginManager $manager): int
    {
        $slug = (string) $this->argument('slug');
        $deactivating = (bool) $this->option('off');

        $ok = $deactivating ? $manager->deactivate($slug) : $manager->activate($slug);

        if (! $ok) {
            $this->error($manager->getLastError() ?? 'Failed.');

            return self::FAILURE;
        }

        $this->info($slug.' '.($deactivating ? 'deactivated' : 'activated').'.');

        return self::SUCCESS;
    }
}
