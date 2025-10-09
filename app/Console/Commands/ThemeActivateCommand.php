<?php

namespace App\Console\Commands;

use App\Services\ThemeManager;
use Illuminate\Console\Command;

class ThemeActivateCommand extends Command
{
    protected $signature = 'theme:activate {slug : The theme slug to activate}';
    protected $description = 'Activate an installed theme';

    public function handle(ThemeManager $themeManager): int
    {
        $slug = $this->argument('slug');

        try {
            $success = $themeManager->activateTheme($slug);

            if ($success) {
                $this->info("✓ Theme '{$slug}' activated successfully!");
                return self::SUCCESS;
            } else {
                $this->error("Failed to activate theme '{$slug}'. Make sure it's installed and files exist.");
                return self::FAILURE;
            }
        } catch (\Exception $e) {
            $this->error("Error activating theme: " . $e->getMessage());
            return self::FAILURE;
        }
    }
}
