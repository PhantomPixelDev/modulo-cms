<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Call the role and permission seeder first
        $this->call([
            RolePermissionSeeder::class,
            ContentPermissionsSeeder::class,
            PostTypeRoutePrefixSeeder::class,
            ContentSeeder::class,
            ExampleContentSeeder::class,
            NewsSeeder::class,
            MenuSeeder::class,
        ]);

        // Seed dev user accounts if the seeder exists (guard against missing class)
        if (class_exists(\Database\Seeders\DEVUserAccountsSeeder::class)) {
            $this->call([DEVUserAccountsSeeder::class]);
        }
    }
}
