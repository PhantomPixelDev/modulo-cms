<?php

use App\Services\BackupManager;
use Illuminate\Support\Facades\File;

it('rejects oversized backup expansion before writing an entry', function () {
    $directory = storage_path('framework/testing/backup-limits-'.uniqid());
    File::ensureDirectoryExists($directory);
    $zip = new ZipArchive;
    $zip->open($directory.'/backup.zip', ZipArchive::CREATE);
    $zip->addFromString('media/first.txt', str_repeat('x', 128));
    $zip->addFromString('media/second.txt', str_repeat('y', 128));
    $zip->close();
    config(['backups.max_total_bytes' => 200, 'backups.max_entry_bytes' => 200]);
    $manager = new class extends BackupManager
    {
        public function extractForTest(string $archive, string $destination): void
        {
            $this->extract($archive, $destination);
        }
    };
    try {
        expect(fn () => $manager->extractForTest($directory.'/backup.zip', $directory.'/extracted'))->toThrow(RuntimeException::class);
        expect(File::exists($directory.'/extracted/media/first.txt'))->toBeFalse();
    } finally {
        File::deleteDirectory($directory);
    }
});

it('refuses an oversized backup manifest without expanding it into memory', function () {
    $path = storage_path('framework/testing/large-manifest-'.uniqid().'.zip');
    File::ensureDirectoryExists(dirname($path));
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::CREATE);
    $zip->addFromString('manifest.json', str_repeat('x', 1048577));
    $zip->close();
    try {
        expect(app(BackupManager::class)->manifest($path))->toBeNull();
    } finally {
        File::delete($path);
    }
});
