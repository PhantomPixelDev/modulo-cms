<?php

use App\Models\Plugin;
use App\Services\PluginManager;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Plugins\LifecycleFixture\LifecycleFixtureServiceProvider;

require_once __DIR__.'/../../Fixtures/LifecycleFixtureServiceProvider.php';

beforeEach(function () {
    $this->pluginRoot = storage_path('framework/testing/requirements-'.uniqid());
    File::ensureDirectoryExists($this->pluginRoot);
    config([
        'plugins.path' => $this->pluginRoot,
        'plugins.uninstall_path' => $this->pluginRoot.'-uninstalled',
        'version.version' => '1.2.0',
    ]);

    LifecycleFixtureServiceProvider::$calls = [];
    LifecycleFixtureServiceProvider::$failActivation = false;
});

afterEach(function () {
    File::deleteDirectory($this->pluginRoot);
    File::deleteDirectory($this->pluginRoot.'-uninstalled');
});

/**
 * @param  array<string, mixed>  $extra  Merged into plugin.json
 */
function writeRequirementsPlugin(string $folder, string $slug, string $version = '1.0.0', array $extra = []): void
{
    $dir = config('plugins.path').'/'.$folder;
    File::ensureDirectoryExists($dir);
    File::put($dir.'/plugin.json', json_encode(array_merge([
        'name' => $folder,
        'slug' => $slug,
        'version' => $version,
        'service_provider' => 'Plugins\\'.$folder.'\\'.$folder.'ServiceProvider',
    ], $extra), JSON_PRETTY_PRINT));
    touch($dir.'/plugin.json', time() + random_int(1, 1000));
}

it('refuses to activate a plugin that needs a newer core', function () {
    writeRequirementsPlugin('Needy', 'needy', extra: ['requires' => ['core' => '>=2.0']]);
    $manager = app(PluginManager::class);
    $manager->discover();

    expect($manager->activate('needy'))->toBeFalse()
        ->and($manager->getLastError())->toContain('Modulo 2.0 or newer')
        ->and(Plugin::where('slug', 'needy')->value('is_active'))->toBeFalse();
});

it('still honours the old min_core_version field', function () {
    writeRequirementsPlugin('Legacy', 'legacy', extra: ['min_core_version' => '3.0.0']);
    $manager = app(PluginManager::class);
    $manager->discover();

    expect($manager->activate('legacy'))->toBeFalse();
});

it('requires the plugins a plugin depends on to be installed and active', function () {
    writeRequirementsPlugin('Base', 'base', '1.0.0');
    writeRequirementsPlugin('Addon', 'addon', extra: ['requires' => ['plugins' => ['base' => '>=1.0']]]);
    $manager = app(PluginManager::class);
    $manager->discover();

    expect($manager->activate('addon'))->toBeFalse()
        ->and($manager->getLastError())->toContain('base plugin to be active');

    $manager->activate('base');

    expect($manager->activate('addon'))->toBeTrue();
});

it('refuses a dependency that is too old', function () {
    writeRequirementsPlugin('Base', 'base', '1.0.0');
    writeRequirementsPlugin('Addon', 'addon', extra: ['requires' => ['plugins' => ['base' => '^1.5']]]);
    $manager = app(PluginManager::class);
    $manager->discover();
    $manager->activate('base');

    expect($manager->activate('addon'))->toBeFalse()
        ->and($manager->getLastError())->toContain('base 1.5 or newer');
});

it('will not switch off or remove a plugin another active plugin needs', function () {
    writeRequirementsPlugin('Base', 'base');
    writeRequirementsPlugin('Addon', 'addon', extra: ['requires' => ['plugins' => ['base' => '*']]]);
    $manager = app(PluginManager::class);
    $manager->discover();
    $manager->activate('base');
    $manager->activate('addon');

    expect($manager->deactivate('base'))->toBeFalse()
        ->and($manager->getLastError())->toContain('needed by Addon')
        ->and($manager->uninstall('base'))->toBeFalse();

    $manager->deactivate('addon');

    expect($manager->deactivate('base'))->toBeTrue();
});

it('runs lifecycle hooks on activate, deactivate, upgrade and uninstall', function () {
    writeRequirementsPlugin('LifecycleFixture', 'lifecycle-fixture', '1.0.0');
    $manager = app(PluginManager::class);
    $manager->discover();

    $manager->activate('lifecycle-fixture');
    $manager->deactivate('lifecycle-fixture');

    writeRequirementsPlugin('LifecycleFixture', 'lifecycle-fixture', '1.1.0');
    $manager->discover();

    $manager->uninstall('lifecycle-fixture', deleteData: true);

    expect(LifecycleFixtureServiceProvider::$calls)->toBe([
        ['onActivate', []],
        ['onDeactivate', []],
        ['onUpgrade', ['1.0.0', '1.1.0']],
        ['onUninstall', [true]],
    ]);
});

it('undoes the activation when the plugin refuses it', function () {
    writeRequirementsPlugin('LifecycleFixture', 'lifecycle-fixture');
    LifecycleFixtureServiceProvider::$failActivation = true;
    $manager = app(PluginManager::class);
    $manager->discover();

    expect($manager->activate('lifecycle-fixture'))->toBeFalse()
        ->and($manager->getLastError())->toContain('activation refused by the plugin')
        ->and(Plugin::where('slug', 'lifecycle-fixture')->value('is_active'))->toBeFalse();
});

it('drops the plugin tables only when asked to delete its data', function () {
    writeRequirementsPlugin('Tables', 'tables', extra: ['migrations_path' => 'database/migrations']);
    $migrations = config('plugins.path').'/Tables/database/migrations';
    File::ensureDirectoryExists($migrations);
    File::put($migrations.'/2026_01_01_000000_create_tables_plugin_rows.php', <<<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tables_plugin_rows', function (Blueprint $table) {
            $table->id();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tables_plugin_rows');
    }
};
PHP);

    $manager = app(PluginManager::class);
    $manager->discover();
    $manager->activate('tables');
    expect(Schema::hasTable('tables_plugin_rows'))->toBeTrue();

    $manager->uninstall('tables');
    expect(Schema::hasTable('tables_plugin_rows'))->toBeTrue();

    $manager->rediscover();
    $manager->activate('tables');
    $manager->uninstall('tables', deleteData: true);
    expect(Schema::hasTable('tables_plugin_rows'))->toBeFalse();
});

it('shows why a plugin cannot be activated on the plugins page', function () {
    writeRequirementsPlugin('Needy', 'needy', extra: ['requires' => ['core' => '>=2.0']]);
    app(PluginManager::class)->discover();

    $this->actingAs(makeAdminUserWithPermissions(['view plugins']))
        ->get(route('dashboard.admin.plugins.index'))
        ->assertInertia(fn ($page) => $page->where('plugins.0.unmet.0', 'Modulo 2.0 or newer (this is 1.2.0)'));
});
