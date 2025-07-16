<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // User management
            'view users',
            'create users',
            'edit users',
            'delete users',
            'assign roles',
            
            // Role management
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
            'assign permissions',
            
            // Content management
            'view content',
            'create content',
            'edit content',
            'delete content',
            'publish content',
            'approve content',
            
            // Plugin management
            'view plugins',
            'install plugins',
            'activate plugins',
            'deactivate plugins',
            'delete plugins',
            
            // Settings management
            'view settings',
            'edit settings',
            'system settings',
            
            // Analytics
            'view analytics',
            'export data',
            
            // Backup & maintenance
            'create backups',
            'restore backups',
            'system maintenance',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles and assign permissions
        $roles = [
            'super-admin' => $permissions,
            'admin' => [
                'view users', 'create users', 'edit users', 'assign roles',
                'view roles', 'create roles', 'edit roles', 'assign permissions',
                'view content', 'create content', 'edit content', 'delete content', 'publish content', 'approve content',
                'view plugins', 'install plugins', 'activate plugins', 'deactivate plugins',
                'view settings', 'edit settings',
                'view analytics', 'export data',
                'create backups', 'restore backups',
            ],
            'moderator' => [
                'view users',
                'view content', 'create content', 'edit content', 'approve content',
                'view plugins',
                'view settings',
                'view analytics',
            ],
            'editor' => [
                'view content', 'create content', 'edit content', 'publish content',
                'view plugins',
            ],
            'user' => [
                'view content',
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            $role = Role::create(['name' => $roleName]);
            $role->givePermissionTo($rolePermissions);
        }

        // Create a super admin user
        $superAdmin = User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'admin@modulo-cms.com',
        ]);
        $superAdmin->assignRole('super-admin');

        // Create a test admin user
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);
        $admin->assignRole('admin');

        // Create a test moderator
        $moderator = User::factory()->create([
            'name' => 'Moderator User',
            'email' => 'moderator@example.com',
        ]);
        $moderator->assignRole('moderator');

        // Create a test editor
        $editor = User::factory()->create([
            'name' => 'Editor User',
            'email' => 'editor@example.com',
        ]);
        $editor->assignRole('editor');
    }
} 