<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\PostType;
use App\Models\TaxonomyTerm;
use App\Models\User;
use Illuminate\Database\Seeder;

/** A small, repeatable collection that exercises the current editor. */
class ExampleContentSeeder extends Seeder
{
    public function run(): void
    {
        $type = PostType::where('name', 'post')->firstOrFail();
        $author = User::where('email', 'editor@example.com')->firstOrFail();
        $items = [
            ['getting-started-with-modulo-cms', 'Getting Started with Modulo CMS', 'Create a page, publish an article, and find it through search.', '<p>Open Content in the dashboard to create pages and posts. Save a draft while working, then publish when it is ready.</p><p>Published items appear in their archive, public search, RSS, and the sitemap. Unpublishing removes them from public view.</p>', 'published', 'technology'],
            ['react-theme-partials', 'React Theme Partials', 'Try configurable React modules inside ordinary content.', '<p>Use Insert partial in the visual editor, or paste a shortcode in source mode.</p>[partial name="callout" title="From the theme" tone="success"]This callout is rendered by a React component.[partial name="disclosure" title="Read more"]Nested modules also work.[/partial][/partial]', 'published', 'design'],
            ['docker-server-setup', 'Docker Server Setup', 'Run Modulo on a server with Docker Compose and a reverse proxy.', '<p>Use the checked-in Docker Compose stack on your server. Configure the domain, database, mail, and persistent volumes before installation.</p><p><a href="https://github.com/PhantomPixelDev/modulo-cms/blob/main/docs/installation.md">Read the installation guide</a>.</p>', 'published', 'technology'],
            ['unfinished-demo-draft', 'Unfinished Demo Draft', 'An unpublished item for trying recovery and preview.', '<p>This draft is intentionally absent from public archives and search. Edit it in the dashboard to try saving and previewing.</p>', 'draft', 'design'],
            ['scheduled-demo-article', 'Scheduled Demo Article', 'An article waiting for its publication time.', '<p>This example is scheduled thirty days ahead. Change its date to try scheduling in the configured site timezone.</p>', 'scheduled', 'technology'],
        ];
        foreach ($items as $index => [$slug, $title, $excerpt, $content, $status, $category]) {
            $post = Post::updateOrCreate(['post_type_id' => $type->id, 'slug' => $slug], [
                'author_id' => $author->id, 'title' => $title, 'excerpt' => $excerpt,
                'content' => $content, 'status' => $status === 'scheduled' ? 'published' : $status,
                'published_at' => match ($status) {
                    'draft' => null,
                    'scheduled' => now()->addDays(30),
                    default => now()->subDays($index + 1),
                },
            ]);
            $terms = TaxonomyTerm::whereHas('taxonomy', fn ($q) => $q->where('slug', 'categories'))
                ->where('slug', $category)->pluck('id');
            $post->taxonomyTerms()->sync($terms);
        }
        $post = Post::where('post_type_id', $type->id)->where('slug', 'getting-started-with-modulo-cms')->firstOrFail();
        $post->setTranslation('es', [
            'title' => 'Primeros pasos con Modulo CMS', 'slug' => 'primeros-pasos-con-modulo-cms',
            'excerpt' => 'Crea una página y publica tu primer artículo.',
            'content' => '<p>Crea páginas y publicaciones desde el panel. Guarda un borrador o publica cuando esté listo.</p>',
        ]);
    }
}
