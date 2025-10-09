<?php

namespace App\Console\Commands;

use App\Models\Theme;
use App\Services\ThemeManager;
use Illuminate\Console\Command;

class ThemeListCommand extends Command
{
    protected $signature = 'theme:list {--installed : Show only installed themes} {--available : Show only available themes}';
    protected $description = 'List all themes';

    public function handle(ThemeManager $themeManager): int
    {
        $showInstalled = !$this->option('available');
        $showAvailable = !$this->option('installed');

        if ($showInstalled) {
            $this->info("Installed Themes:");
            $this->newLine();

            $installed = Theme::orderBy('name')->get();

            if ($installed->isEmpty()) {
                $this->line("  No themes installed.");
            } else {
                $headers = ['Name', 'Slug', 'Version', 'Status', 'Engine'];
                $rows = $installed->map(function ($theme) {
                    return [
                        $theme->name,
                        $theme->slug,
                        $theme->version,
                        $theme->is_active ? '✓ Active' : 'Inactive',
                        $theme->template_engine,
                    ];
                });

                $this->table($headers, $rows);
            }
            $this->newLine();
        }

        if ($showAvailable) {
            $this->info("Available Themes:");
            $this->newLine();

            $discovered = $themeManager->discoverThemes();
            $installedSlugs = Theme::pluck('slug')->toArray();

            $available = $discovered->filter(function ($theme) use ($installedSlugs) {
                return !in_array($theme['config']['slug'], $installedSlugs);
            });

            if ($available->isEmpty()) {
                $this->line("  No new themes available. All discovered themes are installed.");
            } else {
                $headers = ['Name', 'Slug', 'Version', 'Engine'];
                $rows = $available->map(function ($theme) {
                    return [
                        $theme['config']['name'],
                        $theme['config']['slug'],
                        $theme['config']['version'] ?? '1.0.0',
                        $theme['config']['template_engine'] ?? 'blade',
                    ];
                });

                $this->table($headers, $rows);
                $this->newLine();
                $this->comment("Run 'php artisan theme:install <slug>' to install a theme");
            }
        }

        return self::SUCCESS;
    }
}
