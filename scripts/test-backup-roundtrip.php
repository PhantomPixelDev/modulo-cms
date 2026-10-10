<?php

use App\Models\User;
use App\Services\BackupManager;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

// Destructive only inside the disposable runtime-test container and database.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (getenv('MODULO_BACKUP_REHEARSAL') !== '1'
    || getenv('DB_DATABASE') !== 'modulo_backup_rehearsal'
    || DB::connection()->getDatabaseName() !== 'modulo_backup_rehearsal') {
    fwrite(STDERR, "Backup rehearsal requires its isolated database.\n");
    exit(1);
}

try {
    Artisan::call('migrate', ['--force' => true]);
    config([
        'backups.path' => '/tmp/backup-rehearsal/archives',
        'filesystems.disks.public.root' => '/tmp/backup-rehearsal/media',
        'plugins.path' => '/tmp/backup-rehearsal/plugins',
    ]);
    File::ensureDirectoryExists('/tmp/backup-rehearsal/media');
    File::put('/tmp/backup-rehearsal/media/probe.txt', 'original media');
    File::ensureDirectoryExists('/tmp/backup-rehearsal/plugins/Fixture');
    File::put('/tmp/backup-rehearsal/plugins/Fixture/probe.txt', 'original plugin');
    User::create(['name' => 'Backup fixture', 'email' => 'backup@example.test', 'password' => 'fixture-password']);
    $manager = app(BackupManager::class);
    $archive = $manager->create();
    User::query()->delete();
    File::put('/tmp/backup-rehearsal/media/probe.txt', 'changed');
    File::put('/tmp/backup-rehearsal/plugins/Fixture/probe.txt', 'changed');
    $manager->restore($archive, ['database', 'media', 'plugins']);
    if (User::count() !== 1
        || file_get_contents('/tmp/backup-rehearsal/media/probe.txt') !== 'original media'
        || file_get_contents('/tmp/backup-rehearsal/plugins/Fixture/probe.txt') !== 'original plugin') {
        throw new RuntimeException('Full backup roundtrip lost data.');
    }

    $zip = new ZipArchive;
    $zip->open($archive);
    $manifest = json_decode($zip->getFromName('manifest.json'), true, flags: JSON_THROW_ON_ERROR);
    $sqlName = $manifest['database']['file'];
    $sql = $zip->getFromName($sqlName);
    // Exercise archives created by the previous PG17 client against PG16.
    $zip->addFromString($sqlName, str_replace('SET statement_timeout = 0;', "SET statement_timeout = 0;\nSET transaction_timeout = 0;", $sql));
    $zip->close();
    $manager->restore($archive, ['database']);
    if (User::count() !== 1) {
        throw new RuntimeException('Legacy PG17 preamble restore lost data.');
    }

    $zip->open($archive);
    $zip->addFromString($sqlName, 'THIS IS INVALID SQL;');
    $zip->close();
    try {
        $manager->restore($archive, ['database']);
        throw new RuntimeException('Invalid SQL unexpectedly restored.');
    } catch (RuntimeException $error) {
        if (! str_starts_with($error->getMessage(), 'Database restore failed:')) {
            throw $error;
        }
    }
    if (User::count() !== 1) {
        throw new RuntimeException('Failed restore did not roll back.');
    }
    echo "BACKUP_ROUNDTRIP_OK: database, media, plugins, PG17 compatibility and failure rollback\n";
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage()."\n");
    exit(1);
}
