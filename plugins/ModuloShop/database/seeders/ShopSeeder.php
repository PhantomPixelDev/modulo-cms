<?php

namespace Plugins\ModuloShop\database\seeders;

use App\Models\PostType;
use App\Models\Taxonomy;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ShopSeeder extends Seeder
{
    public function run(): void
    {
        // Check if product post type already exists with different route_prefix
        $existingProductType = PostType::where('name', 'product')->orWhere('slug', 'product')->first();
        
        if ($existingProductType && $existingProductType->route_prefix !== 'shop') {
            $this->command?->warn('⚠️  A "product" post type already exists with route_prefix: "' . $existingProductType->route_prefix . '"');
            $this->command?->warn('   The ModuloShop plugin requires route_prefix to be "shop" for proper functionality.');
            $this->command?->warn('   To fix this, either:');
            $this->command?->warn('   1. Delete the existing product post type and its posts, then re-run this seeder');
            $this->command?->warn('   2. Manually update the route_prefix to "shop" in the database');
            $this->command?->newLine();
            
            // Update the existing product type to use shop route_prefix
            $existingProductType->update([
                'route_prefix' => 'shop',
                'menu_icon' => 'shopping-bag',
                'menu_position' => 25,
            ]);
            $this->command?->info('✓ Updated existing product post type route_prefix to "shop"');
            $productType = $existingProductType;
        } else {
            // Create Product post type
            $productType = PostType::firstOrCreate(
                ['name' => 'product'],
                [
                    'label' => 'Product',
                    'plural_label' => 'Products',
                    'description' => 'Shop products with pricing, inventory, and variations',
                    'route_prefix' => 'shop',
                    'has_taxonomies' => true,
                    'has_featured_image' => true,
                    'has_excerpt' => true,
                    'has_comments' => false,
                    'is_public' => true,
                    'is_hierarchical' => false,
                    'menu_icon' => 'shopping-bag',
                    'menu_position' => 25,
                    'slug' => 'product',
                    'supports' => json_encode([
                        'title',
                        'editor',
                        'excerpt',
                        'thumbnail',
                        'custom-fields',
                        'revisions',
                    ]),
                    'taxonomies' => json_encode(['product-category', 'product-tag']),
                ]
            );
        }

        // Create Product Category taxonomy
        Taxonomy::firstOrCreate(
            ['slug' => 'product-category'],
            [
                'name' => 'Product Category',
                'label' => 'Product Category',
                'plural_label' => 'Product Categories',
                'description' => 'Categorize your products',
                'is_hierarchical' => true,
                'is_public' => true,
                'post_types' => json_encode(['product']),
            ]
        );

        // Create Product Tag taxonomy
        Taxonomy::firstOrCreate(
            ['slug' => 'product-tag'],
            [
                'name' => 'Product Tag',
                'label' => 'Product Tag',
                'plural_label' => 'Product Tags',
                'description' => 'Tag your products',
                'is_hierarchical' => false,
                'is_public' => true,
                'post_types' => json_encode(['product']),
            ]
        );

        // Create shop permissions
        $permissions = [
            'view shop products',
            'create shop products',
            'edit shop products',
            'delete shop products',
            'manage shop orders',
            'view shop orders',
            'manage shop settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        // Assign permissions to admin role
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $adminRole->givePermissionTo($permissions);
        }

        $superAdminRole = Role::where('name', 'super-admin')->first();
        if ($superAdminRole) {
            $superAdminRole->givePermissionTo($permissions);
        }

        $this->command->info('Shop post type, taxonomies, and permissions created successfully.');
    }
}
