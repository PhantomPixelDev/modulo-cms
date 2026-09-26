<?php

use App\Jobs\RestoreBackup;
use App\Models\User;
use App\Services\BackupManager;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->work = storage_path('framework/testing/backups-admin-'.uniqid());
    config(['backups.path' => $this->work.'/backups']);
    File::ensureDirectoryExists($this->work.'/backups');
});

afterEach(fn () => File::deleteDirectory($this->work));

function backupAdmin(): User
{
    $user = makeAdminUserWithPermissions();
    $user->assignRole(Role::findOrCreate('admin', 'web'));

    return $user;
}

/**
 * A minimal archive in the backup format, as another Modulo server would write it.
 */
function uploadableBackup(string $path, bool $withManifest = true): string
{
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $zip->addFromString('database/dump.sqlite', 'bytes');
    if ($withManifest) {
        $zip->addFromString('manifest.json', json_encode([
            'format' => BackupManager::FORMAT, 'version' => '0.2.0', 'created_at' => now()->toIso8601String(),
            'database' => ['driver' => 'sqlite', 'file' => 'database/dump.sqlite'], 'contents' => ['database'],
        ]));
    }
    $zip->close();

    return $path;
}

it('queues a restore once the backup name is typed again', function () {
    Queue::fake();
    $name = 'modulo-backup-2026-09-20_031500.zip';
    uploadableBackup($this->work.'/backups/'.$name);
    $this->actingAs(backupAdmin());

    $this->post(route('dashboard.admin.system.backups.restore', $name), ['confirm' => 'something else', 'parts' => ['database']])
        ->assertSessionHasErrors('confirm');
    Queue::assertNothingPushed();

    $this->post(route('dashboard.admin.system.backups.restore', $name), ['confirm' => $name, 'parts' => ['database']])
        ->assertSessionHas('success');

    Queue::assertPushed(RestoreBackup::class, fn (RestoreBackup $job) => $job->backup === $name && $job->parts === ['database']);
    expect(RestoreBackup::current())->toMatchArray(['state' => 'queued', 'backup' => $name]);

    // One at a time
    $this->post(route('dashboard.admin.system.backups.restore', $name), ['confirm' => $name, 'parts' => ['database']])
        ->assertSessionHas('error');
});

it('shows the restore and off-site status on the page', function () {
    RestoreBackup::status('failed', 'Migrating failed', 'modulo-backup-2026-09-20_031500.zip');

    $this->actingAs(backupAdmin())->get(route('dashboard.admin.system.backups'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('backups.restore.state', 'failed')
            ->where('backups.offsite.enabled', false)
            ->has('backups.uploadMaxMb'));
});

it('takes an uploaded backup and refuses other zip files', function () {
    $this->actingAs(backupAdmin());

    $this->post(route('dashboard.admin.system.backups.upload'), [
        'backup' => new UploadedFile(uploadableBackup($this->work.'/other.zip', withManifest: false), 'other.zip', 'application/zip', null, true),
    ])->assertSessionHasErrors('backup');
    expect(File::files($this->work.'/backups'))->toBe([]);

    $this->post(route('dashboard.admin.system.backups.upload'), [
        'backup' => new UploadedFile(uploadableBackup($this->work.'/site.zip'), 'site.zip', 'application/zip', null, true),
    ])->assertSessionHas('success');

    expect(app(BackupManager::class)->all())->toHaveCount(1);
});

it('keeps restores and uploads to administrators', function () {
    $name = 'modulo-backup-2026-09-20_031500.zip';
    uploadableBackup($this->work.'/backups/'.$name);

    $this->actingAs(makeAdminUserWithPermissions(['edit settings']))
        ->post(route('dashboard.admin.system.backups.restore', $name), ['confirm' => $name, 'parts' => ['database']])
        ->assertForbidden();
});

it('copies backups off-site and keeps only the newest there', function () {
    Storage::fake('offsite');
    config(['backups.offsite_disk' => 'offsite', 'backups.offsite_path' => 'site', 'backups.offsite_keep' => 2]);
    $manager = app(BackupManager::class);

    foreach (['2026-09-01_000000', '2026-09-08_000000', '2026-09-15_000000'] as $stamp) {
        expect($manager->copyOffsite(uploadableBackup($this->work."/backups/modulo-backup-{$stamp}.zip")))->toBeTrue();
    }

    expect(Storage::disk('offsite')->files('site'))->toBe(['site/modulo-backup-2026-09-08_000000.zip', 'site/modulo-backup-2026-09-15_000000.zip'])
        ->and($manager->offsiteStatus())->toMatchArray(['enabled' => true, 'target' => 'site'])
        ->and($manager->offsiteStatus()['last'])->toMatchArray(['ok' => true, 'file' => 'modulo-backup-2026-09-15_000000.zip']);
});

it('makes no off-site copy when no disk is set up', function () {
    config(['backups.offsite_disk' => null]);

    expect(app(BackupManager::class)->copyOffsite(uploadableBackup($this->work.'/backups/modulo-backup-2026-09-01_000000.zip')))->toBeFalse();
});
