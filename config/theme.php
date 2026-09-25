<?php

return [
    'debug' => env('THEME_DEBUG', false),
    'cache_ttl' => (int) env('THEME_CACHE_TTL', 3600),

    /*
    | Themes installed at runtime (from the registry) live here rather than in
    | resources/themes, which is part of the image and replaced on update. The
    | storage volume survives. Bundled themes stay in resources/themes.
    */
    'install_path' => env('MODULO_THEME_INSTALL_PATH', storage_path('app/themes')),

    // Where downloads are unpacked and checked before being moved into place.
    'staging_path' => storage_path('app/themes-staging'),

    /*
    | Files a registry theme may contain. Runtime themes are child themes:
    | configuration, styles, images, fonts and translations. Code (PHP, or
    | React components that would need a build) is refused.
    */
    'allowed_extensions' => [
        'json', 'css', 'map', 'md', 'txt',
        'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'ico',
        'woff', 'woff2', 'ttf', 'otf', 'eot',
    ],
];
