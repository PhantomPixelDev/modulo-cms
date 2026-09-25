<?php

namespace App\Services;

use App\Models\User;
use App\Support\InstallChannel;
use App\Support\SchemaVersion;
use Database\Seeders\BootstrapSeeder;
use Database\Seeders\DemoContentSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Spatie\Permission\Models\Role;
use Throwable;

/**
 * First-run setup, shared by the web wizard and `modulo:install`.
 *
 * All of the logic lives here so the two entry points cannot drift: the
 * controller and the command are both thin wrappers.
 */
class InstallService
{
    /**
     * Written once setup completes. Checked before the database, so the
     * wizard stays closed even if the database is later unreachable.
     */
    public const LOCK_FILE = 'installed';

    /**
     * Written when the wizard starts, removed when it finishes.
     *
     * Without it, creating the administrator in step four would make the
     * "a user exists, so this site is installed" heuristic true and 404 the
     * remaining steps -- the wizard would break at the moment it succeeded.
     */
    public const PROGRESS_FILE = 'installing';

    public function isInstalled(): bool
    {
        if (File::exists($this->lockPath())) {
            return true;
        }

        // A wizard run in progress owns the answer: the user it is about to
        // create must not be mistaken for a pre-existing site.
        if (File::exists($this->progressPath())) {
            return false;
        }

        // An existing site that pre-dates the installer has users but no lock
        // file. Treat it as installed and write the lock so this costs one
        // query, once.
        if (! schema_has_table('users')) {
            return false;
        }

        try {
            if (! User::query()->exists()) {
                return false;
            }
        } catch (Throwable) {
            return false;
        }

        $this->writeLock();

        return true;
    }

    /**
     * Whether the environment can run the application at all.
     *
     * @return array<int, array{name: string, passed: bool, detail: string}>
     */
    public function requirements(): array
    {
        $checks = [];

        $phpOk = version_compare(PHP_VERSION, '8.4.0', '>=');
        $checks[] = [
            'name' => 'PHP 8.4 or newer',
            'passed' => $phpOk,
            'detail' => PHP_VERSION,
        ];

        // Taken from docker/Dockerfile, which is the authoritative list.
        foreach (['pdo_pgsql', 'gd', 'exif', 'bcmath', 'zip', 'intl', 'mbstring', 'openssl'] as $ext) {
            $checks[] = [
                'name' => "Extension: {$ext}",
                'passed' => extension_loaded($ext),
                'detail' => extension_loaded($ext) ? 'loaded' : 'missing',
            ];
        }

        foreach (['storage' => storage_path(), 'bootstrap/cache' => base_path('bootstrap/cache')] as $label => $path) {
            $writable = is_writable($path);
            $checks[] = [
                'name' => "Writable: {$label}",
                'passed' => $writable,
                'detail' => $writable ? 'writable' : 'not writable',
            ];
        }

        $checks[] = [
            'name' => 'Application key set',
            'passed' => (string) config('app.key') !== '',
            'detail' => (string) config('app.key') !== '' ? 'set' : 'missing',
        ];

        return $checks;
    }

    public function requirementsSatisfied(): bool
    {
        foreach ($this->requirements() as $check) {
            if (! $check['passed']) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array{connected: bool, message: string}
     */
    public function checkDatabase(): array
    {
        try {
            DB::connection()->select('select 1');

            return ['connected' => true, 'message' => 'Connected to '.DB::connection()->getDatabaseName()];
        } catch (Throwable $e) {
            return ['connected' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Whether the wizard should offer to edit database settings.
     *
     * On Docker there is no .env to write: the image deletes it at build time
     * and configuration arrives from the compose env_file. Offering the form
     * there would produce changes that vanish on the next container restart.
     */
    public function canConfigureDatabase(): bool
    {
        return ! InstallChannel::isDocker() && File::exists(base_path('.env'));
    }

    public function runMigrations(): void
    {
        Artisan::call('migrate', ['--force' => true]);
    }

    public function seedBootstrap(): void
    {
        Artisan::call('db:seed', ['--class' => BootstrapSeeder::class, '--force' => true]);
    }

    public function seedDemoContent(): void
    {
        Artisan::call('db:seed', ['--class' => DemoContentSeeder::class, '--force' => true]);
    }

    /**
     * Create the first administrator.
     *
     * Only ever called while no users exist; the caller enforces that.
     */
    public function createAdministrator(string $name, string $email, string $password): User
    {
        // Without the role this produces an account that cannot reach the
        // admin area -- the locked room the installer exists to prevent. Fail
        // loudly rather than leaving a useless user behind.
        if (! Role::where('name', 'super-admin')->where('guard_name', 'web')->exists()) {
            throw new RuntimeException('The super-admin role does not exist. Run the database step first.');
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'is_admin' => true,
        ]);

        // Not mass-assignable, so create() silently dropped it and the new
        // administrator landed on "verify your email" -- on a site whose mail
        // may not be configured yet.
        $user->forceFill(['email_verified_at' => now()])->save();

        $user->assignRole('super-admin');

        return $user;
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    public function applySiteSettings(array $settings): void
    {
        $service = app(SiteSettingsService::class);

        foreach ($settings as $key => $value) {
            if ($value !== null && $value !== '') {
                $service->set($key, $value);
            }
        }

        $service->clearCache();
    }

    /**
     * Mark a wizard run as under way. Idempotent.
     */
    public function beginInstall(): void
    {
        if (! File::exists($this->lockPath())) {
            try {
                File::put($this->progressPath(), (string) now()->toIso8601String());
            } catch (Throwable) {
                // Non-fatal: the wizard still works, it just cannot suspend the
                // users-exist heuristic, which only matters mid-run.
            }
        }
    }

    public function finish(): void
    {
        File::delete($this->progressPath());
        $this->writeLock();
        SchemaVersion::recordCurrent();

        // Drop caches built while the site was half-configured.
        Artisan::call('optimize:clear');
    }

    /**
     * The lock for the database currently configured.
     *
     * Qualified by database because storage is shared across every database
     * the application might be pointed at. A single global lock meant that
     * switching to a fresh database -- a new environment, a restored backup
     * elsewhere, a second site on the same storage -- left the wizard locked
     * out of a database that had never been set up.
     */
    public function lockPath(): string
    {
        return storage_path(self::LOCK_FILE.'-'.$this->databaseKey());
    }

    public function progressPath(): string
    {
        return storage_path(self::PROGRESS_FILE.'-'.$this->databaseKey());
    }

    /**
     * A short, stable identifier for the configured database.
     *
     * Read from configuration rather than the live connection, so it is
     * available -- and identical -- whether or not the database is reachable.
     */
    protected function databaseKey(): string
    {
        $connection = (string) config('database.default');
        $database = (string) config('database.connections.'.$connection.'.database');
        $host = (string) config('database.connections.'.$connection.'.host');

        return substr(sha1($connection.'|'.$host.'|'.$database), 0, 12);
    }

    protected function writeLock(): void
    {
        try {
            File::put($this->lockPath(), (string) now()->toIso8601String());
        } catch (Throwable) {
            // A read-only storage path should not break an otherwise finished
            // install; isInstalled() still resolves through the users table.
        }
    }
}
