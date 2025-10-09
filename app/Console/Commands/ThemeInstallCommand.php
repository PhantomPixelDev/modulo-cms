<?php

namespace App\Console\Commands;

use App\Services\ThemeManager;
use Illuminate\Console\Command;

class ThemeInstallCommand extends Command
{
    protected $signature = 'theme:install {slug : The theme slug to install}';
    protected $description = 'Install a theme from the themes directory';

    public function handle(ThemeManager $themeManager): int
    {
        $slug = $this->argument('slug');

        $this->info("Discovering themes...");
        $discovered = $themeManager->discoverThemes();
        $theme = $discovered->firstWhere('config.slug', $slug);

        if (!$theme) {
            $this->error("Theme '{$slug}' not found in themes directory.");
            $this->line("\nAvailable themes:");
            foreach ($discovered as $t) {
                $this->line("  - {$t['config']['slug']} ({$t['config']['name']})");
            }
            return self::FAILURE;
        }

        try {
            $this->info("Installing theme '{$theme['config']['name']}'...");
            $installed = $themeManager->installTheme($theme, null);
            
            $this->info("Publishing theme assets...");
            $themeManager->publishAssets($installed);
            
            $this->newLine();
            $this->info("✓ Theme '{$installed->name}' installed successfully!");
            $this->line("  Slug: {$installed->slug}");
            $this->line("  Version: {$installed->version}");
            
            if ($this->confirm('Would you like to activate this theme?', false)) {
                $themeManager->activateTheme($installed->slug);
                $this->info("✓ Theme activated!");
            }

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Failed to install theme: " . $e->getMessage());
            return self::FAILURE;
        }
    }
}
