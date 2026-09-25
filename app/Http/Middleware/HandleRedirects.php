<?php

namespace App\Http\Middleware;

use App\Models\Redirect;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Sends visitors of an old URL on to its new one (System -> Redirects, and
 * the redirects created automatically when a published post's slug changes).
 */
class HandleRedirects
{
    /** Never redirected: the admin, the API, auth and system endpoints. */
    protected const SKIP = ['dashboard', 'api', 'login', 'logout', 'register', 'settings', 'install', 'health', 'up', 'build', 'storage'];

    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->isMethod('GET') && ! $request->isMethod('HEAD')) {
            return $next($request);
        }

        $first = explode('/', trim($request->path(), '/'))[0];
        if (in_array($first, self::SKIP, true) || ! schema_has_table('redirects')) {
            return $next($request);
        }

        try {
            $match = Redirect::map()[Redirect::normalizePath($request->getPathInfo())] ?? null;
        } catch (Throwable) {
            return $next($request);
        }

        if ($match === null) {
            return $next($request);
        }

        [$to, $status, $id] = $match;

        // Counting is best-effort and must never slow the redirect down much.
        try {
            DB::table('redirects')->where('id', $id)->update(['hits' => DB::raw('hits + 1'), 'last_hit_at' => now()]);
        } catch (Throwable) {
            // ignore
        }

        $target = str_starts_with($to, 'http') ? $to : url($to);
        if ($request->getQueryString() !== null && ! str_contains($target, '?')) {
            $target .= '?'.$request->getQueryString();
        }

        return redirect()->away($target, $status);
    }
}
