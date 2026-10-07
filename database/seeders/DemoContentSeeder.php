<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Plugins\ModuloShop\database\seeders\ShopDemoSeeder;

/**
 * Sample users and content for development and for trying the CMS out.
 *
 * Never run this against a production database. It creates accounts whose
 * passwords are published in the README, and it writes posts, pages and menus
 * keyed by slug, which will collide with real content.
 *
 * Assumes BootstrapSeeder has already run: it needs roles to assign and post
 * types to attach content to.
 */
class DemoContentSeeder extends Seeder
{
    public function run(): void
    {
        // Defense in depth: DatabaseSeeder already skips demo content in
        // production, but this entry point must refuse there too.
        if (app()->isProduction() && (! config('demo.enabled') || ! config('demo.seeding_authorized'))) {
            $this->command?->warn('DemoContentSeeder refuses to run in production.');

            return;
        }

        $this->call([
            DefaultUsersSeeder::class,
            DefaultPagesSeeder::class,
            ExampleContentSeeder::class,
            InfoSeeder::class,
            MenuSeeder::class,
            MediaSeeder::class,
        ]);

        // Shop demo products live in the shop plugin, not core. Include them
        // when the plugin is installed so one command seeds the whole demo.
        if (class_exists(ShopDemoSeeder::class)) {
            $this->call([ShopDemoSeeder::class]);
        }
    }
}
