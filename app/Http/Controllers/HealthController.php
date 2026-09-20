<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Readiness probe for the container stack: reports 503 when a dependency the
 * app cannot serve without is down, so orchestrators stop routing to it.
 */
class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->check(fn () => DB::connection()->select('select 1') !== []),
            'cache' => $this->check(function () {
                Cache::put('health:ping', 1, 10);

                return Cache::get('health:ping') === 1;
            }),
        ];

        $healthy = ! in_array(false, $checks, true);

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => $checks,
        ], $healthy ? 200 : 503);
    }

    protected function check(callable $probe): bool
    {
        try {
            return (bool) $probe();
        } catch (\Throwable $e) {
            return false;
        }
    }
}
