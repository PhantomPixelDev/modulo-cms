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
        $type = PostType::where('name', 'page')->firstOrFail();
        $author = User::where('email', 'admin@example.com')->firstOrFail();
        $pages = [
            ['about', 'About', 'A small site built with Modulo CMS.', '<p>This demo uses Laravel 13, React, themes, and optional plugins. All sample content is disposable.</p><p>Try the <a href="/modules">content modules</a> or browse the <a href="/posts">articles</a>.</p>'],
            ['contact', 'Contact', 'Where to find the project and documentation.', '<p>For setup and development questions, see the <a href="https://github.com/PhantomPixelDev/modulo-cms/tree/main/docs">documentation</a> or <a href="https://github.com/PhantomPixelDev/modulo-cms/issues">GitHub issues</a>.</p>'],
            ['privacy', 'Privacy Policy', 'Sample privacy content for this disposable demo.', '<p>This is example content, not a privacy policy for your installation. Do not enter personal or confidential information into the public demo. Visitor content is periodically removed.</p>'],
            ['terms', 'Terms of Service', 'Sample terms for exploring the demo.', '<p>This demo is for trying the CMS. Sample products and checkout are demonstrations. Replace this page with your own terms before opening a real site.</p>'],
            ['modules', 'Content Modules', 'Interactive React partials rendered inside a page.', '<p>These modules are defined by the active theme and can be configured in the editor.</p>[partial name="callout" title="Reusable content" tone="info"]A theme component inside a page.[/partial][partial name="disclosure" title="How does it work?"]Pick a partial, set its fields, and insert it in a page or post.[/partial]'],
        ];
        foreach ($pages as [$slug, $title, $excerpt, $content]) {
            Post::updateOrCreate(['post_type_id' => $type->id, 'slug' => $slug], [
                'author_id' => $author->id, 'title' => $title, 'excerpt' => $excerpt,
                'content' => $content, 'status' => 'published', 'published_at' => now()->subDay(),
            ]);
        }
        $about = Post::where('post_type_id', $type->id)->where('slug', 'about')->firstOrFail();
        $about->setTranslation('es', [
            'title' => 'Acerca de', 'slug' => 'acerca', 'excerpt' => 'Un sitio pequeño con Modulo CMS.',
            'content' => '<p>Prueba páginas, publicaciones y módulos React en esta demostración.</p>',
        ]);
        Post::where('post_type_id', $type->id)->where('slug', 'modules')->update(['parent_id' => $about->id]);
    }
}
