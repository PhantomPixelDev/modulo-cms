<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ContentPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure permission cache is cleared before seeding
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Create content management permissions
        $contentPermissions = [
            // Admin area access gate
            'access admin',
            // Post permissions
            'view posts',
            'create posts',
            'edit posts',
            'delete posts',
            'publish posts',

            // Page permissions (separate Pages management in admin)
            'view pages',
            'create pages',
            'edit pages',
            'delete pages',
            
            // Post type permissions
            'view post types',
            'create post types',
            'edit post types',
            'delete post types',
            
            // Taxonomy permissions
            'view taxonomies',
            'create taxonomies',
            'edit taxonomies',
            'delete taxonomies',
            
            // Taxonomy term permissions
            'view taxonomy terms',
            'create taxonomy terms',
            'edit taxonomy terms',
            'delete taxonomy terms',

            // Menu permissions
            'view menus',
            'create menus',
            'edit menus',
            'delete menus',

            // Menu item permissions
            'view menu items',
            'create menu items',
            'edit menu items',
            'delete menu items',

            // Media permissions
            'view media',
            'upload media',
            'edit media',
            'delete media',

            // User management permissions (aligns with routes/admin.php)
            'view users',
            'create users',
            'edit users',
            'delete users',

            // Role management permissions
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',

            // Template permissions
            'view templates',
            'create templates',
            'edit templates',
            'delete templates',

            // Theme permissions
            'view themes',
            'edit themes',
            'delete themes',
            'install themes',
            'activate themes',
            'publish theme assets',
            'customize themes',
        ];

        foreach ($contentPermissions as $permission) {
            // Normalize any existing permission with wrong guard
            Permission::query()->where('name', $permission)->update(['guard_name' => 'web']);

            // Create if missing with explicit guard
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        // Assign permissions to admin and super-admin roles
        $adminRole = Role::where('name', 'admin')->first();
        $superAdminRole = Role::where('name', 'super-admin')->first();

        if ($adminRole) {
            $adminRole->givePermissionTo($contentPermissions);
        }

        if ($superAdminRole) {
            $superAdminRole->givePermissionTo($contentPermissions);
        }

        // Clear cache again after updates
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
