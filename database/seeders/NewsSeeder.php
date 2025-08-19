<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\PostType;
use App\Models\TaxonomyTerm;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class NewsSeeder extends Seeder
{
    public function run(): void
    {
        // Get the first user as author
        $authorId = User::value('id');
        if (!$authorId) {
            $this->command?->warn('No users found. Run the UserSeeder first.');
            return;
        }

        // Create or update news post type
        $newsType = PostType::updateOrCreate(
            ['name' => 'news'],
            [
                'label' => 'News',
                'plural_label' => 'News',
                'description' => 'News and announcements',
                'has_taxonomies' => true,
                'has_featured_image' => true,
                'has_excerpt' => true,
                'has_comments' => false,
                'supports' => json_encode(['title', 'editor', 'thumbnail', 'excerpt']),
                'taxonomies' => json_encode(['category']),
                'slug' => 'news',
                'route_prefix' => 'news',
                'is_public' => true,
                'is_hierarchical' => false,
                'menu_icon' => 'newspaper',
                'menu_position' => 5.5,
            ]
        );

        // Get the technology category term
        $techTerm = TaxonomyTerm::where('slug', 'technology')->first();
        
        // Example news items
        $newsItems = [
            [
                'title' => 'Modulo CMS Version 1.0 Released',
                'excerpt' => 'We are excited to announce the official release of Modulo CMS version 1.0!',
                'content' => '<p>Today marks a significant milestone for our team as we release Modulo CMS version 1.0. This release includes all the features we promised in our roadmap and is now ready for production use.</p><p>Key features include:</p><ul><li>Intuitive content management</li><li>Flexible post types and taxonomies</li><li>Role-based access control</li><li>Modern React-based admin interface</li></ul>',
                'terms' => $techTerm ? [$techTerm->id] : [],
                'published_at' => now()->subDays(2),
            ],
            [
                'title' => 'Upcoming Webinar: Getting Started with Modulo',
                'excerpt' => 'Join us for a free webinar to learn how to get started with Modulo CMS.',
                'content' => '<p>We are hosting a free webinar next week to help new users get started with Modulo CMS. Our team will walk you through the key features and answer any questions you might have.</p><p><strong>Date:</strong> ' . now()->addWeek()->format('F j, Y') . '</p><p><strong>Time:</strong> 2:00 PM - 3:00 PM (EST)</p><p>Space is limited, so please register early to secure your spot!</p>',
                'terms' => $techTerm ? [$techTerm->id] : [],
                'published_at' => now()->subDay(),
            ],
        ];

        foreach ($newsItems as $news) {
            $slug = Str::slug($news['title']);
            $post = Post::updateOrCreate(
                ['slug' => $slug, 'post_type_id' => $newsType->id],
                [
                    'author_id' => $authorId,
                    'title' => $news['title'],
                    'excerpt' => $news['excerpt'],
                    'content' => $news['content'],
                    'status' => 'published',
                    'published_at' => $news['published_at'],
                ]
            );

            if (!empty($news['terms'])) {
                $post->taxonomyTerms()->syncWithoutDetaching($news['terms']);
            }
        }

        $this->command?->info('News post type and example news items created successfully!');
    }
}
