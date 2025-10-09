<?php

namespace App\Console\Commands;

use App\Services\ThemeManager;
use Illuminate\Console\Command;

class ThemeUpdateCommand extends Command
{
    protected $signature = 'theme:update {slug? : The theme slug to update (updates all if not specified)}';
    protected $description = 'Update theme(s) to the latest version';

    public function handle(ThemeManager $themeManager): int
    {
        $slug = $this->argument('slug');

        if ($slug) {
            return $this->updateSingleTheme($themeManager, $slug);
        }

        return $this->updateAllThemes($themeManager);
    }

    protected function updateSingleTheme(ThemeManager $themeManager, string $slug): int
    {
        $this->info("Checking for updates for theme '{$slug}'...");

        if (!$themeManager->hasUpdates($slug)) {
            $this->info("✓ Theme '{$slug}' is already up to date.");
            return self::SUCCESS;
        }

        try {
            $this->info("Updating theme '{$slug}'...");
            $success = $themeManager->updateTheme($slug);

            if ($success) {
                $this->info("✓ Theme '{$slug}' updated successfully!");
                return self::SUCCESS;
            } else {
                $this->error("Failed to update theme '{$slug}'.");
                return self::FAILURE;
            }
        } catch (\Exception $e) {
            $this->error("Error updating theme: " . $e->getMessage());
            return self::FAILURE;
        }
    }

    protected function updateAllThemes(ThemeManager $themeManager): int
    {
        $this->info("Checking for theme updates...");
        $themesWithUpdates = $themeManager->getThemesWithUpdates();

        if ($themesWithUpdates->isEmpty()) {
            $this->info("✓ All themes are up to date.");
            return self::SUCCESS;
        }

        $this->newLine();
        $this->info("Found {$themesWithUpdates->count()} theme(s) with updates:");
        
        foreach ($themesWithUpdates as $theme) {
            $this->line("  - {$theme->name} ({$theme->slug})");
        }

        $this->newLine();

        if (!$this->confirm('Would you like to update all themes?', true)) {
            $this->info('Update cancelled.');
            return self::SUCCESS;
        }

        $updated = 0;
        $failed = 0;

        foreach ($themesWithUpdates as $theme) {
            $this->info("Updating {$theme->name}...");
            
            try {
                if ($themeManager->updateTheme($theme->slug)) {
                    $this->info("  ✓ {$theme->name} updated");
                    $updated++;
                } else {
                    $this->error("  ✗ Failed to update {$theme->name}");
                    $failed++;
                }
            } catch (\Exception $e) {
                $this->error("  ✗ Error: " . $e->getMessage());
                $failed++;
            }
        }

        $this->newLine();
        $this->info("Update complete: {$updated} updated, {$failed} failed");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
