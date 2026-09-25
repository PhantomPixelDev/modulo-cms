<?php

namespace App\Console\Commands;

use App\Services\BackupManager;
use App\Support\SchemaVersion;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

class RestoreCommand extends Command
{
    protected $signature = 'modulo:restore
        {backup : A backup file name from storage/app/backups, or a path to one}
        {--only=* : Restore only some parts: database, media, plugins}
        {--no-migrate : Do not migrate the restored database up to this version}
        {--force : Do not ask for confirmation}';

    protected $description = 'Restore a backup made by modulo:backup (replaces the database)';

    public function handle(BackupManager $backups): int
    {
        $argument = (string) $this->argument('backup');
        $archive = $backups->path($argument) ?? (File::isFile($argument) ? $argument : null);

        if ($archive === null) {
            $this->error("Backup '{$argument}' not found.");

            return self::FAILURE;
        }

        $manifest = $backups->manifest($archive);
        if ($manifest === null) {
            $this->error('Not a Modulo backup (no readable manifest.json).');

            return self::FAILURE;
        }

        $parts = $this->option('only') ?: ['database', 'media', 'plugins'];
        $this->line(sprintf('Backup made by Modulo %s on %s, containing: %s',
            $manifest['version'] ?? '?', $manifest['created_at'] ?? '?', implode(', ', (array) ($manifest['contents'] ?? []))));

        if (! $this->option('force') && ! $this->confirm('This replaces '.implode(', ', $parts).' with the backup. Continue?')) {
            $this->line('Cancelled.');

            return self::FAILURE;
        }

        $wasDown = app()->isDownForMaintenance();
        if (! $wasDown) {
            $this->callSilently('down', ['--retry' => 60]);
        }

        try {
            $restored = $backups->restore($archive, $parts);
            $this->info('Restored: '.(implode(', ', $restored) ?: 'nothing'));

            if (in_array('database', $restored, true) && ! $this->option('no-migrate')) {
                // An older backup is brought up to the running version's schema.
                if ($this->call('migrate', ['--force' => true]) !== 0) {
                    $this->error('Migrating the restored database failed; the site stays in maintenance mode.');

                    return self::FAILURE;
                }
                SchemaVersion::recordCurrent();
            }
        } catch (Throwable $e) {
            $this->error('Restore failed: '.$e->getMessage());
            $this->warn('The site stays in maintenance mode. Fix the problem and retry, or bring it back with: php artisan up');

            return self::FAILURE;
        }

        $this->callSilently('optimize:clear');

        if (! $wasDown) {
            $this->callSilently('up');
        }

        if (in_array('env', (array) ($manifest['contents'] ?? []), true)) {
            $this->line('The backup also holds a .env file; it was not restored. Copy values from it by hand if needed.');
        }

        return self::SUCCESS;
    }
}
