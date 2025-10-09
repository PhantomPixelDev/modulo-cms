<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Support\Str;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // Header menu - Main Navigation
        $header = Menu::updateOrCreate(
            ['slug' => 'main-navigation'],
            ['name' => 'Main Navigation', 'location' => 'header', 'description' => 'Primary site navigation']
        );

        $this->ensureItems($header, [
            ['label' => 'Home', 'page_slug' => '/', 'order' => 0],
            ['label' => 'Blog', 'page_slug' => 'posts', 'order' => 1],
            ['label' => 'Products', 'page_slug' => 'products', 'order' => 2],
            ['label' => 'Portfolio', 'page_slug' => 'portfolio', 'order' => 3],
            ['label' => 'About', 'page_slug' => 'about', 'order' => 4],
            ['label' => 'Contact', 'page_slug' => 'contact', 'order' => 5],
        ]);

        // Resources menu - Dropdown for resources
        $resources = Menu::updateOrCreate(
            ['slug' => 'resources-menu'],
            ['name' => 'Resources Menu', 'location' => 'resources', 'description' => 'Resources and learning materials']
        );

        $this->ensureItems($resources, [
            ['label' => 'Documentation', 'url' => '/docs', 'order' => 0],
            ['label' => 'Tutorials', 'page_slug' => 'posts?tag=tutorial', 'order' => 1],
            ['label' => 'Case Studies', 'page_slug' => 'case-studies', 'order' => 2],
            ['label' => 'Webinars', 'page_slug' => 'events', 'order' => 3],
            ['label' => 'FAQ', 'page_slug' => 'faqs', 'order' => 4],
        ]);

        // Footer menu - Primary Footer
        $footer = Menu::updateOrCreate(
            ['slug' => 'footer-links'],
            ['name' => 'Footer Links', 'location' => 'footer', 'description' => 'Footer links']
        );

        $this->ensureItems($footer, [
            ['label' => 'Privacy Policy', 'page_slug' => 'privacy-policy', 'order' => 0],
            ['label' => 'Terms of Service', 'page_slug' => 'terms-of-service', 'order' => 1],
            ['label' => 'Support', 'page_slug' => 'support', 'order' => 2],
            ['label' => 'Dashboard', 'route_name' => 'dashboard', 'order' => 3, 'visible_to' => 'auth'],
        ]);

        // Footer Services menu
        $footerServices = Menu::updateOrCreate(
            ['slug' => 'footer-services'],
            ['name' => 'Footer Services', 'location' => 'footer-services', 'description' => 'Services section in footer']
        );

        $this->ensureItems($footerServices, [
            ['label' => 'Web Development', 'url' => '/services#web-development', 'order' => 0],
            ['label' => 'CMS Solutions', 'url' => '/services#cms', 'order' => 1],
            ['label' => 'E-commerce', 'url' => '/services#ecommerce', 'order' => 2],
            ['label' => 'Consulting', 'url' => '/services#consulting', 'order' => 3],
        ]);

        // Footer Company menu
        $footerCompany = Menu::updateOrCreate(
            ['slug' => 'footer-company'],
            ['name' => 'Footer Company', 'location' => 'footer-company', 'description' => 'Company information in footer']
        );

        $this->ensureItems($footerCompany, [
            ['label' => 'About Us', 'page_slug' => 'about-us', 'order' => 0],
            ['label' => 'Our Team', 'page_slug' => 'about-us#team', 'order' => 1],
            ['label' => 'Careers', 'url' => '/careers', 'order' => 2],
            ['label' => 'Press', 'url' => '/press', 'order' => 3],
        ]);

        // Social Media menu
        $social = Menu::updateOrCreate(
            ['slug' => 'social-media'],
            ['name' => 'Social Media', 'location' => 'social', 'description' => 'Social media links']
        );

        $this->ensureItems($social, [
            ['label' => 'Twitter', 'url' => 'https://twitter.com/modulocms', 'order' => 0, 'target' => '_blank'],
            ['label' => 'LinkedIn', 'url' => 'https://linkedin.com/company/modulo-cms', 'order' => 1, 'target' => '_blank'],
            ['label' => 'GitHub', 'url' => 'https://github.com/modulo-cms', 'order' => 2, 'target' => '_blank'],
            ['label' => 'YouTube', 'url' => 'https://youtube.com/modulocms', 'order' => 3, 'target' => '_blank'],
        ]);

        // Admin Quick Actions menu
        $adminQuick = Menu::updateOrCreate(
            ['slug' => 'admin-quick-actions'],
            ['name' => 'Admin Quick Actions', 'location' => 'admin-quick', 'description' => 'Quick admin actions']
        );

        $this->ensureItems($adminQuick, [
            ['label' => '+ New Post', 'route_name' => 'dashboard.admin.posts.create', 'order' => 0, 'visible_to' => 'admin'],
            ['label' => '+ New Page', 'route_name' => 'dashboard.admin.pages.create', 'order' => 1, 'visible_to' => 'admin'],
            ['label' => '+ New User', 'route_name' => 'dashboard.admin.users.create', 'order' => 2, 'visible_to' => 'admin'],
            ['label' => 'Media Library', 'route_name' => 'dashboard.admin.media.index', 'order' => 3, 'visible_to' => 'admin'],
        ]);

        // Category menu - Blog categories
        $categories = Menu::updateOrCreate(
            ['slug' => 'blog-categories'],
            ['name' => 'Blog Categories', 'location' => 'blog-categories', 'description' => 'Blog category navigation']
        );

        $this->ensureItems($categories, [
            ['label' => 'Technology', 'page_slug' => 'category/technology', 'order' => 0],
            ['label' => 'Design', 'page_slug' => 'category/design', 'order' => 1],
            ['label' => 'Business', 'page_slug' => 'category/business', 'order' => 2],
            ['label' => 'Tutorials', 'page_slug' => 'tag/tutorial', 'order' => 3],
            ['label' => 'Best Practices', 'page_slug' => 'tag/best-practices', 'order' => 4],
        ]);

        // Mobile menu - Simplified for mobile
        $mobile = Menu::updateOrCreate(
            ['slug' => 'mobile-menu'],
            ['name' => 'Mobile Menu', 'location' => 'mobile', 'description' => 'Mobile-optimized navigation']
        );

        $this->ensureItems($mobile, [
            ['label' => 'Home', 'page_slug' => '/', 'order' => 0],
            ['label' => 'Blog', 'page_slug' => 'posts', 'order' => 1],
            ['label' => 'Products', 'page_slug' => 'products', 'order' => 2],
            ['label' => 'Portfolio', 'page_slug' => 'portfolio', 'order' => 3],
            ['label' => 'About', 'page_slug' => 'about-us', 'order' => 4],
            ['label' => 'Contact', 'page_slug' => 'contact', 'order' => 5],
            ['label' => 'Dashboard', 'route_name' => 'dashboard', 'order' => 6, 'visible_to' => 'auth'],
        ]);
    }

    private function ensureItems(Menu $menu, array $items): void
    {
        foreach ($items as $i => $data) {
            MenuItem::firstOrCreate(
                [
                    'menu_id' => $menu->id,
                    'label' => $data['label'],
                ],
                [
                    'url' => $data['url'] ?? null,
                    'page_slug' => $data['page_slug'] ?? null,
                    'route_name' => $data['route_name'] ?? null,
                    'order' => $data['order'] ?? $i,
                    'visible_to' => $data['visible_to'] ?? 'all',
                    'target' => $data['target'] ?? null,
                ]
            );
        }
    }
}
