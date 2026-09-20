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

];
