<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * The Modulo version the database schema was last installed or upgraded by.
 *
 * Migrations only run forwards. Running an older build against a schema a
 * newer one has already migrated (a rolled-back image, a stale checkout) means
 * code reading columns and tables that no longer mean what it expects, so the
 * app refuses to serve in that state instead of quietly corrupting data.
 */
class SchemaVersion
{
    public const KEY = 'schema_version';

    protected const CACHE_KEY = 'modulo:schema-version';

    /**
     * The recorded version, or null when none has been recorded yet (a fresh
     * database, or one from before this was tracked).
     */
    public static function recorded(): ?string
    {
        // One small query at most once a minute; the guard runs on every request.
        $value = Cache::remember(self::CACHE_KEY, 60, function () {
            // Checked first rather than caught: on PostgreSQL a failed query
            // inside a transaction poisons the rest of that transaction.
            if (! schema_has_table('modulo_meta')) {
                return '';
            }

            try {
                return DB::table('modulo_meta')->where('key', self::KEY)->value('value') ?? '';
            } catch (Throwable) {
                return '';
            }
        });

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * Record the running build as the schema's version. A development build is
     * never recorded: its version means nothing to compare against.
     */
    public static function recordCurrent(): void
    {
        if (Version::isDev() || ! schema_has_table('modulo_meta')) {
            return;
        }

        try {
            DB::table('modulo_meta')->updateOrInsert(
                ['key' => self::KEY],
                ['value' => Version::current(), 'updated_at' => now(), 'created_at' => now()],
            );
        } catch (Throwable) {
            // Recording is best-effort: a missing row only disables the guard.
            return;
        } finally {
            Cache::forget(self::CACHE_KEY);
        }
    }

    /**
     * True when a newer Modulo version has already migrated this database.
     */
    public static function isAheadOfCode(): bool
    {
        $recorded = self::recorded();

        if ($recorded === null || Version::isDev()) {
            return false;
        }

        return Version::compare($recorded) < 0;
    }
}
