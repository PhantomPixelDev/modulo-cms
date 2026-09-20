<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Plugin Directory
    |--------------------------------------------------------------------------
    |
    | Where plugins live. Configurable mainly so tests can work against a
    | temporary directory instead of the real one.
    |
    */

    'path' => env('MODULO_PLUGIN_PATH', base_path('plugins')),

    /*
    |--------------------------------------------------------------------------
    | Uninstall Records
    |--------------------------------------------------------------------------
    |
    | Uninstalling records the intent here rather than inside the plugin's own
    | directory. A marker written into the package is destroyed or resurrected
    | unpredictably when that directory is replaced during an update.
    |
    */

    'uninstall_path' => storage_path('app/plugins/uninstalled'),

    /*
    |--------------------------------------------------------------------------
    | Registry
    |--------------------------------------------------------------------------
    |
    | A JSON index listing installable plugins and, per version, the release
    | asset to download and its SHA-256. That checksum, fetched over HTTPS from
    | the registry, is the trust root: it is honest to call an install
    | "checksum-verified" and dishonest to call it "signed" until packages
    | carry signatures of their own.
    |
    */

    'registry_url' => env('MODULO_PLUGIN_REGISTRY', 'https://raw.githubusercontent.com/PhantomPixelDev/modulo-registry/main/registry.json'),

    'registry_cache_ttl' => (int) env('MODULO_PLUGIN_REGISTRY_TTL', 60 * 60 * 12),

    'timeout' => (int) env('MODULO_PLUGIN_TIMEOUT', 60),

    /*
    | Installing from an arbitrary URL is off by default. It bypasses the
    | registry, and with it the checksum that makes an install verifiable.
    */
    'allow_url_install' => env('MODULO_PLUGIN_ALLOW_URL_INSTALL', false),

    /*
    | Hosts a package may be downloaded from. A registry entry pointing
    | anywhere else is refused, so a compromised index cannot redirect an
    | install to an arbitrary server.
    */
    'allowed_hosts' => [
        'github.com',
        'codeload.github.com',
        'objects.githubusercontent.com',
        'raw.githubusercontent.com',
    ],

    'staging_path' => storage_path('app/plugins/staging'),

    'backup_path' => storage_path('app/plugins/backups'),

];
