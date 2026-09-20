<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\PostType;
use App\Models\User;
use Illuminate\Database\Seeder;

class DefaultPagesSeeder extends Seeder
{
    public function run(): void
    {
        // The page post type is bootstrap data and belongs to ContentSeeder.
        // If it is missing, this seeder has been run out of order.
        $pageType = PostType::where('name', 'page')->first();

        if (! $pageType) {
            $this->command?->warn('DefaultPagesSeeder: no "page" post type; run ContentSeeder first. Skipping.');

            return;
        }

        $author = User::where('is_admin', true)->first() ?? User::first();

        if (! $author) {
            $this->command?->warn('DefaultPagesSeeder: no user to attribute pages to. Skipping.');

            return;
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
                'content' => '<h1>Contact Us</h1><p>Have a question? Send us a message and we’ll get back to you shortly.</p>[contact_form subject="Contact request"]',
                'excerpt' => 'Get in touch with us via the contact form.',
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
