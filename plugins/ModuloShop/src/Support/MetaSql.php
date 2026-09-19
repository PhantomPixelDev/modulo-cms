<?php

namespace Plugins\ModuloShop\src\Support;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Driver-portable SQL for values stored in posts.meta_data (JSON).
 * JSON_EXTRACT(...) AS DECIMAL only works on MySQL; this also covers PostgreSQL and SQLite.
 */
class MetaSql
{
    public static function number(string $key): string
    {
        self::assertKey($key);

        return match (DB::connection()->getDriverName()) {
            'pgsql' => "CAST(NULLIF(meta_data->>'{$key}', '') AS DECIMAL(12,2))",
            'sqlite' => "CAST(json_extract(meta_data, '$.{$key}') AS REAL)",
            default => "CAST(JSON_UNQUOTE(JSON_EXTRACT(meta_data, '$.{$key}')) AS DECIMAL(12,2))",
        };
    }

    /**
     * Keys are interpolated into SQL, so only plain identifiers are allowed.
     */
    protected static function assertKey(string $key): void
    {
        if (! preg_match('/^[a-z_]+$/', $key)) {
            throw new InvalidArgumentException("Invalid meta key [{$key}].");
        }
    }
}
