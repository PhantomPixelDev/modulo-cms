<?php

use App\Models\Plugin;
use App\Services\PluginManager;
use Illuminate\Support\Facades\File;

function helloWorldMarker(): string
{
    return base_path('plugins/HelloWorld/.modulo-uninstalled');
}

afterEach(function () {
    $marker = helloWorldMarker();
    // Never leave the marker behind in the working tree
    if (File::exists($marker)) {
        File::delete($marker);
    }
});

it('discovers the bundled plugins', function () {
    app(PluginManager::class)->discover();

    expect(Plugin::where('slug', 'hello-world')->exists())->toBeTrue();
});

it('can reinstall a plugin that was uninstalled before', function () {
    $marker = helloWorldMarker();
    $manager = app(PluginManager::class);
    $manager->discover();

    expect($manager->uninstall('hello-world'))->toBeTrue()
        ->and(Plugin::where('slug', 'hello-world')->exists())->toBeFalse()
        ->and(File::exists($marker))->toBeTrue();

    // Plain discovery keeps honouring the marker...
    $manager->discover();
    expect(Plugin::where('slug', 'hello-world')->exists())->toBeFalse();

    // ...but an explicit sync from the admin brings it back
    $manager->rediscover();
    expect(Plugin::where('slug', 'hello-world')->exists())->toBeTrue()
        ->and(File::exists($marker))->toBeFalse();
});

it('syncs plugins from the admin action', function () {
    $marker = helloWorldMarker();
    $manager = app(PluginManager::class);
    $manager->discover();
    $manager->uninstall('hello-world');

    $user = makeAdminUserWithPermissions(['view plugins', 'install plugins']);
    $user->forceFill(['email_verified_at' => now()])->save();

    $this->actingAs($user)
        ->post(route('dashboard.admin.plugins.discover'))
        ->assertRedirect();

    expect(Plugin::where('slug', 'hello-world')->exists())->toBeTrue()
        ->and(File::exists($marker))->toBeFalse();
});
