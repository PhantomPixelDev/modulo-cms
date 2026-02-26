<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Throwable;

class ReadinessController extends Controller
{
    /**
     * Dependency readiness probe for container orchestration.
     */
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->isDatabaseReady(),
            'redis' => $this->isRedisReady(),
        ];

        $ready = collect($checks)->every(fn (bool $ok) => $ok);

        return response()->json([
            'status' => $ready ? 'ready' : 'degraded',
            'checks' => $checks,
        ], $ready ? 200 : 503);
    }

    protected function isDatabaseReady(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (Throwable) {
            return false;
        }
    }

    protected function isRedisReady(): bool
    {
        try {
            Redis::connection()->ping();
            return true;
        } catch (Throwable) {
            return false;
        }
    }
}
