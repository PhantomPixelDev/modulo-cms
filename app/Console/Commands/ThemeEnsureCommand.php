<?php

namespace App\Console\Commands;

use App\Models\Theme;
use App\Services\ThemeManager;
use Illuminate\Console\Command;

/**
 * Idempotent bootstrap for containers: installs the theme when missing and
 * activates it only when no theme is active (never overrides an admin's choice).
 */
class ThemeEnsureCommand extends Command
{
    protected $signature = 'theme:ensure {slug=modern-react : Theme to install and activate if none is active}';

    protected $description = 'Make sure a React theme is installed and active';

    public function handle(ThemeManager $themeManager): int
    {
        $slug = (string) $this->argument('slug');

        if (Theme::where('is_active', true)->where('template_engine', 'react')->exists()) {
            $this->info('An active React theme is already set; nothing to do.');

            return self::SUCCESS;
        }

        if (! Theme::where('slug', $slug)->where('is_installed', true)->exists()) {
            $theme = $themeManager->discoverThemes()->firstWhere('config.slug', $slug);
            if (! $theme) {
                $this->error("Theme '{$slug}' not found in resources/themes.");

                return self::FAILURE;
            }

            $themeManager->installTheme($theme);
        }

        if (! $themeManager->activateTheme($slug)) {
            $this->error("Theme '{$slug}' could not be activated.");

            return self::FAILURE;
        }

        $this->info("Theme '{$slug}' installed and activated.");

        return self::SUCCESS;
    }
}
