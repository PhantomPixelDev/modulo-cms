<?php

return [

    // Days a deleted post or page stays in the trash before it is purged. 0 keeps it until emptied by hand.
    'trash_days' => (int) env('MODULO_TRASH_DAYS', 30),

    // Revisions kept per post or page; older ones are removed as new ones are saved.
    'revisions_keep' => (int) env('MODULO_REVISIONS_KEEP', 25),

    // Whole-page cache for visitors (App\Http\Middleware\CachePublicPages). Any content
    // change clears it at once; ttl only bounds how long an untouched page is kept.
    'page_cache' => [
        'enabled' => (bool) env('MODULO_PAGE_CACHE', true),
        'ttl' => (int) env('MODULO_PAGE_CACHE_TTL', 3600),
    ],

];
