<?php

namespace App\Console\Commands;

use App\Models\Theme;
use App\Services\ThemeManager;
use Illuminate\Console\Command;

class ThemePublishCommand extends Command
{
    protected $signature = 'theme:publish-assets {slug? : The theme slug (optional - publishes all if not specified)}';
    protected $description = 'Publish theme assets to the public directory';

    public function handle(ThemeManager $themeManager): int
    {
        $slug = $this->argument('slug');

        try {
            if ($slug) {
                $theme = Theme::where('slug', $slug)->first();
                
                if (!$theme) {
                    $this->error("Theme '{$slug}' not found.");
                    return self::FAILURE;
                }

                $this->info("Publishing assets for theme '{$theme->name}'...");
                $success = $themeManager->publishAssets($theme);

                if ($success) {
                    $this->info("✓ Assets published successfully!");
                    return self::SUCCESS;
                }
            } else {
                $this->info("Publishing assets for all installed themes...");
                $success = $themeManager->publishAllAssets();

                if ($success) {
                    $this->info("✓ All theme assets published successfully!");
                    return self::SUCCESS;
                }
            }

            $this->error("Failed to publish theme assets.");
            return self::FAILURE;
        } catch (\Exception $e) {
            $this->error("Error publishing assets: " . $e->getMessage());
            return self::FAILURE;
        }
    }
}
