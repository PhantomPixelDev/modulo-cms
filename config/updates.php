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

    'cache_ttl' => (int) env('MODULO_UPDATE_CACHE_TTL', 60 * 60 * 12),

    'timeout' => (int) env('MODULO_UPDATE_TIMEOUT', 5),

    /*
    | Prereleases are published but never offered as an available update, so a
    | site following releases is not nudged onto a release candidate.
    */
    'include_prereleases' => env('MODULO_UPDATE_PRERELEASES', false),

];
