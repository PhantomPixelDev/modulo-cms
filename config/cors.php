<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing
    |--------------------------------------------------------------------------
    |
    | The headless API (/api/v1) may be consumed by browser frontends on other
    | origins. These settings control which origins may read it. They only
    | take effect for the paths below; same-origin Inertia requests are
    | unaffected. Keep allowed origins tight in production.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'HEAD'],

    'allowed_origins' => array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'X-Requested-With'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
