<?php

use App\Models\Plugin;
use App\Services\PluginManager;
use App\Services\Plugins\PluginInstaller;
use App\Services\Plugins\PluginRegistry;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->work = storage_path('framework/testing/installer-'.uniqid());
    File::ensureDirectoryExists($this->work);

    config([
        'plugins.path' => $this->work.'/plugins',
        'plugins.uninstall_path' => $this->work.'/uninstalled',
        'plugins.staging_path' => $this->work.'/staging',
        'plugins.backup_path' => $this->work.'/backups',
        'plugins.registry_url' => 'https://raw.githubusercontent.com/owner/registry/main/registry.json',
        'version.version' => '1.0.0',
    ]);

    File::ensureDirectoryExists($this->work.'/plugins');
    Cache::forget(PluginRegistry::CACHE_KEY);
});

afterEach(function () {
    File::deleteDirectory($this->work);
});

/**
 * Build a plugin package the way a release asset would look.
 */
function packagePlugin(string $path, string $slug, string $namespace, string $version, array $overrides = []): string
{
    $manifest = array_merge([
        'name' => ucfirst($slug),
        'slug' => $slug,
        'namespace' => $namespace,
        'version' => $version,
        'author' => 'Tests',
        'service_provider' => 'Plugins\\'.$namespace.'\\'.$namespace.'ServiceProvider',
    ], $overrides);

    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    // A release asset carries a single top-level folder, and a GitHub source
    // archive always does -- named after the repo and ref, not the namespace.
    $zip->addFromString($slug.'-'.$version.'/plugin.json', json_encode($manifest, JSON_PRETTY_PRINT));
    $zip->addFromString($slug.'-'.$version.'/'.$namespace.'ServiceProvider.php', '<?php');
    $zip->close();

    return $path;
}

function fakeRegistry(string $slug, string $version, string $sha, array $releaseOverrides = []): void
{
    $release = array_merge([
        'version' => $version,
        'asset_url' => 'https://github.com/owner/'.$slug.'/releases/download/v'.$version.'/'.$slug.'.zip',
        'sha256' => $sha,
        'min_core_version' => '1.0.0',
    ], $releaseOverrides);

    Http::fake([
        'raw.githubusercontent.com/*' => Http::response([
            'schema' => 1,
            'plugins' => [[
                'slug' => $slug,
                'namespace' => 'Fixture',
                'name' => ucfirst($slug),
                'latest' => $release,
            ]],
        ]),
    ]);
}

it('installs a plugin from the registry', function () {
    $archive = packagePlugin($this->work.'/pkg.zip', 'fixture', 'Fixture', '1.0.0');
    $sha = hash_file('sha256', $archive);
    $bytes = File::get($archive);

    fakeRegistry('fixture', '1.0.0', $sha);
    Http::fake([
        'raw.githubusercontent.com/*' => Http::response([
            'schema' => 1,
            'plugins' => [['slug' => 'fixture', 'namespace' => 'Fixture', 'latest' => [
                'version' => '1.0.0',
                'asset_url' => 'https://github.com/owner/fixture/releases/download/v1.0.0/fixture.zip',
                'sha256' => $sha,
                'min_core_version' => '1.0.0',
            ]]],
        ]),
        'github.com/*' => Http::response($bytes),
    ]);

    $result = app(PluginInstaller::class)->install('fixture');

    expect($result['version'])->toBe('1.0.0')
        // Placed by its declared namespace, not the archive's folder name.
        ->and(File::exists(config('plugins.path').'/Fixture/plugin.json'))->toBeTrue()
        ->and(Plugin::where('slug', 'fixture')->exists())->toBeTrue()
        ->and(Plugin::where('slug', 'fixture')->value('source'))->toBe('registry');
});

it('refuses a package whose checksum does not match the registry', function () {
    $archive = packagePlugin($this->work.'/pkg.zip', 'fixture', 'Fixture', '1.0.0');
    $bytes = File::get($archive);

    Http::fake([
        'raw.githubusercontent.com/*' => Http::response([
            'schema' => 1,
            'plugins' => [['slug' => 'fixture', 'namespace' => 'Fixture', 'latest' => [
                'version' => '1.0.0',
                'asset_url' => 'https://github.com/owner/fixture/releases/download/v1.0.0/fixture.zip',
                'sha256' => str_repeat('a', 64),
                'min_core_version' => '1.0.0',
            ]]],
        ]),
        'github.com/*' => Http::response($bytes),
    ]);

    // The checksum is the whole trust root; a mismatch means arbitrary code.
    expect(fn () => app(PluginInstaller::class)->install('fixture'))
        ->toThrow(RuntimeException::class, 'checksum does not match');

    expect(File::exists(config('plugins.path').'/Fixture'))->toBeFalse();
});

it('refuses a package that requires a newer core', function () {
    $archive = packagePlugin($this->work.'/pkg.zip', 'fixture', 'Fixture', '1.0.0');
    $sha = hash_file('sha256', $archive);

    Http::fake([
        'raw.githubusercontent.com/*' => Http::response([
            'schema' => 1,
            'plugins' => [['slug' => 'fixture', 'namespace' => 'Fixture', 'latest' => [
                'version' => '1.0.0',
                'asset_url' => 'https://github.com/owner/fixture/releases/download/v1.0.0/fixture.zip',
                'sha256' => $sha,
                'min_core_version' => '99.0.0',
            ]]],
        ]),
        'github.com/*' => Http::response(File::get($archive)),
    ]);

    expect(fn () => app(PluginInstaller::class)->install('fixture'))
        ->toThrow(RuntimeException::class, 'requires Modulo 99.0.0');
});

it('refuses an asset hosted somewhere that is not allowed', function () {
    Http::fake([
        'raw.githubusercontent.com/*' => Http::response([
            'schema' => 1,
            'plugins' => [['slug' => 'fixture', 'namespace' => 'Fixture', 'latest' => [
                'version' => '1.0.0',
                // A compromised index must not be able to redirect an install.
                'asset_url' => 'https://evil.example.com/fixture.zip',
                'sha256' => str_repeat('b', 64),
            ]]],
        ]),
    ]);

    expect(fn () => app(PluginInstaller::class)->install('fixture'))
        ->toThrow(RuntimeException::class, 'not in the registry');
});

it('refuses a package that is not the plugin the registry listed', function () {
    // Right checksum, wrong contents: the registry says "fixture", the package
    // says something else.
    $archive = packagePlugin($this->work.'/pkg.zip', 'imposter', 'Fixture', '1.0.0');
    $sha = hash_file('sha256', $archive);

    Http::fake([
        'raw.githubusercontent.com/*' => Http::response([
            'schema' => 1,
            'plugins' => [['slug' => 'fixture', 'namespace' => 'Fixture', 'latest' => [
                'version' => '1.0.0',
                'asset_url' => 'https://github.com/owner/fixture/releases/download/v1.0.0/fixture.zip',
                'sha256' => $sha,
                'min_core_version' => '1.0.0',
            ]]],
        ]),
        'github.com/*' => Http::response(File::get($archive)),
    ]);

    expect(fn () => app(PluginInstaller::class)->install('fixture'))
        ->toThrow(RuntimeException::class, 'claims to be');
});

it('keeps the previous version when an update fails', function () {
    // An installed plugin that must survive a botched update.
    $target = config('plugins.path').'/Fixture';
    File::ensureDirectoryExists($target);
    File::put($target.'/plugin.json', json_encode([
        'name' => 'Fixture', 'slug' => 'fixture', 'namespace' => 'Fixture', 'version' => '1.0.0',
        'service_provider' => 'Plugins\\Fixture\\FixtureServiceProvider',
    ]));
    File::put($target.'/sentinel.txt', 'original');

    $archive = packagePlugin($this->work.'/pkg.zip', 'fixture', 'Fixture', '2.0.0');

    Http::fake([
        'raw.githubusercontent.com/*' => Http::response([
            'schema' => 1,
            'plugins' => [['slug' => 'fixture', 'namespace' => 'Fixture', 'latest' => [
                'version' => '2.0.0',
                'asset_url' => 'https://github.com/owner/fixture/releases/download/v2.0.0/fixture.zip',
                'sha256' => str_repeat('c', 64),
                'min_core_version' => '1.0.0',
            ]]],
        ]),
        'github.com/*' => Http::response(File::get($archive)),
    ]);

    expect(fn () => app(PluginInstaller::class)->install('fixture'))->toThrow(RuntimeException::class);

    // The working plugin is still there and untouched.
    expect(File::exists($target.'/sentinel.txt'))->toBeTrue()
        ->and(File::get($target.'/sentinel.txt'))->toBe('original');
});

it('only offers registry entries that could actually be installed', function () {
    Http::fake([
        'raw.githubusercontent.com/*' => Http::response([
            'schema' => 1,
            'plugins' => [
                ['slug' => 'good', 'latest' => [
                    'version' => '1.0.0',
                    'asset_url' => 'https://github.com/owner/good/releases/download/v1.0.0/good.zip',
                    'sha256' => str_repeat('d', 64),
                ]],
                // No checksum: unverifiable, so not listed.
                ['slug' => 'no-checksum', 'latest' => [
                    'version' => '1.0.0',
                    'asset_url' => 'https://github.com/owner/x/releases/download/v1.0.0/x.zip',
                ]],
                // Disallowed host.
                ['slug' => 'bad-host', 'latest' => [
                    'version' => '1.0.0',
                    'asset_url' => 'https://evil.example.com/x.zip',
                    'sha256' => str_repeat('e', 64),
                ]],
                ['slug' => 'Not A Slug', 'latest' => []],
            ],
        ]),
    ]);

    $slugs = array_column(app(PluginRegistry::class)->all(), 'slug');

    expect($slugs)->toBe(['good']);
});

it('never discovers a package still being staged next to the plugins', function () {
    // Installs copy the package beside its destination before the rename,
    // because a rename cannot cross filesystems and in Docker the plugins
    // directory is its own volume. A half-copied package must stay invisible.
    $staged = config('plugins.path').'/.incoming-fixture-abc123';
    File::ensureDirectoryExists($staged);
    File::put($staged.'/plugin.json', json_encode([
        'name' => 'Fixture', 'slug' => 'fixture', 'namespace' => 'Fixture', 'version' => '1.0.0',
        'service_provider' => 'Plugins\Fixture\FixtureServiceProvider',
    ]));

    $manager = app(PluginManager::class);
    $manager->discover();

    expect(Plugin::where('slug', 'fixture')->exists())->toBeFalse()
        ->and($manager->getLastError())->toBeNull();
});

it('leaves only the installed plugin behind after an update', function () {
    $current = null;

    // Answered per request: a stubbed response body is a stream that can only
    // be read once, and the second install needs the second package.
    Http::fake(function ($request) use (&$current) {
        if (str_contains($request->url(), 'raw.githubusercontent.com')) {
            return Http::response([
                'schema' => 1,
                'plugins' => [['slug' => 'fixture', 'namespace' => 'Fixture', 'latest' => [
                    'version' => $current['version'],
                    'asset_url' => 'https://github.com/owner/fixture/releases/download/v'.$current['version'].'/fixture.zip',
                    'sha256' => hash_file('sha256', $current['archive']),
                    'min_core_version' => '1.0.0',
                ]]],
            ]);
        }

        return Http::response(File::get($current['archive']));
    });

    foreach (['1.0.0', '1.1.0'] as $version) {
        $current = [
            'version' => $version,
            'archive' => packagePlugin($this->work.'/pkg-'.$version.'.zip', 'fixture', 'Fixture', $version),
        ];
        Cache::forget(PluginRegistry::CACHE_KEY);

        app(PluginInstaller::class)->install('fixture');
    }

    expect(array_map('basename', File::directories(config('plugins.path'))))->toBe(['Fixture'])
        ->and(File::directories(config('plugins.backup_path')))->toHaveCount(1)
        ->and(Plugin::where('slug', 'fixture')->value('version'))->toBe('1.1.0');
});

it('refuses to downgrade an installed plugin', function () {
    Plugin::create([
        'name' => 'Fixture',
        'slug' => 'fixture',
        'version' => '2.0.0',
        'service_provider' => 'Plugins\\Fixture\\FixtureServiceProvider',
        'is_active' => false,
    ]);

    fakeRegistry('fixture', '1.0.0', str_repeat('a', 64));

    expect(fn () => app(PluginInstaller::class)->install('fixture'))
        ->toThrow(RuntimeException::class, 'Refusing to downgrade');

    // Nothing was fetched or written.
    Http::assertNotSent(fn ($request) => str_contains($request->url(), '/releases/download/'));
    expect(File::exists(config('plugins.path').'/Fixture'))->toBeFalse()
        ->and(Plugin::where('slug', 'fixture')->value('version'))->toBe('2.0.0');
});
