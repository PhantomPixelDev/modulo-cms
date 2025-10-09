<?php

namespace App\Console\Commands;

use App\Services\ThemeManager;
use Illuminate\Console\Command;

class ThemeUninstallCommand extends Command
{
    protected $signature = 'theme:uninstall {slug : The theme slug to uninstall} {--force : Force uninstall without confirmation}';
    protected $description = 'Uninstall a theme';

    public function handle(ThemeManager $themeManager): int
    {
        $slug = $this->argument('slug');

        if (!$this->option('force')) {
            if (!$this->confirm("Are you sure you want to uninstall theme '{$slug}'?")) {
                $this->info('Uninstall cancelled.');
                return self::SUCCESS;
            }
        }

        try {
            $success = $themeManager->uninstallTheme($slug);

            if ($success) {
                $this->info("✓ Theme '{$slug}' uninstalled successfully!");
                return self::SUCCESS;
            } else {
                $this->error("Failed to uninstall theme '{$slug}'. It may be active or not found.");
                $this->comment("Tip: Activate another theme before uninstalling the active one.");
                return self::FAILURE;
            }
        } catch (\Exception $e) {
            $this->error("Error uninstalling theme: " . $e->getMessage());
            return self::FAILURE;
        }
    }
}
