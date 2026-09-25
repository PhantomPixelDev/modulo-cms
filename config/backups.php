<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Full-site Backups
    |--------------------------------------------------------------------------
    |
    | `modulo:backup` writes one zip holding the database, uploaded media and
    | installed plugins (and, with --with-env, the .env file). `modulo:restore`
    | puts them back. Nightly database-only dumps (`modulo:db-backup`) are
    | separate and keep their own retention.
    |
    */

    'path' => env('MODULO_BACKUP_PATH', storage_path('app/backups')),

    // How many full backups to keep; older ones are deleted after each run.
    'keep' => (int) env('MODULO_BACKUP_KEEP', 5),

    // Weekly full backup from the scheduler. Set to false to only back up on demand.
    'schedule' => env('MODULO_BACKUP_SCHEDULE', true),

];
