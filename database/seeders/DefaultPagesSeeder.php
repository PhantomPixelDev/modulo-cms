<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Post;
use App\Models\PostType;
use App\Models\User;

class DefaultPagesSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure page post type exists
        $pageType = PostType::updateOrCreate(
            ['name' => 'page'],
            [
                'label' => 'Page',
                'plural_label' => 'Pages',
                'description' => 'Static pages',
                'has_taxonomies' => false,
                'has_featured_image' => true,
                'has_excerpt' => true,
                'has_comments' => false,
                'supports' => json_encode(['title', 'editor', 'thumbnail', 'excerpt']),
                'taxonomies' => json_encode([]),
                'slug' => 'pages',
                'is_public' => true,
                'is_hierarchical' => true,
                'menu_icon' => 'file',
                'menu_position' => 4,
            ]
        );

        // Get first admin user or create system user
        $author = User::where('is_admin', true)->first() ?? User::first();
        if (!$author) {
            $author = User::create([
                'name' => 'System',
                'email' => 'system@example.com',
                'password' => bcrypt('password'),
                'is_admin' => true,
            ]);
        }

        // Create default pages
        $pages = [
            [
                'title' => 'Home',
                'slug' => 'home',
                'content' => '<h1>Welcome to Modulo CMS</h1><p>This is the home page. You can edit this content in the admin dashboard.</p>',
                'excerpt' => 'Welcome to our website built with Modulo CMS.',
            ],
            [
                'title' => 'About',
                'slug' => 'about',
                'content' => '<h1>About Us</h1><p>Learn more about our company and mission.</p>',
                'excerpt' => 'Learn more about our company and mission.',
            ],
            [
                'title' => 'Contact',
                'slug' => 'contact',
                'content' => '<h1>Contact Us</h1><p>Get in touch with us using the information below.</p><p>Email: hello@example.com<br>Phone: (555) 123-4567</p>',
                'excerpt' => 'Get in touch with us.',
            ],
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy',
                'content' => '<h1>Privacy Policy</h1><p>Your privacy is important to us. This policy explains how we collect and use your information.</p>',
                'excerpt' => 'Our privacy policy and data handling practices.',
            ],
            [
                'title' => 'Terms of Service',
                'slug' => 'terms',
                'content' => '<h1>Terms of Service</h1><p>By using our website, you agree to these terms and conditions.</p>',
                'excerpt' => 'Terms and conditions for using our website.',
            ],
        ];

        foreach ($pages as $pageData) {
            Post::updateOrCreate(
                [
                    'slug' => $pageData['slug'],
                    'post_type_id' => $pageType->id,
                ],
                [
                    'title' => $pageData['title'],
                    'content' => $pageData['content'],
                    'excerpt' => $pageData['excerpt'],
                    'status' => 'published',
                    'published_at' => now(),
                    'author_id' => $author->id,
                ]
            );
        }
    }
}
