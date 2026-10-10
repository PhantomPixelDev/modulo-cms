<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class RuntimeHealth
{
    /** @return array{database: bool, cache: bool} */
    public function readiness(): array
    {
        return [
            'database' => $this->probe(fn () => DB::connection()->select('select 1') !== []),
            'cache' => $this->probe(function () {
                $key = 'health:probe:'.Str::uuid();
                $token = Str::random(12);
                try {
                    Cache::put($key, $token, 10);

                    return Cache::get($key) === $token;
                } finally {
                    Cache::forget($key);
                }
            }),
        ];
    }

    public function heartbeat(string $service): void
    {
        try {
            Cache::put('health:heartbeat:'.$service, now()->timestamp, 86400);
        } catch (Throwable $e) {
            report($e);
        }
    }

    public function backgroundStatus(string $service): string
    {
        if ($service === 'queue' && config('queue.default') === 'sync') {
            return 'inline';
        }
        try {
            $seen = Cache::get('health:heartbeat:'.$service);

            return ! is_numeric($seen) ? 'missing' : (now()->timestamp - (int) $seen > 180 ? 'stale' : 'active');
        } catch (Throwable) {
            return 'unavailable';
        }
    }

    public function startedAt(): ?int
    {
        $path = '/tmp/modulo-app-started-at';
        $stamp = is_file($path) ? trim((string) file_get_contents($path)) : '';

        return ctype_digit($stamp) && (int) $stamp <= time() ? (int) $stamp : null;
    }

    private function probe(callable $callback): bool
    {
        try {
            return (bool) $callback();
        } catch (Throwable) {
            return false;
        }
    }
}
