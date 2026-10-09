<?php

// Run only against the isolated PostgreSQL test database.
use App\Models\User;
use App\Services\InstallService;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Contracts\Console\Kernel;
use Symfony\Component\Process\Process;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('testing') || config('database.default') !== 'pgsql' || config('database.connections.pgsql.database') !== 'modulo_test') {
    throw new RuntimeException('Installer concurrency testing requires the isolated modulo_test PostgreSQL database.');
}

if (($argv[1] ?? '') === 'child') {
    usleep(200000);
    try {
        app(InstallService::class)->createAdministrator('Concurrent operator', 'install-race-'.$argv[2].'@example.test', 'a-sufficiently-long-password');
        echo "created\n";
    } catch (RuntimeException $exception) {
        if ($exception->getMessage() !== 'An administrator already exists.') {
            throw $exception;
        }
        echo "refused\n";
    }
    exit(0);
}

if (User::query()->exists()) {
    throw new RuntimeException('Run this test on an empty test database.');
}
app(RolePermissionSeeder::class)->run();
$children = [];
try {
    foreach ([1, 2] as $number) {
        $process = new Process([PHP_BINARY, __FILE__, 'child', (string) $number], base_path(), timeout: 30);
        $process->start();
        $children[] = $process;
    }
    $results = [];
    foreach ($children as $process) {
        $process->wait();
        if (! $process->isSuccessful()) {
            throw new RuntimeException($process->getErrorOutput());
        }
        $results[] = trim($process->getOutput());
    }
    sort($results);
    $admin = User::query()->first();
    if ($results !== ['created', 'refused'] || User::query()->count() !== 1 || ! $admin?->hasRole('super-admin')) {
        throw new RuntimeException('Concurrent setup created an incorrect administrator state.');
    }
    echo "Installer concurrency passed: one administrator created, one request refused.\n";
} finally {
    foreach ($children as $process) {
        if ($process->isRunning()) {
            $process->stop();
        }
    }
    User::whereIn('email', ['install-race-1@example.test', 'install-race-2@example.test'])->get()->each->delete();
}
