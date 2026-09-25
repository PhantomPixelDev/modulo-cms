<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Response security headers
    |--------------------------------------------------------------------------
    |
    | Sent by the application itself, so a bare-metal or tarball install gets
    | them without web server configuration (the Docker nginx sets a few too;
    | duplicates are harmless).
    |
    */

    'headers' => env('MODULO_SECURITY_HEADERS', true),

    // Strict-Transport-Security, sent on HTTPS responses only. 0 disables.
    'hsts_max_age' => (int) env('MODULO_HSTS_MAX_AGE', 60 * 60 * 24 * 180),

    /*
    | Content-Security-Policy: "off", "report" (Content-Security-Policy-Report-Only:
    | violations only show in the browser console) or "enforce". Scripts must be
    | same-origin or carry the per-request nonce; the core's inline scripts do.
    | Start with "report", check the console on your site with your plugins and
    | analytics, then switch to "enforce".
    */
    'csp' => env('MODULO_CSP', 'report'),

    // Extra sources per directive, space separated, e.g.
    // MODULO_CSP_SCRIPT_SRC="https://cdn.example.com"
    'csp_extra' => [
        'script-src' => env('MODULO_CSP_SCRIPT_SRC', ''),
        'style-src' => env('MODULO_CSP_STYLE_SRC', ''),
        'img-src' => env('MODULO_CSP_IMG_SRC', ''),
        'connect-src' => env('MODULO_CSP_CONNECT_SRC', ''),
        'frame-src' => env('MODULO_CSP_FRAME_SRC', ''),
        'font-src' => env('MODULO_CSP_FONT_SRC', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Passwords
    |--------------------------------------------------------------------------
    |
    | Applied to registration, password changes and resets, and the installer,
    | in production. "uncompromised" checks the password against the Have I
    | Been Pwned range API (only a 5-character hash prefix leaves the server).
    |
    */

    'password_min_length' => (int) env('MODULO_PASSWORD_MIN_LENGTH', 12),

    'password_uncompromised' => env('MODULO_PASSWORD_UNCOMPROMISED', true),

    /*
    |--------------------------------------------------------------------------
    | Two-factor authentication
    |--------------------------------------------------------------------------
    |
    | With this on, users with the admin or super-admin role must set up
    | two-factor authentication before they can use the admin area.
    |
    */

    'require_two_factor_for_admins' => env('MODULO_REQUIRE_2FA_FOR_ADMINS', false),

    /*
    |--------------------------------------------------------------------------
    | Activity log
    |--------------------------------------------------------------------------
    */

    // Days to keep activity log entries; older ones are pruned daily. 0 keeps all.
    'activity_retention_days' => (int) env('MODULO_ACTIVITY_RETENTION_DAYS', 180),

];
