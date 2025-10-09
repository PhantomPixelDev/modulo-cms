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

        // Create additional test users for comprehensive testing
        $additionalUsers = [
            [
                'name' => 'Sarah Johnson',
                'email' => 'sarah.johnson@example.com',
                'password' => Hash::make('sarah123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Mike Chen',
                'email' => 'mike.chen@example.com',
                'password' => Hash::make('mike123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Emily Davis',
                'email' => 'emily.davis@example.com',
                'password' => Hash::make('emily123'),
                'is_admin' => false,
            ],
            [
                'name' => 'David Wilson',
                'email' => 'david.wilson@example.com',
                'password' => Hash::make('david123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Lisa Anderson',
                'email' => 'lisa.anderson@example.com',
                'password' => Hash::make('lisa123'),
                'is_admin' => false,
            ],
            [
                'name' => 'James Brown',
                'email' => 'james.brown@example.com',
                'password' => Hash::make('james123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Jennifer Taylor',
                'email' => 'jennifer.taylor@example.com',
                'password' => Hash::make('jennifer123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Robert Martinez',
                'email' => 'robert.martinez@example.com',
                'password' => Hash::make('robert123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Michelle Garcia',
                'email' => 'michelle.garcia@example.com',
                'password' => Hash::make('michelle123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Kevin Lee',
                'email' => 'kevin.lee@example.com',
                'password' => Hash::make('kevin123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Amanda White',
                'email' => 'amanda.white@example.com',
                'password' => Hash::make('amanda123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Christopher Harris',
                'email' => 'christopher.harris@example.com',
                'password' => Hash::make('christopher123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Ashley Clark',
                'email' => 'ashley.clark@example.com',
                'password' => Hash::make('ashley123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Matthew Lewis',
                'email' => 'matthew.lewis@example.com',
                'password' => Hash::make('matthew123'),
                'is_admin' => false,
            ],
            [
                'name' => 'Jessica Walker',
                'email' => 'jessica.walker@example.com',
                'password' => Hash::make('jessica123'),
                'is_admin' => false,
            ],
        ];

        foreach ($additionalUsers as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => $userData['password'],
                    'email_verified_at' => now(),
                    'is_admin' => $userData['is_admin'],
                ]
            );
        }

        $this->command->info('Created ' . (count($additionalUsers) + 3) . ' users for testing');
    }
}
