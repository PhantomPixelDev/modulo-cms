<?php

use App\Models\Theme;
use App\Services\Plugins\PluginRegistry;
use App\Services\ReactTemplateRenderer;
use App\Services\ThemeInstaller;
use App\Services\ThemeManager;
use App\Services\UpdateCenter;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->work = storage_path('framework/testing/child-themes-'.uniqid());

    config([
        'theme.install_path' => $this->work.'/themes',
        'theme.staging_path' => $this->work.'/staging',
        'plugins.registry_url' => 'https://raw.githubusercontent.com/owner/registry/main/registry.json',
        'version.version' => '1.0.0',
    ]);

    Cache::forget(PluginRegistry::CACHE_KEY);

    // The bundled parent.
    $manager = app(ThemeManager::class);
    $modern = $manager->discoverThemes()->firstWhere('config.slug', 'modern-react');
    $manager->installTheme($modern);
});

afterEach(function () {
    File::deleteDirectory($this->work);
    File::deleteDirectory(public_path('themes/ocean'));
});

/**
 * A registry package for a child theme, served by a faked registry.
 *
 * @param  array<string, string>  $extraFiles  path => contents
 * @param  array<string, mixed>  $manifest  merged into theme.json
 */
function fakeThemePackage(string $slug = 'ocean', string $version = '1.0.0', array $manifest = [], array $extraFiles = []): void
{
    $zipPath = test()->work.'/'.$slug.'.zip';
    File::ensureDirectoryExists(dirname($zipPath));

    $zip = new ZipArchive;
    $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $zip->addFromString("{$slug}-{$version}/theme.json", json_encode(array_merge([
        'name' => ucfirst($slug),
        'slug' => $slug,
        'version' => $version,
        'parent' => 'modern-react',
        'styles' => ['assets/css/ocean.css'],
        'colors' => ['primary' => 'oklch(0.55 0.15 230)'],
    ], $manifest)));
    $zip->addFromString("{$slug}-{$version}/assets/css/ocean.css", ':root { --radius: 1rem; }');
    $zip->addFromString("{$slug}-{$version}/lang/en.json", json_encode(['nav' => ['home' => 'Harbour']]));
    foreach ($extraFiles as $path => $contents) {
        $zip->addFromString("{$slug}-{$version}/{$path}", $contents);
    }
    $zip->close();

    $bytes = File::get($zipPath);

    Http::fake([
        'raw.githubusercontent.com/*' => Http::response([
            'schema' => 1,
            'plugins' => [],
            'themes' => [[
                'slug' => $slug,
                'name' => ucfirst($slug),
                'parent' => 'modern-react',
                'latest' => [
                    'version' => $version,
                    'asset_url' => "https://github.com/owner/{$slug}/releases/download/v{$version}/{$slug}.zip",
                    'sha256' => hash('sha256', $bytes),
                ],
            ]],
        ]),
        'github.com/owner/*' => Http::response($bytes),
    ]);
}

it('installs a child theme from the registry into the persistent theme folder', function () {
    fakeThemePackage();

    $result = app(ThemeInstaller::class)->install('ocean');

    $theme = Theme::where('slug', 'ocean')->firstOrFail();
    expect($result['version'])->toBe('1.0.0')
        ->and($theme->parent?->slug)->toBe('modern-react')
        ->and($theme->isRuntimeInstalled())->toBeTrue()
        ->and(File::exists($this->work.'/themes/ocean/theme.json'))->toBeTrue()
        ->and(File::exists(public_path('themes/ocean/assets/css/ocean.css')))->toBeTrue();
});

it('renders a child theme with its parent components, its styles, colours and strings', function () {
    fakeThemePackage();
    app(ThemeInstaller::class)->install('ocean');
    app(ThemeManager::class)->activateTheme('ocean');

    $response = app(ReactTemplateRenderer::class)->render('post', ['post' => ['title' => 'Hello']]);
    $page = (fn () => ['component' => $this->component, 'props' => $this->props])->call($response);

    expect($page['component'])->toBe('Themes/ModernReact/Post')
        ->and($page['props']['theme']['styles'][0])->toContain('themes/ocean/assets/css/ocean.css')
        ->and($page['props']['theme']['colors']['primary'])->toBe('oklch(0.55 0.15 230)')
        ->and($page['props']['themeTranslations']['nav']['home'])->toBe('Harbour')
        // Everything the child does not override still comes from the parent.
        ->and($page['props']['themeTranslations']['nav']['posts'])->toBe('Posts');
});

it('refuses a theme that carries code', function () {
    fakeThemePackage(extraFiles: ['functions.php' => '<?php echo 1;']);

    expect(fn () => app(ThemeInstaller::class)->install('ocean'))
        ->toThrow(RuntimeException::class, 'not allowed');

    expect(Theme::where('slug', 'ocean')->exists())->toBeFalse()
        ->and(File::exists($this->work.'/themes/ocean'))->toBeFalse();
});

it('refuses React components, which would need a rebuild', function () {
    fakeThemePackage(extraFiles: ['components/Post.tsx' => 'export default () => null']);

    expect(fn () => app(ThemeInstaller::class)->install('ocean'))
        ->toThrow(RuntimeException::class, 'not allowed');
});

it('only installs child themes at runtime', function () {
    fakeThemePackage(manifest: ['parent' => null]);

    expect(fn () => app(ThemeInstaller::class)->install('ocean'))
        ->toThrow(RuntimeException::class, 'child themes');
});

it('keeps a parent theme while a child theme builds on it, and removes a runtime theme from disk', function () {
    fakeThemePackage();
    app(ThemeInstaller::class)->install('ocean');
    $manager = app(ThemeManager::class);

    expect($manager->uninstallTheme('modern-react'))->toBeFalse()
        ->and($manager->uninstallTheme('ocean'))->toBeTrue()
        ->and(File::exists($this->work.'/themes/ocean'))->toBeFalse();
});

it('lists registry themes and installs them from the admin', function () {
    fakeThemePackage();
    $admin = makeAdminUserWithPermissions(['view themes', 'install themes']);

    $this->actingAs($admin)
        ->getJson(route('dashboard.admin.themes.registry'))
        ->assertOk()
        ->assertJsonPath('themes.0.slug', 'ocean')
        ->assertJsonPath('themes.0.parent', 'modern-react')
        ->assertJsonPath('themes.0.unmet', []);

    $this->actingAs($admin)
        ->post(route('dashboard.admin.themes.registry.install'), ['slug' => 'ocean'])
        ->assertSessionHas('success');

    expect(Theme::where('slug', 'ocean')->exists())->toBeTrue();
});

it('offers and applies registry theme updates in the update center', function () {
    fakeThemePackage(version: '1.0.0');
    app(ThemeInstaller::class)->install('ocean');

    // A newer release appears; fakes stack, so start from a fresh client.
    Http::swap(new Factory);
    Cache::forget(PluginRegistry::CACHE_KEY);
    config(['updates.enabled' => false]);
    fakeThemePackage(version: '1.1.0');

    $center = app(UpdateCenter::class);
    $center->refresh();

    expect($center->themeUpdates())->toHaveCount(1)
        ->and($center->themeUpdates()[0]['available'])->toBe('1.1.0');

    $admin = makeAdminUserWithPermissions(['install themes']);
    $this->actingAs($admin)
        ->post(route('dashboard.admin.system.updates.themes.update', 'ocean'))
        ->assertSessionHas('success');

    expect(Theme::where('slug', 'ocean')->value('version'))->toBe('1.1.0')
        ->and($center->themeUpdates())->toBe([]);
});
