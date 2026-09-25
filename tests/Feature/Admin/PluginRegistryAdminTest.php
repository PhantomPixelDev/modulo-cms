<?php

use App\Services\Plugins\PluginRegistry;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::forget(PluginRegistry::CACHE_KEY);
    config([
        'plugins.registry_url' => 'https://raw.githubusercontent.com/owner/registry/main/registry.json',
        'version.version' => '1.0.0',
    ]);

    // Http::fake() stubs stack, first match wins: tests needing another
    // registry response set this flag instead of faking again.
    $this->registryUp = true;
    Http::fake(['raw.githubusercontent.com/*' => fn () => $this->registryUp ? Http::response([
        'schema' => 1,
        'plugins' => [
            ['slug' => 'gallery', 'name' => 'Gallery', 'description' => 'Photo galleries', 'latest' => [
                'version' => '1.2.0',
                'asset_url' => 'https://github.com/owner/gallery/releases/download/v1.2.0/gallery.zip',
                'sha256' => str_repeat('b', 64),
            ]],
            ['slug' => 'future', 'name' => 'Future', 'latest' => [
                'version' => '1.0.0',
                'asset_url' => 'https://github.com/owner/future/releases/download/v1.0.0/future.zip',
                'sha256' => str_repeat('c', 64),
                'requires' => ['core' => '>=9.0'],
            ]],
        ],
    ]) : Http::response('', 500)]);
});

it('lists registry plugins with what stops them installing', function () {
    $this->actingAs(makeAdminUserWithPermissions(['view plugins']))
        ->getJson(route('dashboard.admin.plugins.registry'))
        ->assertOk()
        ->assertJsonPath('error', null)
        ->assertJsonPath('plugins.0.slug', 'gallery')
        ->assertJsonPath('plugins.0.unmet', [])
        ->assertJsonPath('plugins.1.unmet.0', 'Modulo 9.0 or newer (this is 1.0.0)');
});

it('reports an unreachable registry instead of failing', function () {
    $this->registryUp = false;

    $response = $this->actingAs(makeAdminUserWithPermissions(['view plugins']))
        ->getJson(route('dashboard.admin.plugins.registry'))
        ->assertOk()
        ->assertJsonPath('plugins', []);

    expect($response->json('error'))->toBeString()->not->toBeEmpty();
});

it('reports a failed install as an error message', function () {
    $this->actingAs(makeAdminUserWithPermissions(['install plugins']))
        ->post(route('dashboard.admin.plugins.install'), ['slug' => 'future'])
        ->assertRedirect()
        ->assertSessionHas('error', fn ($message) => str_contains($message, 'requires Modulo'));
});

it('only lets users who may install plugins install them', function () {
    $this->actingAs(makeAdminUserWithPermissions(['view plugins']))
        ->post(route('dashboard.admin.plugins.install'), ['slug' => 'gallery'])
        ->assertForbidden();
});
