<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CheckUserRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:check-roles {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check user roles and permissions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        if ($email) {
            $user = User::where('email', $email)->first();
            
            if (!$user) {
                $this->error("User with email {$email} not found!");
                return 1;
            }
            
            $this->displayUserInfo($user);
        } else {
            $users = User::with('roles', 'permissions')->get();
            
            $this->info("All Users and Their Roles:");
            $this->info("========================");
            
            foreach ($users as $user) {
                $this->displayUserInfo($user);
                $this->info("---");
            }
        }
        
        return 0;
    }
    
    private function displayUserInfo($user)
    {
        $this->info("User: {$user->name} ({$user->email})");
        
        if ($user->roles->count() > 0) {
            $this->info("Roles:");
            foreach ($user->roles as $role) {
                $this->line("  - {$role->name}");
            }
        } else {
            $this->warn("  No roles assigned");
        }
        
        if ($user->permissions->count() > 0) {
            $this->info("Permissions:");
            foreach ($user->permissions as $permission) {
                $this->line("  - {$permission->name}");
            }
        } else {
            $this->warn("  No direct permissions assigned");
        }
    }
} 