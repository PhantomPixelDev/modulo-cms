<?php

namespace App\Console\Commands;

use App\Services\UpgradePreflight;
use App\Support\InstallChannel;
use App\Support\Version;
use Database\Seeders\BootstrapSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Migrates an existing installation to the code that is already on disk.
 *
 * This command does not fetch code. Delivering new code differs per install
 * channel, and on Docker it is impossible from inside the container: the image
 * is immutable, opcache runs with validate_timestamps off, and public/ is baked
 * into a separate nginx image at build time. So the sequence here is the part
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

        if (! $this->option('skip-backup')) {
            // Reuse the scheduled backup command rather than growing a second
            // implementation that could drift from it.
            $this->components->task('Backing up the database', function () {
                return Artisan::call('modulo:db-backup') === self::SUCCESS;
            });
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

        $failed = null;

        try {
            $this->components->task('Running migrations', function () {
                Artisan::call('migrate', ['--force' => true]);

                return true;
            });

            $this->components->task('Applying bootstrap data', function () {
                // Idempotent and non-destructive by construction; see BootstrapSeeder.
                Artisan::call('db:seed', ['--class' => BootstrapSeeder::class, '--force' => true]);

                return true;
            });

            $this->components->task('Rebuilding caches', function () {
                Artisan::call('optimize:clear');
                Artisan::call('optimize');

                return true;
            });
        } catch (Throwable $e) {
            $failed = $e;
        } finally {
            // Always lift maintenance mode, even on failure: leaving the site
            // dark is worse than leaving it on the old schema.
            $this->components->task('Disabling maintenance mode', function () {
                Artisan::call('up');

                return true;
            });
        }

        if ($failed !== null) {
            $this->newLine();
            $this->error('Upgrade failed: '.$failed->getMessage());
            $this->line('The database backup is in storage/app/backups.');

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Upgraded to '.Version::current().'.');

        return self::SUCCESS;
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
