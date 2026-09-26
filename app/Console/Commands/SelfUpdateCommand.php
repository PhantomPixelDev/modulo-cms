<?php

namespace App\Console\Commands;

use App\Services\SelfUpdater;
use App\Services\UpdateChecker;
use App\Support\Version;
use Illuminate\Console\Command;
use Throwable;

class SelfUpdateCommand extends Command
{
    protected $signature = 'modulo:update
        {version? : Release to install (default: the latest)}
        {--rollback : Put back the code the last update replaced}
        {--force : Do not ask for confirmation}';

    protected $description = 'Update a release-tarball install to a newer release, in place';

    public function handle(SelfUpdater $updater, UpdateChecker $checker): int
    {
        $updater->onLog(fn (string $line) => $line !== '' ? $this->line('  '.$line) : null);

        try {
            $updater->assertSupported();
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        if ($this->option('rollback')) {
            return $this->rollback($updater);
        }

        $current = Version::current();
        $target = $this->argument('version');

        if ($target === null) {
            $check = $checker->check(force: true);

            if ($check['error'] !== null) {
                $this->error('Could not find the latest release: '.$check['error']);

                return self::FAILURE;
            }

            if (! $check['available']) {
                $this->info("Already on the latest release ({$current}).");

                return self::SUCCESS;
            }

            $target = (string) $check['latest'];
        }

        $target = Version::normalize((string) $target);

        if (! Version::isDev() && version_compare($target, Version::normalize($current), '<=')) {
            $this->error("{$target} is not newer than the running {$current}. Downgrades are not supported; restore a backup instead.");

            return self::FAILURE;
        }

        try {
            $release = $updater->resolve($target);
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $unmet = $checker->unmetRequirements(is_array($release['manifest']['requirements'] ?? null) ? $release['manifest']['requirements'] : []);
        if ($unmet !== []) {
            $this->error("{$target} needs ".implode(' and ', $unmet).'.');

            return self::FAILURE;
        }

        if ($release['manifest']['breaking'] ?? false) {
            $this->warn("{$target} contains breaking changes. Read the release notes first.");
        }

        if (! $this->option('force') && ! $this->confirm("Update {$current} -> {$target}? The site is in maintenance mode while it runs.", true)) {
            return self::FAILURE;
        }

        try {
            $this->info('Fetching and verifying the release...');
            $package = $updater->stage($release);
        } catch (Throwable $e) {
            $this->error($e->getMessage());
            $this->line('Nothing was changed.');

            return self::FAILURE;
        }

        $updater->artisan(['down', '--retry=60']);

        try {
            $this->info('Swapping in the new code...');
            $updater->swap($package, $current);
        } catch (Throwable $e) {
            $this->error($e->getMessage());
            $updater->artisan(['up']);

            return self::FAILURE;
        }

        // From here on it is the new release's code that runs.
        $this->info('Upgrading (backup, preflight, migrations)...');
        if (! $updater->artisan(['modulo:upgrade', '--no-interaction'])) {
            $this->error('The upgrade did not complete; the site stays in maintenance mode.');
            $this->line('Inspect the output above. To go back: php artisan modulo:update --rollback, then restore the backup the upgrade took if migrations ran.');

            return self::FAILURE;
        }

        $updater->artisan(['optimize:clear']);
        $updater->artisan(['up']);

        $this->info("Updated to {$target}. The previous code is kept for: php artisan modulo:update --rollback");

        return self::SUCCESS;
    }

    protected function rollback(SelfUpdater $updater): int
    {
        if (! $this->option('force') && ! $this->confirm('Put back the code the last update replaced? The database is not touched.', true)) {
            return self::FAILURE;
        }

        $updater->artisan(['down', '--retry=60']);

        try {
            $version = $updater->rollback();
        } catch (Throwable $e) {
            $this->error($e->getMessage());
            $updater->artisan(['up']);

            return self::FAILURE;
        }

        $updater->artisan(['optimize:clear']);

        $this->info("Code rolled back to {$version}. The site stays in maintenance mode:");
        $this->line('  if the update migrated the database, restore the backup it took first (storage/app/backups),');
        $this->line('  then bring the site back with: php artisan up');

        return self::SUCCESS;
    }
}
