<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\InstallService;
use App\Support\Version;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Throwable;

/**
 * Headless equivalent of the web installer.
 *
 * Drives the same InstallService, so the two cannot diverge. Useful for
 * scripted deployments and for anyone who would rather not expose an
 * unauthenticated setup page at all.
 */
class InstallCommand extends Command
{
    protected $signature = 'modulo:install
        {--admin-name= : Name for the administrator account}
        {--admin-email= : Email for the administrator account}
        {--admin-password= : Password for the administrator account}
        {--site-name= : Name of the site}
        {--timezone=UTC : Site timezone}
        {--demo : Also seed demo users and example content}
        {--force : Continue even if the site is already installed}';

    protected $description = 'Set up Modulo CMS: migrate, seed bootstrap data and create the first administrator';

    public function handle(InstallService $installer): int
    {
        $this->line('Modulo CMS '.Version::current());

        if ($installer->isInstalled() && ! $this->option('force')) {
            $this->error('This site is already installed. Pass --force to run anyway.');

            return self::FAILURE;
        }

        if (! $this->checkRequirements($installer)) {
            return self::FAILURE;
        }

        $database = $installer->checkDatabase();
        if (! $database['connected']) {
            $this->error('Cannot reach the database: '.$database['message']);

            return self::FAILURE;
        }
        $this->info($database['message']);

        $this->components->task('Running migrations', function () use ($installer) {
            $installer->runMigrations();

            return true;
        });

        $this->components->task('Seeding bootstrap data', function () use ($installer) {
            $installer->seedBootstrap();

            return true;
        });

        if (! $this->createAdministrator($installer)) {
            return self::FAILURE;
        }

        $siteName = $this->option('site-name')
            ?: ($this->input->isInteractive() ? $this->ask('Site name', 'My Modulo Site') : 'My Modulo Site');

        $installer->applySiteSettings([
            'site_name' => $siteName,
            'timezone' => (string) $this->option('timezone'),
        ]);

        if ($this->option('demo')) {
            $this->components->task('Seeding demo content', function () use ($installer) {
                $installer->seedDemoContent();

                return true;
            });
        }

        $installer->finish();

        $this->newLine();
        $this->info('Modulo CMS is installed. The web installer is now closed.');

        return self::SUCCESS;
    }

    protected function checkRequirements(InstallService $installer): bool
    {
        $failed = array_filter($installer->requirements(), fn (array $c) => ! $c['passed']);

        if ($failed === []) {
            return true;
        }

        $this->error('The environment is not ready:');
        foreach ($failed as $check) {
            $this->line('  - '.$check['name'].' ('.$check['detail'].')');
        }

        return false;
    }

    protected function createAdministrator(InstallService $installer): bool
    {
        if (User::query()->exists()) {
            $this->warn('A user already exists; skipping administrator creation.');

            return true;
        }

        $name = $this->option('admin-name');
        $email = $this->option('admin-email');
        $password = $this->option('admin-password');

        if (! $this->input->isInteractive() && (! $name || ! $email || ! $password)) {
            $this->error('Non-interactive mode needs --admin-name, --admin-email and --admin-password.');

            return false;
        }

        $name = $name ?: $this->ask('Administrator name');
        $email = $email ?: $this->ask('Administrator email');
        // secret() so the password never reaches the terminal or shell history.
        $password = $password ?: $this->secret('Administrator password');

        $validator = Validator::make(
            ['name' => $name, 'email' => $email, 'password' => $password],
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'max:255'],
                'password' => ['required', Password::defaults()],
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return false;
        }

        try {
            $installer->createAdministrator($name, $email, $password);
        } catch (Throwable $e) {
            $this->error('Could not create the administrator: '.$e->getMessage());

            return false;
        }

        $this->info("Administrator created: {$email}");

        return true;
    }
}
