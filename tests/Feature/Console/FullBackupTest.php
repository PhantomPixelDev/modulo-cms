<?php

use App\Console\Commands\BackupDatabaseCommand;
use App\Models\User;
use App\Services\BackupManager;
use Illuminate\Support\Facades\File;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->work = storage_path('framework/testing/full-backup-'.uniqid());

    config([
        'backups.path' => $this->work.'/backups',
        'backups.keep' => 5,
        'filesystems.disks.public.root' => $this->work.'/media',
        'plugins.path' => $this->work.'/plugins',
        'version.version' => '1.2.0',
    ]);

    File::ensureDirectoryExists($this->work.'/media/uploads');
    File::put($this->work.'/media/uploads/photo.jpg', 'original photo');
    File::ensureDirectoryExists($this->work.'/plugins/Fixture/node_modules/dep');
    File::put($this->work.'/plugins/Fixture/plugin.json', '{"slug":"fixture"}');
    File::put($this->work.'/plugins/Fixture/node_modules/dep/index.js', 'x');

    // The in-memory test database cannot be dumped; the dump itself is
    // covered by BackupDatabaseCommandTest.
    app()->bind(BackupDatabaseCommand::class, fn () => new class extends BackupDatabaseCommand
    {
        public function handle(): int
        {
            $path = $this->option('path').'/sqlite-2026-09-25_010101.sqlite';
            File::put($path, 'database bytes');
            $this->info('Backup written to '.$path.' (1 KB)');

            return self::SUCCESS;
        }
    });
});

afterEach(function () {
    File::deleteDirectory($this->work);
});

it('writes one archive with the database, media, plugins and a manifest', function () {
    $this->artisan('modulo:backup')->expectsOutputToContain('Backup written to')->assertSuccessful();

    $backups = app(BackupManager::class)->all();
    expect($backups)->toHaveCount(1)
        ->and($backups[0]['version'])->toBe('1.2.0')
        ->and($backups[0]['contents'])->toBe(['database', 'media', 'plugins']);

    $zip = new ZipArchive;
    $zip->open(app(BackupManager::class)->path($backups[0]['name']));
    expect($zip->getFromName('media/uploads/photo.jpg'))->toBe('original photo')
        ->and($zip->getFromName('plugins/Fixture/plugin.json'))->not->toBeFalse()
        ->and($zip->locateName('plugins/Fixture/node_modules/dep/index.js'))->toBeFalse()
        ->and($zip->locateName('env/.env'))->toBeFalse();
    $zip->close();

    // The scratch directory is gone.
    expect(File::directories($this->work.'/backups'))->toBe([]);
});

it('only includes .env when asked', function () {
    // A fixture, not the project's own .env (CI has none).
    File::put($this->work.'/'.app()->environmentFile(), 'APP_KEY=fixture');
    app()->useEnvironmentPath($this->work);

    $this->artisan('modulo:backup', ['--with-env' => true])->assertSuccessful();

    $backup = app(BackupManager::class)->all()[0];
    expect($backup['contents'])->toContain('env');

    $zip = new ZipArchive;
    $zip->open(app(BackupManager::class)->path($backup['name']));
    expect($zip->getFromName('env/.env'))->toBe('APP_KEY=fixture');
    $zip->close();
});

it('keeps only the newest backups', function () {
    foreach (['2026-09-01_010101', '2026-09-02_010101', '2026-09-03_010101'] as $stamp) {
        File::ensureDirectoryExists($this->work.'/backups');
        File::put($this->work."/backups/modulo-backup-{$stamp}.zip", 'old');
    }
    File::put($this->work.'/backups/something-else.zip', 'not ours');

    $this->artisan('modulo:backup', ['--keep' => 2])->assertSuccessful();

    $names = array_column(app(BackupManager::class)->all(), 'name');
    expect($names)->toHaveCount(2)
        ->and($names)->not->toContain('modulo-backup-2026-09-01_010101.zip')
        ->and(File::exists($this->work.'/backups/something-else.zip'))->toBeTrue();
});

it('restores media and plugins from a backup', function () {
    $name = basename(app(BackupManager::class)->create());

    File::put($this->work.'/media/uploads/photo.jpg', 'overwritten');
    File::put($this->work.'/media/uploads/new.jpg', 'added later');

    $this->artisan('modulo:restore', ['backup' => $name, '--only' => ['media'], '--force' => true])
        ->expectsOutputToContain('Restored: media')
        ->assertSuccessful();

    expect(File::get($this->work.'/media/uploads/photo.jpg'))->toBe('original photo')
        // Files added since the backup are left alone.
        ->and(File::exists($this->work.'/media/uploads/new.jpg'))->toBeTrue()
        ->and(app()->isDownForMaintenance())->toBeFalse();
});

it('refuses a backup made by a newer version', function () {
    $name = basename(app(BackupManager::class)->create());
    config(['version.version' => '1.1.0']);

    $this->artisan('modulo:restore', ['backup' => $name, '--only' => ['media'], '--force' => true])
        ->expectsOutputToContain('newer than this install')
        ->assertFailed();

    // A failed restore leaves the site down for the operator to look at.
    expect(app()->isDownForMaintenance())->toBeTrue();
    $this->artisan('up');
});

it('refuses archive entries outside the known folders', function () {
    File::ensureDirectoryExists($this->work.'/backups');
    $path = $this->work.'/backups/modulo-backup-2026-09-04_010101.zip';
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::CREATE);
    $zip->addFromString('manifest.json', json_encode(['format' => 1, 'version' => '1.0.0', 'contents' => ['media']]));
    $zip->addFromString('media/../../escape.txt', 'nope');
    $zip->close();

    expect(fn () => app(BackupManager::class)->restore($path, ['media']))
        ->toThrow(RuntimeException::class, 'Refusing unexpected entry');
    expect(File::exists($this->work.'/escape.txt'))->toBeFalse();
});

it('rejects files that are not Modulo backups', function () {
    File::ensureDirectoryExists($this->work.'/backups');
    File::put($this->work.'/backups/random.zip', 'not a zip');

    $this->artisan('modulo:restore', ['backup' => $this->work.'/backups/random.zip', '--force' => true])
        ->expectsOutputToContain('Not a Modulo backup')
        ->assertFailed();
});

it('lets administrators create, download and delete backups', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findOrCreate('admin', 'web'));

    $this->actingAs($admin)->post(route('dashboard.admin.system.backups.store'))->assertSessionHas('success');
    $name = app(BackupManager::class)->all()[0]['name'];

    $this->actingAs($admin)->get(route('dashboard.admin.system.backups'))->assertOk();
    $this->actingAs($admin)->get(route('dashboard.admin.system.backups.download', $name))->assertOk()->assertDownload($name);
    $this->actingAs($admin)->get(route('dashboard.admin.system.backups.download', '..%2F.env'))->assertNotFound();
    $this->actingAs($admin)->delete(route('dashboard.admin.system.backups.destroy', $name))->assertSessionHas('success');

    expect(app(BackupManager::class)->all())->toBe([]);
});

it('keeps backups away from users who are not administrators', function () {
    $editor = makeAdminUserWithPermissions(['edit settings']);

    $this->actingAs($editor)->get(route('dashboard.admin.system.backups'))->assertForbidden();
    $this->actingAs($editor)->post(route('dashboard.admin.system.backups.store'))->assertForbidden();
});
