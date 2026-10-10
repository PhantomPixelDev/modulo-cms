<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DefaultUsersSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction() && (! config('demo.enabled') || ! config('demo.seeding_authorized'))) {
            $this->command?->warn('DefaultUsersSeeder refuses to run in production.');

            return;
        }
        foreach ([
            ['admin@example.com', 'Super Admin', 'admin123', 'super-admin', true],
            ['editor@example.com', 'Content Editor', 'editor123', 'editor', false],
            ['user@example.com', 'Example User', 'user123', 'user', false],
        ] as [$email, $name, $password, $role, $isAdmin]) {
            $user = User::updateOrCreate(['email' => $email], [
                'name' => $name, 'password' => Hash::make($password),
                'email_verified_at' => now(), 'is_admin' => $isAdmin,
            ]);
            $user->syncRoles([$role]);
        }
    }
}
