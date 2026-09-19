<?php

return [
    // Seconds to cache sitemap settings (read via config so it survives config:cache)
    'settings_cache_ttl' => (int) env('SITEMAP_SETTINGS_CACHE_TTL', 600),
];
