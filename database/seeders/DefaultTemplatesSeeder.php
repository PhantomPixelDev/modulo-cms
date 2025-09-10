<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Template;

class DefaultTemplatesSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Default Layout',
                'type' => 'layout',
                'description' => 'Main layout template with header, content area, and footer',
                'content' => file_get_contents(resource_path('views/templates/default-layout.blade.php')),
                'variables' => [
                    'title', 'site_name', 'description', 'head_extra', 'header', 
                    'content', 'footer', 'scripts_extra'
                ],
                'is_default' => true,
            ],
            [
                'name' => 'Default Header',
                'type' => 'header',
                'description' => 'Site header with navigation and branding',
                'content' => file_get_contents(resource_path('views/templates/default-header.blade.php')),
                'variables' => [
                    'logo_url', 'site_name', 'navigation_menu', 'search_box', 'user_menu'
                ],
                'is_default' => true,
            ],
            [
                'name' => 'Default Footer',
                'type' => 'footer',
                'description' => 'Site footer with links and contact information',
                'content' => file_get_contents(resource_path('views/templates/default-footer.blade.php')),
                'variables' => [
                    'site_name', 'site_description', 'social_links', 'footer_links', 
                    'contact_info', 'current_year', 'footer_extra'
                ],
                'is_default' => true,
            ],
            [
                'name' => 'Default Post',
                'type' => 'post',
                'description' => 'Single post display template',
                'content' => file_get_contents(resource_path('views/templates/default-post.blade.php')),
                'variables' => [
                    'featured_image', 'published_at_iso', 'published_at', 'read_time', 
                    'view_count', 'title', 'excerpt', 'author_avatar', 'author_name', 
                    'author_role', 'content', 'taxonomy_terms', 'share_buttons', 
                    'updated_at', 'related_posts', 'comments'
                ],
                'is_default' => true,
            ],
            [
                'name' => 'Default Page',
                'type' => 'page',
                'description' => 'Single page display template',
                'content' => file_get_contents(resource_path('views/templates/default-page.blade.php')),
                'variables' => [
                    'featured_image', 'title', 'excerpt', 'updated_at_iso', 'updated_at', 
                    'breadcrumbs', 'content', 'child_pages', 'contact_form'
                ],
                'is_default' => true,
            ],
            [
                'name' => 'Default Index',
                'type' => 'index',
                'description' => 'Posts listing/archive template',
                'content' => file_get_contents(resource_path('views/templates/default-index.blade.php')),
                'variables' => [
                    'page_title', 'page_description', 'hero_cta', 'featured_content', 
                    'posts', 'pagination', 'sidebar'
                ],
                'is_default' => true,
            ],
        ];

        foreach ($templates as $template) {
            Template::updateOrCreate(
                ['slug' => \Illuminate\Support\Str::slug($template['name'])],
                $template
            );
        }
    }
}
