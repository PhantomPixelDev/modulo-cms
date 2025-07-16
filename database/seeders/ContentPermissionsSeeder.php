<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ContentPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create content management permissions
        $contentPermissions = [
            // Post permissions
            'view posts',
            'create posts',
            'edit posts',
            'delete posts',
            'publish posts',
            
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
        ];

        foreach ($contentPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
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
    }
}
