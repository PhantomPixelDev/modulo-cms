<?php

// Run against a dedicated PostgreSQL test database after migrating it:
// APP_ENV=testing DB_CONNECTION=pgsql DB_DATABASE=modulo_test php tests/Integration/two-factor-concurrency.php

use App\Models\User;
use App\Support\Totp;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

// This is a standalone check, outside Artisan's command exit-code handling.
set_exception_handler(function (Throwable $error): void {
    fwrite(STDERR, $error->getMessage()."\n");
    exit(1);
});

if (! $app->environment('testing') || config('database.default') !== 'pgsql'
    || config('database.connections.pgsql.database') !== 'modulo_test') {
    throw new RuntimeException('This check requires APP_ENV=testing and the dedicated PostgreSQL modulo_test database.');
}

if (($argv[1] ?? null) === 'worker') {
    $user = User::findOrFail((int) $argv[2]);
    echo "ready\n";
    fgets(STDIN);
    $code = trim((string) fgets(STDIN));
    $accepted = $argv[3] === 'totp' ? $user->verifyTwoFactorCode($code) : $user->useRecoveryCode($code);
    echo json_encode($accepted)."\n";
    exit(0);
}

$user = User::create([
    'name' => 'Concurrency check', 'email' => Str::uuid().'@example.test', 'password' => Str::random(40),
]);

try {
    foreach (range(1, 5) as $round) {
        foreach (['totp', 'recovery', 'different-recovery'] as $mode) {
            $user->refresh()->forceFill([
                'two_factor_secret' => Totp::generateSecret(), 'two_factor_confirmed_at' => now(), 'two_factor_last_step' => null,
            ])->save();
            $codes = $user->regenerateRecoveryCodes();
            $inputs = $mode === 'totp'
                ? array_fill(0, 2, Totp::at($user->two_factor_secret, Totp::currentStep()))
                : [$codes[0], $mode === 'different-recovery' ? $codes[1] : $codes[0]];
            $workers = [];

            try {
                foreach ($inputs as $code) {
                    $process = proc_open([PHP_BINARY, __FILE__, 'worker', (string) $user->id, $mode], [
                        0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w'],
                    ], $pipes);
                    if (! is_resource($process)) {
                        throw new RuntimeException('Could not start a challenge worker.');
                    }
                    stream_set_timeout($pipes[1], 15);
                    $workers[] = ['process' => $process, 'pipes' => $pipes, 'code' => $code];
                }

                // Both workers load the original user before either may verify.
                foreach ($workers as $worker) {
                    if (trim((string) fgets($worker['pipes'][1])) !== 'ready') {
                        throw new RuntimeException('Challenge worker did not become ready.');
                    }
                }
                foreach ($workers as $worker) {
                    fwrite($worker['pipes'][0], "go\n".$worker['code']."\n");
                    fclose($worker['pipes'][0]);
                }

                $results = [];
                foreach ($workers as $worker) {
                    $result = trim((string) fgets($worker['pipes'][1]));
                    if (! in_array($result, ['true', 'false'], true)) {
                        throw new RuntimeException('Challenge worker failed: '.stream_get_contents($worker['pipes'][2]));
                    }
                    $results[] = $result === 'true';
                }
                sort($results);
                $expected = $mode === 'different-recovery' ? [true, true] : [false, true];
                if ($results !== $expected) {
                    throw new RuntimeException($mode.' accepted the wrong number of simultaneous requests: '.json_encode($results));
                }
                if ($mode !== 'totp' && count($user->fresh()->two_factor_recovery_codes) !== ($mode === 'different-recovery' ? 6 : 7)) {
                    throw new RuntimeException('Concurrent recovery challenges lost a consumption update.');
                }
            } finally {
                foreach ($workers as $worker) {
                    foreach ($worker['pipes'] as $pipe) {
                        if (is_resource($pipe)) {
                            fclose($pipe);
                        }
                    }
                    proc_terminate($worker['process']);
                    proc_close($worker['process']);
                }
            }
        }
    }

    echo "Passed 15 simultaneous challenge pairs on PostgreSQL.\n";
} finally {
    DB::disconnect();
    $user->delete();
}
