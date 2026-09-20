<?php

use Illuminate\Support\Facades\File;

function backupDirectory(): string
{
    return storage_path('framework/testing/backups');
}

beforeEach(function () {
    File::deleteDirectory(backupDirectory());
});

afterEach(function () {
    File::deleteDirectory(backupDirectory());
});

/**
 * A throwaway file-backed SQLite connection; the default one stays untouched
 * so RefreshDatabase keeps its transaction.
 */
function registerBackupConnection(): void
{
    $file = backupDirectory().'/source.sqlite';
    File::ensureDirectoryExists(dirname($file));
    touch($file);

    config(['database.connections.backup_test' => ['driver' => 'sqlite', 'database' => $file, 'prefix' => '']]);
}

it('writes a dump and reports where it went', function () {
    registerBackupConnection();

    $this->artisan('modulo:db-backup', ['--connection' => 'backup_test', '--path' => backupDirectory()])
        ->expectsOutputToContain('Backup written to')
        ->assertSuccessful();

    expect(File::glob(backupDirectory().'/sqlite-*.sqlite'))->toHaveCount(1);
});

it('keeps only the requested number of dumps', function () {
    registerBackupConnection();

    foreach (range(1, 3) as $i) {
        $name = backupDirectory()."/modulo-2026-09-0{$i}_010101.sql";
        File::put($name, 'dump');
        touch($name, now()->subDays($i)->timestamp);
    }

    $this->artisan('modulo:db-backup', ['--connection' => 'backup_test', '--path' => backupDirectory(), '--keep' => 2])
        ->assertSuccessful();

    $dumps = collect(File::files(backupDirectory()))
        ->filter(fn ($file) => preg_match('/-\d{4}-\d{2}-\d{2}_\d{6}\.(sql|sqlite)$/', $file->getFilename()));

    // The fresh dump plus the most recent old one; unrelated files are untouched
    expect($dumps)->toHaveCount(2)
        ->and(File::exists(backupDirectory().'/source.sqlite'))->toBeTrue();
});

it('fails clearly for unsupported drivers', function () {
    config(['database.connections.unsupported_test' => ['driver' => 'sqlsrv', 'database' => 'x', 'prefix' => '']]);

    $this->artisan('modulo:db-backup', ['--connection' => 'unsupported_test', '--path' => backupDirectory()])
        ->expectsOutputToContain('Unsupported database driver')
        ->assertFailed();
});
