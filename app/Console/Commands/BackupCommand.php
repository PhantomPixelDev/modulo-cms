<?php

namespace App\Console\Commands;

use App\Services\BackupManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Throwable;

class BackupCommand extends Command
{
    protected $signature = 'modulo:backup
        {--no-media : Leave uploaded media out}
        {--no-plugins : Leave installed plugins out}
        {--with-env : Include the .env file (it holds secrets; keep the archive safe)}
        {--keep= : How many full backups to keep (default: config backups.keep)}';

    protected $description = 'Back up the database, media and plugins into one archive';

    public function handle(BackupManager $backups): int
    {
        try {
            $path = $backups->create([
                'media' => ! $this->option('no-media'),
                'plugins' => ! $this->option('no-plugins'),
                'env' => (bool) $this->option('with-env'),
            ]);
        } catch (Throwable $e) {
            $this->error('Backup failed: '.$e->getMessage());

            return self::FAILURE;
        }

        $this->info(sprintf('Backup written to %s (%s MB)', $path, round(File::size($path) / 1048576, 1)));

        $keep = $this->option('keep') !== null ? (int) $this->option('keep') : (int) config('backups.keep');
        foreach ($backups->prune($keep) as $name) {
            $this->line('Pruned '.$name);
        }

        try {
            if ($backups->copyOffsite($path)) {
                $this->info('Copied off-site to '.$backups->offsiteStatus()['target']);
            }
        } catch (Throwable $e) {
            // The local backup is fine; say loudly that the off-site copy is not
            $this->error('The off-site copy failed: '.$e->getMessage());

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
