<?php

namespace App\Http\Middleware;

use App\Support\SchemaVersion;
use App\Support\Version;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Refuse to serve when a newer Modulo has already migrated this database.
 *
 * That happens after rolling an image or a checkout back without restoring
 * the database. The old code would read tables the new migrations changed; a
 * clear 503 is better than writes neither version understands.
 */
class EnsureSchemaIsCompatible
{
    public function handle(Request $request, Closure $next): Response
    {
        // Health probes still answer, and report the mismatch themselves.
        if ($request->is('health', 'up') || ! SchemaVersion::isAheadOfCode()) {
            return $next($request);
        }

        $recorded = (string) SchemaVersion::recorded();
        $message = sprintf(
            'This database was upgraded by Modulo %s, but this is Modulo %s. Run %s or newer, or restore the backup taken before that upgrade.',
            $recorded,
            Version::current(),
            $recorded,
        );

        if ($request->expectsJson()) {
            return response()->json(['message' => $message], 503);
        }

        return response()->view('errors.schema-ahead', ['message' => $message], 503);
    }
}
