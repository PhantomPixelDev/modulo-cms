<?php

use App\Models\Plugin;
use App\Services\PluginManager;
use Illuminate\Support\Facades\File;

/**
 * A sample plugin in a throwaway plugins directory: core ships none.
 */
beforeEach(function () {
    $this->pluginsDir = storage_path('framework/testing/lifecycle-'.getmypid());
    File::deleteDirectory($this->pluginsDir);
    File::ensureDirectoryExists($this->pluginsDir.'/LifecycleSample');
    File::put($this->pluginsDir.'/LifecycleSample/plugin.json', json_encode([
        'name' => 'Hello World', 'slug' => 'hello-world', 'version' => '1.0.0',
        'service_provider' => 'Plugins\LifecycleSample\SampleServiceProvider',
    ]));
    config(['plugins.path' => $this->pluginsDir]);
});

/**
 * Where an uninstall is recorded.
 *
 * Deliberately outside the plugin's own directory: a marker written inside the
 * package is destroyed whenever those files are replaced during an update,
 * which silently resurrects a plugin the operator removed.
 */
function helloWorldUninstallRecord(): string
{
    return rtrim((string) config('plugins.uninstall_path'), '/').'/hello-world.json';
}

function helloWorldLegacyMarker(): string
{
    return config('plugins.path').'/LifecycleSample/.modulo-uninstalled';
}

afterEach(function () {
    // Never leave uninstall state behind.
    File::delete(helloWorldUninstallRecord());
    File::deleteDirectory($this->pluginsDir);
});

it('discovers installed plugins', function () {
    app(PluginManager::class)->discover();

    expect(Plugin::where('slug', 'hello-world')->exists())->toBeTrue();
});

it('can reinstall a plugin that was uninstalled before', function () {
    $manager = app(PluginManager::class);
    $manager->discover();

    expect($manager->uninstall('hello-world'))->toBeTrue()
        ->and(Plugin::where('slug', 'hello-world')->exists())->toBeFalse()
        ->and(File::exists(helloWorldUninstallRecord()))->toBeTrue()
        // Nothing is written into the package itself any more.
        ->and(File::exists(helloWorldLegacyMarker()))->toBeFalse();

    // Plain discovery keeps honouring the record...
    $manager->discover();
    expect(Plugin::where('slug', 'hello-world')->exists())->toBeFalse();

    // ...but an explicit sync from the admin brings it back.
    $manager->rediscover();
    expect(Plugin::where('slug', 'hello-world')->exists())->toBeTrue()
        ->and(File::exists(helloWorldUninstallRecord()))->toBeFalse();
});

it('still honours a marker left inside the package by an older version', function () {
    $manager = app(PluginManager::class);
    $manager->discover();

    // An install that uninstalled a plugin before this changed has its
    // decision recorded in the old place; upgrading must not undo it.
    File::put(helloWorldLegacyMarker(), (string) now());
    Plugin::where('slug', 'hello-world')->delete();

    $manager->discover();

    expect(Plugin::where('slug', 'hello-world')->exists())->toBeFalse();
});

it('syncs plugins from the admin action', function () {
    $manager = app(PluginManager::class);
    $manager->discover();
    $manager->uninstall('hello-world');

    $user = makeAdminUserWithPermissions(['view plugins', 'install plugins']);
    $user->forceFill(['email_verified_at' => now()])->save();

    $this->actingAs($user)
        ->post(route('dashboard.admin.plugins.discover'))
        ->assertRedirect();

    expect(Plugin::where('slug', 'hello-world')->exists())->toBeTrue()
        ->and(File::exists(helloWorldUninstallRecord()))->toBeFalse();
});
