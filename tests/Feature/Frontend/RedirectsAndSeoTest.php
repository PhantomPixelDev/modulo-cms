<?php

use App\Models\Post;
use App\Models\PostType;
use App\Models\Redirect;
use App\Models\SiteSetting;
use App\Models\User;
use App\Presenters\PostPresenter;
use App\Services\SitemapBuilder;
use App\Services\SiteSettingsService;
use Spatie\Permission\Models\Role;

function redirectsAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate('admin', 'web'));

    return $user;
}

it('redirects an old path, keeps the query string and counts the hit', function () {
    $redirect = Redirect::create(['from_path' => '/old-page', 'to_url' => '/new-page', 'status_code' => 301]);

    $this->get('/old-page/?utm=x')->assertStatus(301)->assertRedirect(url('/new-page').'?utm=x');

    expect($redirect->fresh()->hits)->toBe(1)
        ->and($redirect->fresh()->last_hit_at)->not->toBeNull();
});

it('never redirects the admin or other system paths', function () {
    Redirect::create(['from_path' => '/dashboard', 'to_url' => '/elsewhere', 'status_code' => 302]);

    $this->get('/dashboard')->assertRedirect(route('login'));
});

it('adds a redirect when a published post changes its slug, and keeps chains short', function () {
    $type = PostType::factory()->create(['route_prefix' => 'news']);
    $post = Post::factory()->create(['post_type_id' => $type->id, 'slug' => 'first', 'status' => 'published', 'published_at' => now()->subDay()]);

    $post->update(['slug' => 'second']);
    $post->update(['slug' => 'third']);

    expect(Redirect::where('from_path', '/news/first')->value('to_url'))->toBe('/news/third')
        ->and(Redirect::where('from_path', '/news/second')->value('to_url'))->toBe('/news/third');

    // Renamed back: no redirect may point away from the live URL.
    $post->update(['slug' => 'first']);
    expect(Redirect::where('from_path', '/news/first')->exists())->toBeFalse()
        ->and(Redirect::where('from_path', '/news/third')->value('to_url'))->toBe('/news/first');
});

it('leaves drafts alone when their slug changes', function () {
    $post = Post::factory()->create(['slug' => 'draft-a', 'status' => 'draft']);

    $post->update(['slug' => 'draft-b']);

    expect(Redirect::count())->toBe(0);
});

it('manages redirects from the admin and refuses unsafe targets', function () {
    $this->actingAs(redirectsAdmin());

    $this->post(route('dashboard.admin.system.redirects.store'), ['from_path' => 'promo', 'to_url' => 'https://example.com/sale', 'status_code' => 302])
        ->assertSessionHas('success');
    expect(Redirect::where('from_path', '/promo')->value('to_url'))->toBe('https://example.com/sale');

    $this->post(route('dashboard.admin.system.redirects.store'), ['from_path' => '/x', 'to_url' => 'javascript:alert(1)', 'status_code' => 301])
        ->assertSessionHasErrors('to_url');
    $this->post(route('dashboard.admin.system.redirects.store'), ['from_path' => '/', 'to_url' => '/y', 'status_code' => 301])
        ->assertSessionHasErrors('from_path');

    $this->get(route('dashboard.admin.system.redirects'))->assertInertia(fn ($page) => $page->where('redirects.items.total', 1));

    $this->delete(route('dashboard.admin.system.redirects.destroy', Redirect::first()))->assertSessionHas('success');
    expect(Redirect::count())->toBe(0);
});

it('shares logo, favicon, analytics and verification settings with the page', function () {
    SiteSetting::set('site_logo', '/storage/logo.png');
    SiteSetting::set('site_favicon', '/storage/icon.png');
    SiteSetting::set('google_analytics_id', 'G-TEST123');
    SiteSetting::set('google_site_verification', 'verify-me');

    $public = app(SiteSettingsService::class)->getPublicSettings();
    expect($public['site_logo'])->toBe('/storage/logo.png')
        ->and($public['analytics']['google_analytics_id'])->toBe('G-TEST123');

    $html = $this->get('/login')->getContent();
    expect($html)->toContain('<link rel="icon" href="/storage/icon.png">')
        ->and($html)->toContain('googletagmanager.com/gtag/js?id=G-TEST123')
        ->and($html)->toContain('content="verify-me"');
});

it('gives themes per-post search and social data, and hides noindex posts from the sitemap', function () {
    $type = PostType::factory()->create(['route_prefix' => 'news', 'is_public' => true]);
    $hidden = Post::factory()->create([
        'post_type_id' => $type->id, 'slug' => 'hidden', 'status' => 'published', 'published_at' => now()->subDay(),
        'featured_image' => '/storage/featured.jpg',
        'meta_data' => ['noindex' => true, 'canonical_url' => 'https://example.com/original', 'og_image' => 'javascript:bad'],
    ]);
    Post::factory()->create(['post_type_id' => $type->id, 'slug' => 'visible', 'status' => 'published', 'published_at' => now()->subDay()]);

    $seo = app(PostPresenter::class)->presentPost($hidden->load('postType'), false)['seo'];
    expect($seo['noindex'])->toBeTrue()
        ->and($seo['canonical'])->toBe('https://example.com/original')
        // An unsafe og_image falls back to the featured image.
        ->and($seo['image'])->toBe('/storage/featured.jpg');

    $xml = app(SitemapBuilder::class)->regenerate();
    expect($xml)->toContain('/news/visible')->and($xml)->not->toContain('/news/hidden');
});
