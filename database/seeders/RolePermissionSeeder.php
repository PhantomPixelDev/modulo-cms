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
            
            // Post management (specific permissions for routes)
            'view posts',
            'create posts',
            'edit posts',
            'delete posts',
            'publish posts',
            
            // Post type management
            'view post types',
            'create post types',
            'edit post types',
            'delete post types',
            
            // Taxonomy management
            'view taxonomies',
            'create taxonomies',
            'edit taxonomies',
            'delete taxonomies',
            
            // Taxonomy term management
            'view taxonomy terms',
            'create taxonomy terms',
            'edit taxonomy terms',
            'delete taxonomy terms',
            
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
            // Idempotent: create if missing
            Permission::findOrCreate($permission, 'web');
        }

        // Create roles and assign permissions
        $roles = [
            'super-admin' => $permissions,
            'admin' => [
                'view users', 'create users', 'edit users', 'assign roles',
                'view roles', 'create roles', 'edit roles', 'assign permissions',
                'view content', 'create content', 'edit content', 'delete content', 'publish content', 'approve content',
                'view posts', 'create posts', 'edit posts', 'delete posts', 'publish posts',
                'view post types', 'create post types', 'edit post types', 'delete post types',
                'view taxonomies', 'create taxonomies', 'edit taxonomies', 'delete taxonomies',
                'view taxonomy terms', 'create taxonomy terms', 'edit taxonomy terms', 'delete taxonomy terms',
                'view plugins', 'install plugins', 'activate plugins', 'deactivate plugins',
                'view settings', 'edit settings',
                'view analytics', 'export data',
                'create backups', 'restore backups',
            ],
            'moderator' => [
                'view users',
                'view content', 'create content', 'edit content', 'approve content',
                'view posts', 'create posts', 'edit posts',
                'view post types', 'view taxonomies', 'view taxonomy terms',
                'view plugins',
                'view settings',
                'view analytics',
            ],
            'editor' => [
                'view content', 'create content', 'edit content', 'publish content',
                'view posts', 'create posts', 'edit posts', 'publish posts',
                'view post types', 'view taxonomies', 'view taxonomy terms',
                'view plugins',
            ],
            'user' => [
                'view content',
            ],
        ];

        foreach ($roles as $roleName => $rolePermissions) {
            // Idempotent: create role if missing, then sync its permissions
            $role = Role::findOrCreate($roleName, 'web');
            $role->syncPermissions($rolePermissions);
        }

        // Create or fetch a super admin user
        $superAdmin = User::where('email', 'admin@modulo-cms.com')->first();
        if (!$superAdmin) {
            $superAdmin = User::factory()->create([
                'name' => 'Super Admin',
                'email' => 'admin@modulo-cms.com',
            ]);
        }
        $superAdmin->assignRole('super-admin');

        // Create or fetch a test admin user
        $admin = User::where('email', 'admin@example.com')->first();
        if (!$admin) {
            $admin = User::factory()->create([
                'name' => 'Admin User',
                'email' => 'admin@example.com',
            ]);
        }
        $admin->assignRole('admin');

        // Create or fetch a test moderator
        $moderator = User::where('email', 'moderator@example.com')->first();
        if (!$moderator) {
            $moderator = User::factory()->create([
                'name' => 'Moderator User',
                'email' => 'moderator@example.com',
            ]);
        }
        $moderator->assignRole('moderator');

        // Create or fetch a test editor
        $editor = User::where('email', 'editor@example.com')->first();
        if (!$editor) {
            $editor = User::factory()->create([
                'name' => 'Editor User',
                'email' => 'editor@example.com',
            ]);
        }
        $editor->assignRole('editor');
    }
} 