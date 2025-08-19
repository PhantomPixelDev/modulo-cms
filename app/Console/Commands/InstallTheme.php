<?php

namespace App\Console\Commands;

use App\Services\ThemeManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;

class InstallTheme extends Command
{
    protected $signature = 'theme:install {slug : Theme slug to install} {--activate : Activate the theme after installing}';

    protected $description = 'Install a discovered theme by slug and publish its assets';

    public function handle(ThemeManager $themeManager): int
    {
        $slug = (string) $this->argument('slug');
        $activate = (bool) $this->option('activate');

        try {
            $discovered = $themeManager->discoverThemes();
            $themeToInstall = $discovered->firstWhere('config.slug', $slug);

            if (!$themeToInstall) {
                $this->error("Theme '{$slug}' not found in discovered themes.");
                return self::FAILURE;
            }

            $theme = $themeManager->installTheme($themeToInstall, Auth::id());
            $themeManager->publishAssets($theme);

            $this->info("Theme '{$theme->name}' installed and assets published.");

            if ($activate) {
                $ok = $themeManager->activateTheme($slug);
                if ($ok) {
                    $this->info("Theme '{$slug}' activated.");
                } else {
                    $this->warn("Theme '{$slug}' could not be activated.");
                }
            }

            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Failed to install theme: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
