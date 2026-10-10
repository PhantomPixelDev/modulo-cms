<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\PostType;
use App\Models\User;
use Illuminate\Database\Seeder;

class InfoSeeder extends Seeder
{
    public function run(): void
    {
        $type = PostType::firstOrCreate(['name' => 'info'], [
            'slug' => 'info', 'label' => 'Announcement', 'plural_label' => 'Announcements',
            'description' => 'Demo announcements', 'route_prefix' => 'infos',
            'has_taxonomies' => false, 'has_featured_image' => true, 'has_excerpt' => true,
            'has_comments' => false, 'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
            'taxonomies' => [], 'is_public' => true, 'is_hierarchical' => false,
            'menu_icon' => 'info', 'menu_position' => 6,
        ]);
        $author = User::where('email', 'admin@example.com')->firstOrFail();
        foreach ([
            ['welcome-to-the-modulo-demo', 'Welcome to the Modulo Demo', 'A compact collection for exploring the CMS.', '<p>Try publishing, translations, reusable content modules, and the optional shop. Drafts and scheduled articles stay private until published.</p>'],
            ['upcoming-webinar-getting-started-with-modulo', 'Upcoming Webinar: Getting Started with Modulo', 'A sample announcement for testing custom content routes.', '<p>This is a demonstration announcement, not a real scheduled event. It exercises the announcement archive and public search links.</p><p>For a real introduction, read <a href="/posts/getting-started-with-modulo-cms">Getting Started with Modulo CMS</a>.</p>'],
        ] as $index => [$slug, $title, $excerpt, $content]) {
            Post::updateOrCreate(['post_type_id' => $type->id, 'slug' => $slug], [
                'author_id' => $author->id, 'title' => $title, 'excerpt' => $excerpt,
                'content' => $content, 'status' => 'published', 'published_at' => now()->subDays($index + 1),
            ]);
        }
    }
}
