<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingsSeeder extends Seeder
{
    /**
     * Seed the default site settings.
     */
    public function run(): void
    {
        SiteSetting::seedDefaults();
        
        $this->command->info('Site settings seeded successfully.');
    }
}
