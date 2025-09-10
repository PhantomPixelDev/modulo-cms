<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DefaultUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Create super admin user
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('admin123'),
                'email_verified_at' => now(),
                'is_admin' => true,
            ]
        );

        // Create regular example user
        User::updateOrCreate(
            ['email' => 'user@example.com'],
            [
                'name' => 'Example User',
                'password' => Hash::make('user123'),
                'email_verified_at' => now(),
                'is_admin' => false,
            ]
        );

        // Create editor user
        User::updateOrCreate(
            ['email' => 'editor@example.com'],
            [
                'name' => 'Content Editor',
                'password' => Hash::make('editor123'),
                'email_verified_at' => now(),
                'is_admin' => false,
            ]
        );
    }
}
