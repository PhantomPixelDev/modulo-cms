<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

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
        $this->call([
            DefaultUsersSeeder::class,
            DefaultPagesSeeder::class,
            ExampleContentSeeder::class,
            InfoSeeder::class,
            MenuSeeder::class,
            MediaSeeder::class,
        ]);
    }
}
