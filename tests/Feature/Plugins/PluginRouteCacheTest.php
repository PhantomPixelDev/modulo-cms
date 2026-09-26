<?php

use App\Models\Plugin;
use App\Services\PluginManager;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

beforeEach(function () {
    $this->pluginRoot = storage_path('framework/testing/route-cache-'.uniqid());
    config([
        'plugins.path' => $this->pluginRoot,
        'plugins.uninstall_path' => $this->pluginRoot.'-uninstalled',
    ]);

    $dir = $this->pluginRoot.'/Routed';
    File::ensureDirectoryExists($dir);
    File::put($dir.'/plugin.json', json_encode([
        'name' => 'Routed',
        'slug' => 'routed',
        'version' => '1.0.0',
        'service_provider' => 'Plugins\\Routed\\RoutedServiceProvider',
    ]));

    // Point the route cache at a scratch file so the suite's own routing is untouched.
    $this->routeCache = storage_path('framework/testing/routes-'.uniqid().'.php');
    $_SERVER['APP_ROUTES_CACHE'] = $this->routeCache;
    File::put($this->routeCache, '<?php');

    Process::fake();
    app(PluginManager::class)->discover();
});

afterEach(function () {
    unset($_SERVER['APP_ROUTES_CACHE']);
    File::delete($this->routeCache);
    File::deleteDirectory($this->pluginRoot);
    File::deleteDirectory($this->pluginRoot.'-uninstalled');
});

it('rebuilds a cached route table when a plugin is switched on or off', function () {
    $manager = app(PluginManager::class);

    expect($manager->activate('routed'))->toBeTrue()
        ->and(File::exists($this->routeCache))->toBeFalse();
    Process::assertRanTimes(fn ($process) => in_array('route:cache', (array) $process->command, true), 1);

    File::put($this->routeCache, '<?php');
    expect($manager->deactivate('routed'))->toBeTrue()
        ->and(File::exists($this->routeCache))->toBeFalse();
    Process::assertRanTimes(fn ($process) => in_array('route:cache', (array) $process->command, true), 2);
});

it('leaves uncached routes alone', function () {
    File::delete($this->routeCache);

    expect(app(PluginManager::class)->activate('routed'))->toBeTrue()
        ->and(Plugin::where('slug', 'routed')->value('is_active'))->toBeTrue();
    Process::assertNothingRan();
});
