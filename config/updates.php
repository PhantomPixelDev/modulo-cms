<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Update Checks
    |--------------------------------------------------------------------------
    |
    | Where to look for newer releases, and how long to cache the answer. The
    | check is a single unauthenticated request to the GitHub releases API,
    | which is rate limited by IP, so the cache is not optional.
    |
    */

    'enabled' => env('MODULO_UPDATE_CHECK', true),

    'repository' => env('MODULO_UPDATE_REPOSITORY', 'PhantomPixelDev/modulo-cms'),

    'endpoint' => env('MODULO_UPDATE_ENDPOINT', 'https://api.github.com/repos/:repository/releases/latest'),

    // Used when following prereleases: /releases/latest never returns one.
    'list_endpoint' => env('MODULO_UPDATE_LIST_ENDPOINT', 'https://api.github.com/repos/:repository/releases?per_page=10'),

    'cache_ttl' => (int) env('MODULO_UPDATE_CACHE_TTL', 60 * 60 * 12),

    // A failed check is retried much sooner than a successful one is refreshed.
    'error_cache_ttl' => (int) env('MODULO_UPDATE_ERROR_CACHE_TTL', 60 * 10),

    'timeout' => (int) env('MODULO_UPDATE_TIMEOUT', 5),

    /*
    | Prereleases are published but, by default, never offered as an available
    | update, so a site following releases is not nudged onto a release
    | candidate. Set MODULO_UPDATE_PRERELEASES=true to follow them.
    */
    'include_prereleases' => env('MODULO_UPDATE_PRERELEASES', false),

    /*
    | The daily `modulo:check-updates` emails administrators (users with the
    | admin or super-admin role) once for every new set of available updates.
    */
    'notify' => env('MODULO_UPDATE_NOTIFY', true),

];
