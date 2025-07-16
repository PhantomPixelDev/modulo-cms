<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class AssignSuperAdminRole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:make-super-admin {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign super admin role to a user by email';

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
        
        $superAdminRole = Role::where('name', 'super-admin')->first();
        
        if (!$superAdminRole) {
            $this->error("Super admin role not found! Please run php artisan db:seed first.");
            return 1;
        }
        
        $user->assignRole($superAdminRole);
        
        $this->info("Successfully assigned super admin role to {$user->name} ({$user->email})");
        
        return 0;
    }
} 