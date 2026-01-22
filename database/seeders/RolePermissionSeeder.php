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
            // Admin area access
            'access admin',
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

            // Page management (separate from posts)
            'view pages',
            'create pages',
            'edit pages',
            'delete pages',
            
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

            // ModuloShop
            'view shop products',
            'create shop products',
            'edit shop products',
            'delete shop products',
            'view shop orders',
            'manage shop orders',
            'manage shop settings',
            
            // Settings management
            'view settings',
            'edit settings',
            'system settings',

            // Menus
            'view menus', 'create menus', 'edit menus', 'delete menus',
            'view menu items', 'create menu items', 'edit menu items', 'delete menu items',

            // Templates
            'view templates', 'create templates', 'edit templates', 'delete templates',

            // Themes
            'view themes', 'edit themes', 'delete themes', 'install themes', 'activate themes', 'publish theme assets', 'customize themes',

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
                'access admin',
                'view users', 'create users', 'edit users', 'assign roles',
                'view roles', 'create roles', 'edit roles', 'assign permissions',
                'view content', 'create content', 'edit content', 'delete content', 'publish content', 'approve content',
                'view posts', 'create posts', 'edit posts', 'delete posts', 'publish posts',
                'view pages', 'create pages', 'edit pages', 'delete pages',
                'view post types', 'create post types', 'edit post types', 'delete post types',
                'view taxonomies', 'create taxonomies', 'edit taxonomies', 'delete taxonomies',
                'view taxonomy terms', 'create taxonomy terms', 'edit taxonomy terms', 'delete taxonomy terms',
                'view plugins', 'install plugins', 'activate plugins', 'deactivate plugins', 'delete plugins',
                'view shop products', 'create shop products', 'edit shop products', 'delete shop products',
                'view shop orders', 'manage shop orders', 'manage shop settings',
                'view settings', 'edit settings',
                'view analytics', 'export data',
                'create backups', 'restore backups',
                'view menus', 'create menus', 'edit menus', 'delete menus',
                'view menu items', 'create menu items', 'edit menu items', 'delete menu items',
                'view templates', 'create templates', 'edit templates', 'delete templates',
                'view themes', 'edit themes', 'delete themes', 'install themes', 'activate themes', 'publish theme assets', 'customize themes',
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

        // Assign roles to existing users (users created by DefaultUsersSeeder)
        // admin@example.com gets super-admin role (main admin account)
        $admin = User::where('email', 'admin@example.com')->first();
        if ($admin) {
            $admin->assignRole('super-admin');
        }

        // editor@example.com gets editor role
        $editor = User::where('email', 'editor@example.com')->first();
        if ($editor) {
            $editor->assignRole('editor');
        }

        // user@example.com gets user role
        $user = User::where('email', 'user@example.com')->first();
        if ($user) {
            $user->assignRole('user');
        }
    }
} 