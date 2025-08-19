<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create-superadmin {--name=} {--email=} {--password=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new super admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Creating a new Super Admin user...');

        // Get user input
        $name = $this->option('name') ?: $this->ask('Enter the admin name');
        $email = $this->option('email') ?: $this->ask('Enter the admin email');
        $password = $this->option('password') ?: $this->secret('Enter the admin password');

        // Validate input
        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ], [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            $this->error('Validation failed:');
            foreach ($validator->errors()->all() as $error) {
                $this->error('- ' . $error);
            }
            return 1;
        }

        try {
            // Create the user
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
            ]);

            // Assign super-admin role
            $user->assignRole('super-admin');

            $this->info("Super Admin user created successfully!");
            $this->table(['Field', 'Value'], [
                ['Name', $user->name],
                ['Email', $user->email],
                ['Role', 'super-admin'],
                ['ID', $user->id],
            ]);

            return 0;

        } catch (\Exception $e) {
            $this->error('Failed to create super admin user: ' . $e->getMessage());
            return 1;
        }
    }
}
