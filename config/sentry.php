<?php

return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),

    'release' => env('SENTRY_RELEASE'),

    // In production, consider setting to 0.1–0.5 for cost control
    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.0),

    // Enable performance profiling (pairs with traces)
    'profiles_sample_rate' => (float) env('SENTRY_PROFILES_SAMPLE_RATE', 0.0),

    'send_default_pii' => (bool) env('SENTRY_SEND_DEFAULT_PII', false),

    'breadcrumbs' => [
        'sql_queries' => (bool) env('SENTRY_BREADCRUMBS_SQL', false),
    ],

    'environment' => env('APP_ENV', 'production'),
];
