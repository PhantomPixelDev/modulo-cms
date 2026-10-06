<?php

namespace App\Support;

/**
 * LIKE wildcards in user input. `%` and `_` in a search box must match
 * literally, not act as wildcards (over-matching and expensive full scans).
 * Uses `!` as the escape character, always paired with `ESCAPE '!'` in the
 * SQL, so it behaves the same on MySQL, PostgreSQL and SQLite.
 */
final class LikeEscape
{
    public static function escape(string $value): string
    {
        return str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $value);
    }

    public static function contains(string $value): string
    {
        return '%'.self::escape($value).'%';
    }
}
