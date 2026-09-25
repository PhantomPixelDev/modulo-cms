<?php

namespace App\Http\Controllers;

use App\Support\InstallChannel;
use App\Support\SchemaVersion;
use App\Support\Version;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
                // A string round-trips identically on every store; the Redis
                // store hands numbers back as numeric strings.
                $token = Str::random(12);
                Cache::put('health:ping', $token, 10);

                return Cache::get('health:ping') === $token;
            }),
            'schema' => ! SchemaVersion::isAheadOfCode(),
        ];

        $healthy = ! in_array(false, $checks, true);

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            // So a deploy can be diffed against what was expected without
            // shelling into the container.
            'version' => Version::current(),
            'channel' => InstallChannel::detect(),
            // The version the database was last upgraded by; ahead of `version`
            // means an image or checkout was rolled back without the database.
            'schema_version' => SchemaVersion::recorded(),
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
