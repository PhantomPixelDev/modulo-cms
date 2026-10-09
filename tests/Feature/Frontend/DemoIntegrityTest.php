<?php

use App\Models\EditorDraft;
use App\Models\MediaBucket;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use App\Models\TaxonomyTerm;
use App\Models\User;
use App\Presenters\PostPresenter;
use Database\Seeders\BootstrapSeeder;
use Database\Seeders\DemoContentSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

beforeEach(function () {
    activateReactTheme();
    $this->seed(BootstrapSeeder::class);
    $this->seed(DemoContentSeeder::class);
});

it('seeds a compact repeatable collection with independent draft and scheduled fixtures', function () {
    $this->seed(DemoContentSeeder::class);
    expect(Post::count())->toBe(12)
        ->and(Post::published()->count())->toBe(10)
        ->and(User::count())->toBe(3)
        ->and(Menu::count())->toBe(2)
        ->and(MediaBucket::where('name', 'Demo')->firstOrFail()->media()->count())->toBe(1);
    expect(Post::where('slug', 'modules')->firstOrFail()->parent_id)->toBe(Post::where('slug', 'about')->value('id'));
    $this->get('/posts/unfinished-demo-draft')->assertNotFound();
    $this->get('/posts/scheduled-demo-article')->assertNotFound();
    $this->get('/search?q=Unfinished')->assertDontSee('Unfinished Demo Draft');
    $this->get('/search?q=Scheduled')->assertDontSee('Scheduled Demo Article');
});

it('serves every seeded published item archive translation and public menu link', function () {
    foreach (Post::published()->with(['postType', 'translations'])->get() as $post) {
        $this->get($post->publicPath().'?lang=en')->assertOk()->assertSee($post->title);
        foreach ($post->translations as $translation) {
            $this->get('/'.$translation->locale.$post->publicPath($translation->slug))->assertOk()->assertSee($translation->title);
        }
        if ($post->postType->route_prefix) {
            $this->get('/'.$post->postType->route_prefix)->assertOk();
        }
    }
    foreach (MenuItem::all() as $item) {
        if (str_starts_with($item->url, '/')) {
            $this->get($item->url)->assertOk();
        }
    }
    foreach (TaxonomyTerm::with(['taxonomy', 'translations'])->get() as $term) {
        $this->get('/'.$term->taxonomy->slug.'/'.$term->slug)->assertOk();
        foreach ($term->translations as $translation) {
            $this->get('/'.$translation->locale.'/'.$term->taxonomy->slug.'/'.$translation->slug)->assertOk();
        }
    }
});

it('provides clickable search results for pages posts and announcements', function () {
    foreach (['About', 'Getting Started', 'Upcoming Webinar'] as $query) {
        $response = $this->get('/search?q='.urlencode($query))->assertOk();
        $items = $response->viewData('page')['props']['posts']['data'];
        expect($items)->not->toBeEmpty();
        foreach ($items as $item) {
            $this->get($item['url'])->assertOk()->assertSee($item['title']);
        }
    }
    $page = Post::where('slug', 'about')->with('postType')->firstOrFail();
    expect(app(PostPresenter::class)->presentPost($page, full: false)['post_type']['route_prefix'])->toBeNull();
});

it('renders and finds translated content without altering the cached default item', function () {
    $this->get('/es/acerca')->assertOk()->assertSee('Acerca de');
    $response = $this->get('/search?q=Primeros&lang=es')->assertOk();
    $items = $response->viewData('page')['props']['posts']['data'];
    expect($items)->toHaveCount(1)
        ->and($items[0]['title'])->toBe('Primeros pasos con Modulo CMS')
        ->and($items[0]['url'])->toBe('/es/posts/primeros-pasos-con-modulo-cms');
    $this->get($items[0]['url'])->assertOk()->assertInertia(fn ($page) => $page
        ->where('post.content', fn ($content) => str_contains($content, 'Crea páginas')));
    $this->get('/about?lang=en')->assertOk()->assertSee('A small site built with Modulo CMS.');
    expect(Post::where('slug', 'about')->value('title'))->toBe('About');
    $this->get('/category/technology?lang=es')->assertOk()->assertInertia(fn ($page) => $page->where('term.name', 'Tecnología'));
});

it('only publishes routable existing URLs in its sitemap and feed', function () {
    foreach (['/sitemap.xml', '/feed'] as $path) {
        $xml = simplexml_load_string($this->get($path)->assertOk()->getContent());
        $nodes = $xml->xpath('//*[local-name()="loc"] | //item/link');
        expect($nodes)->not->toBeEmpty();
        foreach ($nodes as $node) {
            $this->get(parse_url((string) $node, PHP_URL_PATH) ?: '/')->assertOk();
        }
    }
});

it('replaces disposable demo content only behind both explicit guards', function () {
    $extra = makePublishedPage(['slug' => 'visitor-page']);
    EditorDraft::create(['id' => (string) Str::uuid(), 'user_id' => $extra->author_id, 'content_type' => 'page', 'locale' => 'en', 'payload' => [], 'revision' => 1]);
    SiteSetting::set('front_page_id', $extra->id);
    foreach ([[false, true], [true, false]] as [$demo, $force]) {
        config(['demo.enabled' => $demo]);
        $this->artisan('modulo:seed-demo', ['--reset-content' => true, '--force' => $force])->assertFailed();
        expect(Post::where('slug', 'visitor-page')->exists())->toBeTrue();
    }
    config(['demo.enabled' => true]);
    $this->artisan('modulo:seed-demo', ['--reset-content' => true, '--force' => true])->assertSuccessful();
    expect(Post::withTrashed()->count())->toBe(12)
        ->and(EditorDraft::count())->toBe(0)
        ->and(Menu::count())->toBe(2)
        ->and(SiteSetting::get('front_page_id'))->toBeNull()
        ->and(config('demo.seeding_authorized'))->toBeFalse();
    $this->get('/infos/upcoming-webinar-getting-started-with-modulo')->assertOk();
});

it('preserves customized content models on a forward bootstrap run', function () {
    $type = PostType::where('name', 'post')->firstOrFail();
    $type->update(['label' => 'Journal', 'supports' => ['title'], 'route_prefix' => 'journal']);
    $this->seed(BootstrapSeeder::class);
    expect($type->fresh()->label)->toBe('Journal')
        ->and($type->fresh()->route_prefix)->toBe('journal')
        ->and($type->fresh()->supports)->toBe(['title']);
});

it('repairs legacy doubly encoded editor features without changing valid custom arrays', function () {
    $type = PostType::where('name', 'post')->firstOrFail();
    DB::table('post_types')->where('id', $type->id)->update([
        'supports' => json_encode(json_encode(['title', 'editor', 'custom-fields'])),
        'taxonomies' => json_encode(['custom-category']),
    ]);
    $migration = require database_path('migrations/2026_10_09_000001_normalize_content_model_arrays.php');
    $migration->up();
    $migration->up();
    expect($type->fresh()->supports)->toBe(['title', 'editor', 'custom-fields'])
        ->and($type->fresh()->taxonomies)->toBe(['custom-category']);
});
