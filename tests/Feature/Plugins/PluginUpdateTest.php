<?php

use App\Models\Plugin;
use App\Services\PluginManager;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

/**
 * Writes a plugin package on disk, the way an update-by-replace would.
 */
function writeFixturePlugin(string $folder, string $slug, string $version, ?string $migrationStub = null): string
{
    $root = config('plugins.path');
    $dir = $root.'/'.$folder;

    File::ensureDirectoryExists($dir);

    $manifest = [
        'name' => 'Fixture '.$folder,
        'slug' => $slug,
        'version' => $version,
        'description' => 'Fixture plugin',
        'author' => 'Tests',
        'service_provider' => 'Plugins\\'.$folder.'\\'.$folder.'ServiceProvider',
    ];

    if ($migrationStub !== null) {
        $manifest['migrations_path'] = 'database/migrations';
        File::ensureDirectoryExists($dir.'/database/migrations');
        File::put($dir.'/database/migrations/'.$migrationStub.'.php', <<<'PHP'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('fixture_plugin_items')) {
            Schema::create('fixture_plugin_items', function (Blueprint $table) {
                $table->id();
                $table->string('label');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fixture_plugin_items');
    }
};
PHP);
    }

    File::put($dir.'/plugin.json', json_encode($manifest, JSON_PRETTY_PRINT));

    // The manifest fingerprint is built from mtime and size, and a test can
    // rewrite a file inside the same second.
    touch($dir.'/plugin.json', time() + random_int(1, 1000));

    return $dir;
}

beforeEach(function () {
    $this->pluginRoot = storage_path('framework/testing/plugins-'.uniqid());
    File::ensureDirectoryExists($this->pluginRoot);
    config(['plugins.path' => $this->pluginRoot]);
    config(['plugins.uninstall_path' => $this->pluginRoot.'-uninstalled']);
});

afterEach(function () {
    File::deleteDirectory($this->pluginRoot);
    File::deleteDirectory($this->pluginRoot.'-uninstalled');
});

it('records a newly discovered plugin with the time it was installed', function () {
    writeFixturePlugin('FixtureOne', 'fixture-one', '1.0.0');

    app(PluginManager::class)->discover();

    $plugin = Plugin::where('slug', 'fixture-one')->firstOrFail();

    expect($plugin->version)->toBe('1.0.0')
        // Declared fillable, cast to a date, present in the TypeScript interface
        // and, until now, written by nothing at all.
        ->and($plugin->installed_at)->not->toBeNull();
});

it('runs the new migrations when a plugin is updated on disk', function () {
    writeFixturePlugin('FixtureOne', 'fixture-one', '1.0.0');

    $manager = app(PluginManager::class);
    $manager->discover();
    $manager->activate('fixture-one');

    // Replace the package with a newer version that carries a migration, which
    // is exactly what updating a plugin does.
    writeFixturePlugin('FixtureOne', 'fixture-one', '1.1.0', migrationStub: '2026_01_01_000000_create_fixture_plugin_items_table');

    $manager->discover();

    expect(Plugin::where('slug', 'fixture-one')->value('version'))->toBe('1.1.0')
        // The bug: the recorded version was bumped and the migration never ran,
        // leaving the plugin pointing at a table that does not exist.
        ->and(Schema::hasTable('fixture_plugin_items'))->toBeTrue();
});

it('does not downgrade the recorded version when older files appear', function () {
    writeFixturePlugin('FixtureOne', 'fixture-one', '2.0.0');
    $manager = app(PluginManager::class);
    $manager->discover();

    writeFixturePlugin('FixtureOne', 'fixture-one', '1.0.0');
    $manager->discover();

    expect(Plugin::where('slug', 'fixture-one')->value('version'))->toBe('2.0.0');
});

it('explains why a plugin was rejected instead of silently skipping it', function () {
    $dir = config('plugins.path').'/BadPlugin';
    File::ensureDirectoryExists($dir);
    File::put($dir.'/plugin.json', json_encode([
        'name' => 'Bad Plugin',
        'slug' => 'bad-plugin',
        'version' => '1.0.0',
        // Namespace does not match the directory, which is the single most
        // common packaging mistake and previously produced no message at all.
        'service_provider' => 'Plugins\\SomethingElse\\SomethingElseServiceProvider',
    ], JSON_PRETTY_PRINT));

    $manager = app(PluginManager::class);
    $manager->discover();

    expect(Plugin::where('slug', 'bad-plugin')->exists())->toBeFalse()
        ->and($manager->getLastError())->not->toBeNull()
        ->and($manager->getLastError())->toContain('BadPlugin');
});

it('keeps an uninstall record outside the plugin directory', function () {
    writeFixturePlugin('FixtureOne', 'fixture-one', '1.0.0');

    $manager = app(PluginManager::class);
    $manager->discover();
    $manager->uninstall('fixture-one');

    // A marker inside the package would be wiped by the next update-by-replace,
    // silently resurrecting a plugin the operator removed.
    expect(File::exists(config('plugins.path').'/FixtureOne/.modulo-uninstalled'))->toBeFalse()
        ->and(File::exists(config('plugins.uninstall_path').'/fixture-one.json'))->toBeTrue();

    $manager->discover();
    expect(Plugin::where('slug', 'fixture-one')->exists())->toBeFalse();
});

it('can reinstall a plugin that was previously uninstalled', function () {
    writeFixturePlugin('FixtureOne', 'fixture-one', '1.0.0');

    $manager = app(PluginManager::class);
    $manager->discover();
    $manager->uninstall('fixture-one');
    $manager->rediscover();

    expect(Plugin::where('slug', 'fixture-one')->exists())->toBeTrue();
});
