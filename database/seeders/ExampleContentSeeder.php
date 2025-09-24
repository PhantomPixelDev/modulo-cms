<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Post;
use App\Models\PostType;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use App\Models\User;
use Illuminate\Support\Str;

class ExampleContentSeeder extends Seeder
{
    public function run(): void
    {
        $authorId = User::value('id');

        $postType = PostType::where('name', 'post')->first();
        $pageType = PostType::where('name', 'page')->first();
        $infoType = PostType::where('name', 'info')->first();

        if (!$postType || !$pageType || !$infoType) {
            $this->command?->warn('Post types not found. Run ContentSeeder first.');
            return;
        }

        // Categories and tags
        $category = Taxonomy::where('name', 'category')->first();
        $tagTax = Taxonomy::where('name', 'post_tag')->first();
        $uncat = TaxonomyTerm::where('slug', 'uncategorized')->first();
        $tech = TaxonomyTerm::where('slug', 'technology')->first();
        $design = TaxonomyTerm::where('slug', 'design')->first();
        $laravel = TaxonomyTerm::where('slug', 'laravel')->first();
        $react = TaxonomyTerm::where('slug', 'react')->first();

        // Example posts
        $posts = [
            [
                'title' => 'Welcome to Modulo CMS',
                'excerpt' => 'This is a demo post to showcase your new CMS.',
                'content' => '<p>Modulo CMS is installed and ready. Edit or delete this post, then start writing!</p>',
                'terms' => [$uncat?->id, $tech?->id, $laravel?->id],
            ],
            [
                'title' => 'Design System Overview',
                'excerpt' => 'A quick look at the design system and components.',
                'content' => '<p>Our design system focuses on accessibility, consistency, and performance.</p>',
                'terms' => [$design?->id, $react?->id],
            ],
            [
                'title' => 'Getting Started Guide',
                'excerpt' => 'Steps to build your first site with Modulo CMS.',
                'content' => '<ol><li>Create content types</li><li>Customize theme</li><li>Publish</li></ol>',
                'terms' => [$uncat?->id],
            ],
        ];

        foreach ($posts as $p) {
            $slug = Str::slug($p['title']);
            $post = Post::updateOrCreate(
                ['slug' => $slug, 'post_type_id' => $postType->id],
                [
                    'author_id' => $authorId,
                    'title' => $p['title'],
                    'excerpt' => $p['excerpt'],
                    'content' => $p['content'],
                    'status' => 'published',
                    'published_at' => now(),
                ]
            );

            if (!empty($p['terms'])) {
                $post->taxonomyTerms()->syncWithoutDetaching(array_filter($p['terms']));
            }
        }

        // Example pages
        $pages = [
            [
                'title' => 'Home',
                'content' => '<h2>Welcome</h2><p>This is your homepage. Customize it in the admin.</p>',
            ],
            [
                'title' => 'About',
                'content' => '<p>We build fast and flexible websites with Modulo CMS.</p>',
            ],
            [
                'title' => 'Contact',
                'content' => '<p>Contact us at <a href="mailto:hello@example.com">hello@example.com</a>.</p>',
            ],
        ];

        // Example info items
        $infoItems = [
            [
                'title' => 'Modulo CMS Version 1.0 Released',
                'excerpt' => 'We are excited to announce the official release of Modulo CMS version 1.0!',
                'content' => '<p>Today marks a significant milestone for our team as we release Modulo CMS version 1.0. This release includes all the features we promised in our roadmap and is now ready for production use.</p><p>Key features include:</p><ul><li>Intuitive content management</li><li>Flexible post types and taxonomies</li><li>Role-based access control</li><li>Modern React-based admin interface</li></ul>',
                'terms' => [$tech?->id],
                'published_at' => now()->subDays(2),
            ],
            [
                'title' => 'Upcoming Webinar: Getting Started with Modulo',
                'excerpt' => 'Join us for a free webinar to learn how to get started with Modulo CMS.',
                'content' => '<p>We are hosting a free webinar next week to help new users get started with Modulo CMS. Our team will walk you through the key features and answer any questions you might have.</p><p><strong>Date:</strong> ' . now()->addWeek()->format('F j, Y') . '</p><p><strong>Time:</strong> 2:00 PM - 3:00 PM (EST)</p><p>Space is limited, so please register early to secure your spot!</p>',
                'terms' => [$tech?->id],
                'published_at' => now()->subDay(),
            ],
        ];

        foreach ($infoItems as $info) {
            $slug = Str::slug($info['title']);
            $post = Post::updateOrCreate(
                ['slug' => $slug, 'post_type_id' => $infoType->id],
                [
                    'author_id' => $authorId,
                    'title' => $info['title'],
                    'excerpt' => $info['excerpt'],
                    'content' => $info['content'],
                    'status' => 'published',
                    'published_at' => $info['published_at'],
                ]
            );

            if (!empty($info['terms'])) {
                $post->taxonomyTerms()->syncWithoutDetaching(array_filter($info['terms']));
            }
        }

        $createdPages = [];
        foreach ($pages as $pg) {
            $slug = Str::slug($pg['title']);
            $page = Post::updateOrCreate(
                ['slug' => $slug, 'post_type_id' => $pageType->id],
                [
                    'author_id' => $authorId,
                    'title' => $pg['title'],
                    'content' => $pg['content'],
                    'status' => 'published',
                    'published_at' => now(),
                ]
            );
            $createdPages[$pg['title']] = $page;
        }

        // Optional: child page under About
        if (isset($createdPages['About'])) {
            $team = Post::updateOrCreate(
                ['slug' => 'team', 'post_type_id' => $pageType->id],
                [
                    'author_id' => $authorId,
                    'title' => 'Team',
                    'content' => '<p>Meet the team behind Modulo CMS.</p>',
                    'parent_id' => $createdPages['About']->id,
                    'status' => 'published',
                    'published_at' => now(),
                ]
            );
        }
    }
}
