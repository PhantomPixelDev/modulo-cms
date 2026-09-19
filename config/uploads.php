<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Media upload limits
    |--------------------------------------------------------------------------
    |
    | Defaults for the admin media library. Site settings (max_upload_size,
    | allowed_mime_types, allow_svg_uploads) override these at runtime.
    |
    */

    'max_mb' => (int) env('MAX_UPLOAD_MB', 20),

    // Comma-separated MIME list; null uses the built-in default list.
    'allowed_mimes' => env('ALLOWED_UPLOAD_MIMES'),

    'max_image_width' => (int) env('MAX_IMAGE_WIDTH', 10000),
    'max_image_height' => (int) env('MAX_IMAGE_HEIGHT', 10000),
    'max_image_megapixels' => (int) env('MAX_IMAGE_MEGAPIXELS', 60),

    // Never accepted, whatever the MIME type claims (executable or active content).
    'blocked_extensions' => [
        'php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar', 'pht', 'phps',
        'cgi', 'pl', 'py', 'sh', 'asp', 'aspx', 'jsp', 'exe', 'bat', 'cmd', 'com',
        'html', 'htm', 'xhtml', 'shtml', 'js', 'mjs', 'htaccess', 'svgz',
    ],
];
