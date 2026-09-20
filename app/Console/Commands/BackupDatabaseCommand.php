<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

/**
 * Database dump for the production stack (the scheduler runs it nightly).
 * Restore instructions live in the README.
 */
class BackupDatabaseCommand extends Command
{
    protected $signature = 'modulo:db-backup
        {--connection= : Database connection to dump (default: the configured one)}
        {--path= : Directory to write the dump to (default storage/app/backups)}
        {--keep=7 : How many dumps to keep}';

    protected $description = 'Dump the database and prune old dumps';

    public function handle(): int
    {
        $connection = DB::connection($this->option('connection') ?: null);
        $driver = $connection->getDriverName();
        $directory = $this->option('path') ?: storage_path('app/backups');

        File::ensureDirectoryExists($directory, 0750);

        $stamp = now()->format('Y-m-d_His');
        $config = $connection->getConfig();

        $target = match ($driver) {
            'pgsql' => $directory."/{$config['database']}-{$stamp}.sql",
            'mysql', 'mariadb' => $directory."/{$config['database']}-{$stamp}.sql",
            'sqlite' => $directory.'/sqlite-'.$stamp.'.sqlite',
            default => null,
        };

        if ($target === null) {
            $this->error("Unsupported database driver [{$driver}].");

            return self::FAILURE;
        }

        if (! $this->dump($driver, $config, $target)) {
            return self::FAILURE;
        }

        $this->info('Backup written to '.$target.' ('.$this->humanSize($target).')');
        $this->prune($directory, (int) $this->option('keep'));

        return self::SUCCESS;
    }

    protected function dump(string $driver, array $config, string $target): bool
    {
        if ($driver === 'sqlite') {
            $source = $config['database'];
            if (! is_string($source) || ! File::exists($source)) {
                $this->error('SQLite database file not found; nothing to back up.');

                return false;
            }

            File::copy($source, $target);

            return true;
        }

        [$command, $env] = $driver === 'pgsql'
            ? [['pg_dump', '--no-owner', '--no-acl', '--file='.$target, '--host='.$config['host'], '--port='.$config['port'], '--username='.$config['username'], $config['database']], ['PGPASSWORD' => (string) $config['password']]]
            : [['mysqldump', '--host='.$config['host'], '--port='.$config['port'], '--user='.$config['username'], '--result-file='.$target, $config['database']], ['MYSQL_PWD' => (string) $config['password']]];

        $process = new Process($command, base_path(), $env, null, 900);
        $process->run();

        if (! $process->isSuccessful()) {
            $this->error(trim($process->getErrorOutput()) ?: 'Dump failed.');

            return false;
        }

        return true;
    }

    protected function prune(string $directory, int $keep): void
    {
        if ($keep < 1) {
            return;
        }

        // Only prune dumps this command produced, never anything else that
        // happens to live in the directory.
        $files = collect(File::files($directory))
            ->filter(fn ($file) => preg_match('/-\d{4}-\d{2}-\d{2}_\d{6}\.(sql|sqlite)$/', $file->getFilename()))
            ->sortByDesc(fn ($file) => $file->getMTime())
            ->values();

        $files->slice($keep)->each(function ($file) {
            File::delete($file->getPathname());
            $this->line('Pruned '.$file->getFilename());
        });
    }

    protected function humanSize(string $path): string
    {
        $bytes = File::size($path);

        return $bytes > 1048576
            ? round($bytes / 1048576, 1).' MB'
            : round($bytes / 1024, 1).' kB';
    }
}
