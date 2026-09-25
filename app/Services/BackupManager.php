<?php

namespace App\Services;

use App\Support\SchemaVersion;
use App\Support\Version;
use FilesystemIterator;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use RecursiveCallbackFilterIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RuntimeException;
use SplFileInfo;
use Symfony\Component\Process\Process;
use Throwable;
use ZipArchive;

/**
 * Full-site backups: one zip with the database dump, uploaded media and
 * installed plugins, plus a manifest saying which Modulo version made it.
 *
 * Layout of an archive:
 *   manifest.json
 *   database/<dump>.sql|.sqlite
 *   media/...        (storage/app/public)
 *   plugins/...      (the plugins directory)
 *   env/.env         (only with --with-env)
 */
class BackupManager
{
    public const FORMAT = 1;

    public const NAME_PATTERN = '/^modulo-backup-\d{4}-\d{2}-\d{2}_\d{6}\.zip$/';

    public function directory(): string
    {
        return rtrim((string) config('backups.path'), '/');
    }

    /** Uploaded media: the public disk's root. */
    public function mediaPath(): string
    {
        return rtrim((string) config('filesystems.disks.public.root', storage_path('app/public')), '/');
    }

    /**
     * @param  array{media?: bool, plugins?: bool, env?: bool}  $options
     * @return string The archive's path
     *
     * @throws RuntimeException
     */
    public function create(array $options = []): string
    {
        $options += ['media' => true, 'plugins' => true, 'env' => false];

        File::ensureDirectoryExists($this->directory(), 0750);

        $stamp = now()->format('Y-m-d_His');
        $target = $this->directory().'/modulo-backup-'.$stamp.'.zip';
        $scratch = $this->directory().'/.tmp-'.$stamp.'-'.bin2hex(random_bytes(3));

        try {
            File::ensureDirectoryExists($scratch, 0700);

            // The database dump is the existing, tested command's job.
            $exit = Artisan::call('modulo:db-backup', ['--path' => $scratch, '--keep' => 0]);
            $dumps = File::files($scratch);

            if ($exit !== 0 || count($dumps) !== 1) {
                throw new RuntimeException('The database dump failed: '.trim(Artisan::output()));
            }

            $zip = new ZipArchive;
            if ($zip->open($target, ZipArchive::CREATE | ZipArchive::EXCL) !== true) {
                throw new RuntimeException('Could not create '.$target.'.');
            }

            $contents = ['database'];
            $zip->addFile($dumps[0]->getPathname(), 'database/'.$dumps[0]->getFilename());

            if ($options['media'] && File::isDirectory($media = $this->mediaPath())) {
                $this->addDirectory($zip, $media, 'media');
                $contents[] = 'media';
            }

            if ($options['plugins'] && File::isDirectory($plugins = (string) config('plugins.path'))) {
                $this->addDirectory($zip, $plugins, 'plugins', ['node_modules']);
                $contents[] = 'plugins';
            }

            if ($options['env'] && File::exists($env = base_path('.env'))) {
                $zip->addFile($env, 'env/.env');
                $contents[] = 'env';
            }

            $zip->addFromString('manifest.json', (string) json_encode([
                'format' => self::FORMAT,
                'version' => Version::current(),
                'schema_version' => SchemaVersion::recorded(),
                'created_at' => now()->toIso8601String(),
                'database' => [
                    'driver' => DB::connection()->getDriverName(),
                    'file' => 'database/'.$dumps[0]->getFilename(),
                ],
                'contents' => $contents,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            if (! $zip->close()) {
                throw new RuntimeException('Could not write '.$target.'.');
            }

            @chmod($target, 0640);
        } catch (Throwable $e) {
            File::delete($target);

            throw $e instanceof RuntimeException ? $e : new RuntimeException($e->getMessage(), 0, $e);
        } finally {
            File::deleteDirectory($scratch);
        }

        return $target;
    }

    /**
     * Newest first.
     *
     * @return array<int, array{name: string, size: int, created_at: string, version: string|null, contents: array<int, string>}>
     */
    public function all(): array
    {
        if (! File::isDirectory($this->directory())) {
            return [];
        }

        return collect(File::files($this->directory()))
            ->filter(fn ($file) => preg_match(self::NAME_PATTERN, $file->getFilename()) === 1)
            ->sortByDesc(fn ($file) => $file->getFilename())
            ->map(function ($file) {
                $manifest = $this->manifest($file->getPathname()) ?? [];

                return [
                    'name' => $file->getFilename(),
                    'size' => (int) $file->getSize(),
                    'created_at' => is_string($manifest['created_at'] ?? null)
                        ? $manifest['created_at']
                        : date(DATE_ATOM, (int) $file->getMTime()),
                    'version' => is_string($manifest['version'] ?? null) ? $manifest['version'] : null,
                    'contents' => array_values(array_filter((array) ($manifest['contents'] ?? []), 'is_string')),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * The path of a backup by file name. Only names this class produces are
     * accepted, so a request can never point outside the backup directory.
     */
    public function path(string $name): ?string
    {
        if (preg_match(self::NAME_PATTERN, $name) !== 1) {
            return null;
        }

        $path = $this->directory().'/'.$name;

        return File::exists($path) ? $path : null;
    }

    public function delete(string $name): bool
    {
        $path = $this->path($name);

        return $path !== null && File::delete($path);
    }

    /**
     * Delete all but the newest $keep backups.
     *
     * @return array<int, string> Deleted file names
     */
    public function prune(int $keep): array
    {
        if ($keep < 1) {
            return [];
        }

        $deleted = [];
        foreach (array_slice($this->all(), $keep) as $backup) {
            if ($this->delete($backup['name'])) {
                $deleted[] = $backup['name'];
            }
        }

        return $deleted;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function manifest(string $archive): ?array
    {
        $zip = new ZipArchive;
        if ($zip->open($archive, ZipArchive::RDONLY) !== true) {
            return null;
        }

        $raw = $zip->getFromName('manifest.json');
        $zip->close();

        $manifest = is_string($raw) ? json_decode($raw, true) : null;

        return is_array($manifest) ? $manifest : null;
    }

    /**
     * Put a backup back. The caller is responsible for maintenance mode.
     *
     * Media and plugin files are written over the current ones; files added
     * since the backup are left alone. The .env file is never restored
     * automatically: its secrets belong to this server.
     *
     * @param  array<int, string>  $parts  Any of database, media, plugins
     * @return array<int, string> The parts restored
     *
     * @throws RuntimeException
     */
    public function restore(string $archive, array $parts = ['database', 'media', 'plugins']): array
    {
        $manifest = $this->manifest($archive);

        if ($manifest === null || ($manifest['format'] ?? null) !== self::FORMAT) {
            throw new RuntimeException('Not a Modulo backup (no readable manifest.json).');
        }

        $madeBy = is_string($manifest['version'] ?? null) ? $manifest['version'] : null;
        if ($madeBy !== null && ! Version::isDev() && ! str_ends_with($madeBy, '-dev') && Version::compare($madeBy) < 0) {
            throw new RuntimeException("This backup was made by Modulo {$madeBy}, which is newer than this install (".Version::current().'). Update first, then restore.');
        }

        $parts = array_values(array_intersect($parts, (array) ($manifest['contents'] ?? [])));
        $scratch = $this->directory().'/.restore-'.bin2hex(random_bytes(4));

        try {
            $this->extract($archive, $scratch);

            if (in_array('database', $parts, true)) {
                $driver = (string) ($manifest['database']['driver'] ?? '');
                $dump = $scratch.'/'.ltrim((string) ($manifest['database']['file'] ?? ''), '/');

                if ($driver !== DB::connection()->getDriverName()) {
                    throw new RuntimeException("The backup's database is {$driver}; this install uses ".DB::connection()->getDriverName().'.');
                }

                if (! File::isFile($dump) || ! str_starts_with((string) realpath($dump), (string) realpath($scratch))) {
                    throw new RuntimeException('The backup has no database dump.');
                }

                $this->restoreDatabase($driver, $dump);
            }

            if (in_array('media', $parts, true) && File::isDirectory($scratch.'/media')) {
                File::ensureDirectoryExists($this->mediaPath());
                File::copyDirectory($scratch.'/media', $this->mediaPath());
            }

            if (in_array('plugins', $parts, true) && File::isDirectory($scratch.'/plugins')) {
                File::ensureDirectoryExists((string) config('plugins.path'));
                File::copyDirectory($scratch.'/plugins', (string) config('plugins.path'));
            }
        } finally {
            File::deleteDirectory($scratch);
        }

        return $parts;
    }

    protected function restoreDatabase(string $driver, string $dump): void
    {
        $config = DB::connection()->getConfig();

        if ($driver === 'sqlite') {
            $database = (string) $config['database'];
            if ($database === ':memory:' || $database === '') {
                throw new RuntimeException('Cannot restore into an in-memory SQLite database.');
            }

            DB::disconnect();
            File::copy($dump, $database);
            DB::reconnect();

            return;
        }

        [$command, $env, $input] = match ($driver) {
            // Empty the schema first (a plain pg_dump has no DROP statements),
            // stop at the first error, and do it all in one transaction so a
            // failed restore leaves the current data in place.
            'pgsql' => [[
                'psql', '--host='.$config['host'], '--port='.$config['port'], '--username='.$config['username'],
                '--dbname='.$config['database'], '--quiet', '--set=ON_ERROR_STOP=1', '--single-transaction',
                '--command=DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;', '--file='.$dump,
            ], ['PGPASSWORD' => (string) $config['password']], null],
            'mysql', 'mariadb' => [[
                'mysql', '--host='.$config['host'], '--port='.$config['port'], '--user='.$config['username'], $config['database'],
            ], ['MYSQL_PWD' => (string) $config['password']], fopen($dump, 'rb')],
            default => throw new RuntimeException("Restoring {$driver} databases is not supported."),
        };

        DB::disconnect();

        $process = new Process($command, base_path(), $env, $input, 1800);
        $process->run();

        DB::reconnect();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('Database restore failed: '.(trim($process->getErrorOutput()) ?: 'unknown error'));
        }
    }

    /**
     * Extract only the parts a backup can contain, refusing any entry whose
     * name would land outside the destination.
     */
    protected function extract(string $archive, string $destination): void
    {
        $zip = new ZipArchive;
        if ($zip->open($archive, ZipArchive::RDONLY) !== true) {
            throw new RuntimeException('Could not open the backup.');
        }

        try {
            File::ensureDirectoryExists($destination, 0700);

            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = (string) $zip->getNameIndex($i);

                if ($name === 'manifest.json' || str_ends_with($name, '/')) {
                    continue;
                }

                if (! preg_match('#^(database|media|plugins|env)/#', $name)
                    || str_contains($name, '\\') || str_contains($name, "\0")
                    || in_array('..', explode('/', $name), true)) {
                    throw new RuntimeException("Refusing unexpected entry '{$name}' in the backup.");
                }

                $target = $destination.'/'.$name;
                File::ensureDirectoryExists(dirname($target));

                $in = $zip->getStream($name);
                $out = fopen($target, 'wb');
                if ($in === false || $out === false) {
                    throw new RuntimeException("Could not extract '{$name}'.");
                }
                stream_copy_to_stream($in, $out);
                fclose($in);
                fclose($out);
            }
        } finally {
            $zip->close();
        }
    }

    /**
     * @param  array<int, string>  $skip  Directory names to leave out anywhere in the tree
     */
    protected function addDirectory(ZipArchive $zip, string $source, string $prefix, array $skip = []): void
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveCallbackFilterIterator(
                new RecursiveDirectoryIterator($source, FilesystemIterator::SKIP_DOTS),
                fn (SplFileInfo $file) => ! ($file->isDir() && in_array($file->getFilename(), $skip, true)) && ! $file->isLink(),
            ),
        );

        foreach ($iterator as $file) {
            /** @var SplFileInfo $file */
            if ($file->isFile()) {
                $relative = ltrim(str_replace('\\', '/', substr($file->getPathname(), strlen($source))), '/');
                $zip->addFile($file->getPathname(), $prefix.'/'.$relative);
            }
        }
    }
}
