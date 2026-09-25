<?php

namespace App\Console\Commands;

use App\Services\UpgradePreflight;
use App\Support\ActivityLog;
use App\Support\InstallChannel;
use App\Support\SchemaVersion;
use App\Support\Version;
use Database\Seeders\BootstrapSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

/**
 * Migrates an existing installation to the code that is already on disk.
 *
 * This command does not fetch code. Delivering new code differs per install
 * channel, and on Docker it is impossible from inside the container: the image
 * is immutable and public/ is baked into a separate nginx image at build time. So the sequence here is the part
 * that is the same everywhere -- back up, take the site down, migrate, seed
 * bootstrap data, rebuild caches, bring it back.
 */
class UpgradeCommand extends Command
{
    protected $signature = 'modulo:upgrade
        {--dry-run : Report what would happen and change nothing}
        {--skip-backup : Do not take a database backup first}
        {--force : Continue even when a preflight check objects}';

    protected $description = 'Safely migrate an existing installation after the code has been updated';

    public function handle(UpgradePreflight $preflight): int
    {
        $this->line('Modulo CMS '.Version::current().' ('.InstallChannel::detect().' install)');
        $this->newLine();

        try {
            DB::connection()->select('select 1');
        } catch (Throwable $e) {
            $this->error('Cannot reach the database: '.$e->getMessage());

            return self::FAILURE;
        }

        $pending = $this->pendingMigrations();
        $from = SchemaVersion::recorded();

        if ($pending === []) {
            $this->info('No pending migrations.');
        } else {
            $this->components->twoColumnDetail('<fg=yellow>Pending migrations</>', (string) count($pending));
            foreach ($pending as $migration) {
                $this->line('  - '.$migration);
            }
        }
        $this->newLine();

        $results = $preflight->run($pending);
        $this->renderPreflight($results);

        $blockers = $preflight->blockers($results);

        if ($blockers !== [] && ! $this->option('force')) {
            $this->newLine();
            $this->error('Upgrade stopped. Resolve the problems above, or pass --force to proceed anyway.');

            return self::FAILURE;
        }

        if ($this->option('dry-run')) {
            $this->newLine();
            $this->info('Dry run: nothing was changed.');
            $this->line('Remove --dry-run to apply.');

            return self::SUCCESS;
        }

        $backupPath = null;

        if (! $this->option('skip-backup')) {
            // Reuse the scheduled backup command rather than growing a second
            // implementation that could drift from it.
            $backedUp = false;
            $this->components->task('Backing up the database', function () use (&$backedUp, &$backupPath) {
                $backedUp = Artisan::call('modulo:db-backup') === self::SUCCESS;
                $backupPath = $this->backupPathFrom(Artisan::output());

                return $backedUp;
            });

            // Migrating without a restore point is exactly the situation the
            // backup exists to prevent, so a failed backup stops the upgrade.
            if (! $backedUp) {
                $this->newLine();
                $this->error('Upgrade stopped: the database backup failed, and nothing was changed.');
                $this->line(trim(Artisan::output()));
                $this->line('Fix the backup (see above), or pass --skip-backup if you have taken one yourself.');

                return self::FAILURE;
            }
        } else {
            $this->warn('Skipping the database backup.');
        }

        // Laravel's own maintenance mode, which the queue and scheduler also
        // respect -- unlike the database-backed site setting, which only stops
        // web visitors.
        $this->components->task('Enabling maintenance mode', function () {
            Artisan::call('down', ['--retry' => 60]);

            return true;
        });

        try {
            $this->components->task('Running migrations', function () {
                $this->callOrFail('migrate', ['--force' => true]);

                return true;
            });

            $this->components->task('Applying bootstrap data', function () {
                // Idempotent and non-destructive by construction; see BootstrapSeeder.
                $this->callOrFail('db:seed', ['--class' => BootstrapSeeder::class, '--force' => true]);

                return true;
            });
        } catch (Throwable $e) {
            // The schema may be half-way between versions. Serving traffic from
            // it risks writing data the old *and* the new code misread, so the
            // site stays in maintenance mode until someone has looked.
            $this->newLine();
            $this->error('Upgrade failed: '.$e->getMessage());
            $this->line('The site has been left in maintenance mode so no data is written to a partly migrated database.');
            $this->line($backupPath !== null
                ? "Restore point: {$backupPath}"
                : 'No backup was taken by this run (--skip-backup).');
            $this->line('Fix the problem and run `php artisan modulo:upgrade` again, or restore the backup, then run `php artisan up`.');

            return self::FAILURE;
        }

        SchemaVersion::recordCurrent();
        ActivityLog::record('core.upgraded', 'Upgraded Modulo to '.Version::current(), null, [
            'from' => $from,
            'to' => Version::current(),
            'migrations' => count($pending),
        ]);

        // From here on the schema matches the code, so the site comes back up
        // even if rebuilding the caches goes wrong -- a cold cache is only slow.
        try {
            $this->components->task('Rebuilding caches', function () {
                $this->callOrFail('optimize:clear');
                $this->callOrFail('optimize');

                return true;
            });
        } catch (Throwable $e) {
            $this->warn('Could not rebuild the caches: '.$e->getMessage());
            $this->warn('The site will work, but run `php artisan optimize` once the problem is fixed.');
        }

        $this->components->task('Disabling maintenance mode', function () {
            Artisan::call('up');

            return true;
        });

        $this->newLine();
        $this->info('Upgraded to '.Version::current().'.');

        return self::SUCCESS;
    }

    /**
     * Run an Artisan command and turn a non-zero exit code into an exception,
     * so a failed step can never be mistaken for a finished one.
     *
     * @param  array<string, mixed>  $parameters
     */
    protected function callOrFail(string $command, array $parameters = []): void
    {
        if (Artisan::call($command, $parameters) !== self::SUCCESS) {
            $output = trim(Artisan::output());

            throw new RuntimeException("`{$command}` failed".($output !== '' ? ": {$output}" : '.'));
        }
    }

    /**
     * The backup command reports "Backup written to <path> (<size>)".
     */
    protected function backupPathFrom(string $output): ?string
    {
        return preg_match('/Backup written to (.+?) \(/', $output, $matches) === 1 ? $matches[1] : null;
    }

    /**
     * @return array<int, string>
     */
    protected function pendingMigrations(): array
    {
        Artisan::call('migrate:status');
        $output = Artisan::output();

        $pending = [];

        foreach (explode("\n", $output) as $line) {
            if (! str_contains($line, 'Pending')) {
                continue;
            }

            // Rows look like "  2026_01_01_000000_create_x ....... Pending"
            if (preg_match('/([0-9]{4}_[0-9]{2}_[0-9]{2}_[0-9]+_[A-Za-z0-9_]+)/', $line, $matches)) {
                $pending[] = $matches[1];
            }
        }

        return $pending;
    }

    /**
     * @param  array<int, array{status: string, title: string, detail: string}>  $results
     */
    protected function renderPreflight(array $results): void
    {
        if ($results === []) {
            $this->line('Preflight: nothing to check.');

            return;
        }

        $this->line('Preflight:');

        foreach ($results as $result) {
            [$symbol, $colour] = match ($result['status']) {
                UpgradePreflight::BLOCKER => ['x', 'red'],
                UpgradePreflight::WARNING => ['!', 'yellow'],
                default => ['v', 'green'],
            };

            $this->line("  <fg={$colour}>{$symbol}</> {$result['title']}");
            $this->line("    <fg=gray>{$result['detail']}</>");
        }
    }
}
