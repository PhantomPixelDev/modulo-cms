<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class AssignAdminRole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:make-admin {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign admin role to a user by email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("User with email {$email} not found!");
            return 1;
        }
        
        $adminRole = Role::where('name', 'admin')->first();
        
        if (!$adminRole) {
            $this->error("Admin role not found! Please run php artisan db:seed first.");
            return 1;
        }
        
        $user->assignRole($adminRole);
        
        $this->info("Successfully assigned admin role to {$user->name} ({$user->email})");
        
        return 0;
    }
} 