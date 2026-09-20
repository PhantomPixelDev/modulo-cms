<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Data the application needs in order to function at all.
 *
 * Runs on a fresh install and again on every upgrade, so everything it calls
 * must be idempotent and must never overwrite something an administrator has
 * changed. That is a real constraint rather than a stylistic one: before the
 * split, re-seeding reset every role's permissions, deleted locales that other
 * tables referenced, reset the admin password to a documented default, and
 * overwrote published pages whose slug still matched.
 *
 * Demo content lives in DemoContentSeeder and is never part of this.
 */
class BootstrapSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // Roles and permissions first: later seeders and the installer
            // assign roles, and Spatie throws if the role does not exist.
            RolePermissionSeeder::class,

            LocaleSeeder::class,

            // Post types and taxonomies, including the `page` type.
            ContentSeeder::class,

            // Must follow ContentSeeder: it updates the post type rows that
            // ContentSeeder creates, and previously ran first and matched
            // nothing on a fresh database.
            PostTypeRoutePrefixSeeder::class,

            SiteSettingsSeeder::class,
        ]);
    }
}
