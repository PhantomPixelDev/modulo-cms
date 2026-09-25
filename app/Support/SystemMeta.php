<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Small key/value facts about this install (modulo_meta), e.g. when updates
 * were last checked. Best-effort: before the table exists every read is null
 * and every write is dropped, so callers never need to guard.
 */
class SystemMeta
{
    public static function get(string $key): ?string
    {
        if (! schema_has_table('modulo_meta')) {
            return null;
        }

        try {
            $value = DB::table('modulo_meta')->where('key', $key)->value('value');
        } catch (Throwable) {
            return null;
        }

        return is_string($value) ? $value : null;
    }

    public static function put(string $key, ?string $value): void
    {
        if (! schema_has_table('modulo_meta')) {
            return;
        }

        try {
            if ($value === null) {
                DB::table('modulo_meta')->where('key', $key)->delete();

                return;
            }

            DB::table('modulo_meta')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'updated_at' => now(), 'created_at' => now()],
            );
        } catch (Throwable) {
            return;
        }
    }
}
