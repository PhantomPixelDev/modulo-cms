<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * The default seeder, split into what the application requires and what is
 * only useful for a demo.
 *
 * `db:seed` with no arguments gives a fully populated site in a development or
 * testing environment, and bootstrap data only anywhere else. Demo content
 * creates accounts with documented passwords and writes posts keyed by slug,
 * so it must never reach production by default.
 *
 * Call the halves explicitly when you need to:
 *
 *   php artisan db:seed --class=BootstrapSeeder    # safe on every upgrade
 *   php artisan modulo:seed-demo                   # refuses production
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([BootstrapSeeder::class]);

        if (! app()->environment(['local', 'development', 'testing'])) {
            $this->command?->info('Skipping demo content outside local and testing environments.');

            return;
        }

        $this->call([DemoContentSeeder::class]);

        // Machine-specific accounts, kept out of the repository.
        if (class_exists(DEVUserAccountsSeeder::class)) {
            $this->call([DEVUserAccountsSeeder::class]);
        }
    }
}
