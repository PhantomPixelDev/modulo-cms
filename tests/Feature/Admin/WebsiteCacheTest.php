<?php

use App\Models\SiteSetting;
use App\Models\Theme;
use App\Services\WebsiteCache;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    activateReactTheme();
    $this->theme = Theme::where('is_active', true)->firstOrFail();
});

it('invalidates website data while preserving locks heartbeats sessions and recovery', function () {
    $generation = Cache::get('page-cache:version');
    foreach (['health:heartbeat:queue', 'session:example', 'editor-draft:example', 'lock:example'] as $key) {
        Cache::put($key, 'keep', 600);
    }
    Cache::put('active_theme', 'stale', 600);
    Cache::put('sitemap.settings', 'stale', 600);
    app(WebsiteCache::class)->clear();
    expect(Cache::get('page-cache:version'))->not->toBe($generation)
        ->and(Cache::has('active_theme'))->toBeFalse()->and(Cache::has('sitemap.settings'))->toBeFalse();
    foreach (['health:heartbeat:queue', 'session:example', 'editor-draft:example', 'lock:example'] as $key) {
        expect(Cache::get($key))->toBe('keep');
    }
});

it('requires theme customization permission and allows only scoped cache clearing on the demo', function () {
    $endpoint = route('dashboard.admin.themes.settings.clear-cache', $this->theme);
    $this->actingAs(makeAdminUserWithPermissions(['view themes']))->post($endpoint)->assertForbidden();
    config(['demo.enabled' => true]);
    $this->actingAs(makeAdminUserWithPermissions(['customize themes']))->post($endpoint)->assertRedirect();
    $this->post(route('dashboard.admin.settings.clear-cache'))->assertForbidden();
    $this->put(route('dashboard.admin.settings.update', 'cache'), ['page_cache_enabled' => false, 'page_cache_ttl' => 60])->assertForbidden();
});

it('validates cache lifetime and enforces settings permissions', function () {
    config(['demo.enabled' => false]);
    $endpoint = route('dashboard.admin.settings.update', 'cache');
    $this->actingAs(makeAdminUserWithPermissions(['view settings']))->putJson($endpoint, ['page_cache_enabled' => false, 'page_cache_ttl' => 120])->assertForbidden();
    $this->actingAs(makeAdminUserWithPermissions(['edit settings']))->putJson($endpoint, ['page_cache_enabled' => true, 'page_cache_ttl' => 59])->assertUnprocessable();
    $this->putJson($endpoint, ['page_cache_enabled' => false, 'page_cache_ttl' => 120])->assertRedirect();
    expect(SiteSetting::get('page_cache_enabled'))->toBeFalse()->and(SiteSetting::get('page_cache_ttl'))->toBe(120);
});
