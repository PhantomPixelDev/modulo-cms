<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Reserved Route Slugs
    |--------------------------------------------------------------------------
    |
    | These slugs are reserved for system routes and cannot be used for
    | pages or custom post types. Add any new reserved paths here.
    |
    */
    'reserved_slugs' => [
        'dashboard',
        'login',
        'register',
        'password',
        'confirm-password',
        'forgot-password',
        'reset-password',
        'verify-email',
        'email',
        'logout',
        'settings',
        'admin',
        'posts',
        'pages',
        'infos',
        'up',
        'api',
        'sitemap.xml',
        'health',
        'shop',
        'feed',
        'search',
    ],

    /*
    |--------------------------------------------------------------------------
    | Reserved Post Type Route Prefixes
    |--------------------------------------------------------------------------
    |
    | Subset of reserved slugs that apply specifically to post type routes.
    | These are checked when matching /{postTypeSlug}/{slug} patterns.
    |
    */
    'reserved_post_type_prefixes' => [
        'dashboard',
        'login',
        'register',
        'password',
        'forgot-password',
        'reset-password',
        'verify-email',
        'email',
        'logout',
        'settings',
        'admin',
        'up',
        'api',
        'sitemap.xml',
        'health',
        'shop',
    ],
];
