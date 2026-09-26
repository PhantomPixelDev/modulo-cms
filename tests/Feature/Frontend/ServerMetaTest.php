<?php

use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;

beforeEach(function () {
    activateReactTheme();
    SiteSetting::set('site_name', 'Smoke Site');
});

/**
 * @return array<int, array<string, mixed>>
 */
function jsonLdIn(string $html): array
{
    preg_match_all('#<script inertia type="application/ld\+json">(.*?)</script>#s', $html, $m);

    return array_map(fn ($json) => json_decode($json, true), $m[1]);
}

it('puts the page title, description, canonical and article data in the HTML', function () {
    $type = PostType::factory()->create(['name' => 'news', 'slug' => 'news', 'route_prefix' => 'news']);
    $post = Post::factory()->published()->create([
        'post_type_id' => $type->id, 'slug' => 'launch', 'title' => 'We launched',
        'meta_title' => 'Launch day', 'meta_description' => 'All about <b>launch</b> day.',
        'featured_image' => '/storage/launch.jpg',
    ]);

    $html = $this->get('/news/launch')->assertOk()->getContent();

    expect($html)->toContain('<title inertia>Launch day | Smoke Site</title>')
        ->toContain('<meta inertia name="description" content="All about launch day.">')
        ->toContain('<link inertia rel="canonical" href="'.url('/news/launch').'">')
        ->toContain('<meta inertia property="og:image" content="'.url('/storage/launch.jpg').'">')
        ->toContain('<meta inertia property="og:type" content="article">')
        ->toContain('content="index, follow');

    expect(jsonLdIn($html)[0])->toMatchArray(['@type' => 'Article', 'headline' => 'Launch day | Smoke Site', 'url' => url('/news/launch')]);
});

it('honours a post that hides itself from search engines and a custom canonical', function () {
    makePublishedPage(['slug' => 'hidden', 'title' => 'Hidden', 'meta_data' => ['noindex' => true, 'canonical_url' => 'https://example.com/elsewhere']]);

    $html = $this->get('/hidden')->assertOk()->getContent();

    expect($html)->toContain('<meta inertia name="robots" content="noindex, follow">')
        ->toContain('<link inertia rel="canonical" href="https://example.com/elsewhere">');
});

it('escapes titles and keeps json-ld from closing its script tag', function () {
    makePublishedPage(['slug' => 'tricky', 'meta_title' => 'A "quoted" </script><script>alert(1)</script> title']);

    $html = $this->get('/tricky')->assertOk()->getContent();

    // Whatever the stored title holds, it never ends the JSON-LD script early
    expect($html)->not->toContain('<script>alert(1)</script>')
        ->and(jsonLdIn($html))->toHaveCount(1)
        ->and(jsonLdIn($html)[0]['headline'])->toContain('"quoted"')->toEndWith('title | Smoke Site');
});

it('leaves the admin without public page tags', function () {
    $this->actingAs(makeAdminUserWithPermissions());

    expect($this->get('/dashboard')->getContent())->not->toContain('og:title');
});
