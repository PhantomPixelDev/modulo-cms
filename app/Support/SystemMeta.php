<?php

namespace App\Support;

use App\Models\Meta;
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
            $value = Meta::find($key)?->value;
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
                Meta::where('key', $key)->delete();

                return;
            }

            Meta::updateOrCreate(
                ['key' => $key],
                ['value' => $value],
            );
        } catch (Throwable) {
            return;
        }
    }
}
