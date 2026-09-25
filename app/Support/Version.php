<?php

namespace App\Support;

/**
 * The running build's identity.
 *
 * Read through here rather than touching config('version.*') directly, so the
 * development sentinel is handled in one place. Anything that gates on a
 * version — plugin compatibility, update checks — must treat a development
 * build as "unknown, allow with a warning" rather than comparing against
 * 0.0.0, which every constraint would fail.
 */
class Version
{
    public const DEV = '0.0.0-dev';

    public static function current(): string
    {
        $version = trim((string) config('version.version'));

        return $version !== '' ? $version : self::DEV;
    }

    /**
     * True when this is not a released build: an untagged working copy
     * (0.0.0-dev) or an image built from a checkout without a release version
     * stamped in (X.Y.Z-dev).
     */
    public static function isDev(): bool
    {
        return str_ends_with(self::current(), '-dev');
    }

    public static function commit(): ?string
    {
        $commit = trim((string) config('version.commit'));

        return $commit !== '' ? $commit : null;
    }

    public static function shortCommit(): ?string
    {
        $commit = self::commit();

        return $commit !== null ? substr($commit, 0, 7) : null;
    }

    public static function builtAt(): ?string
    {
        $builtAt = trim((string) config('version.built_at'));

        return $builtAt !== '' ? $builtAt : null;
    }

    /**
     * Compare the running version against another, like version_compare().
     *
     * Returns -1 when this build is older, 0 when equal, 1 when newer.
     */
    public static function compare(string $other): int
    {
        return version_compare(self::normalize(self::current()), self::normalize($other));
    }

    /**
     * True when the running build satisfies a minimum version requirement.
     *
     * A development build satisfies everything: it has no meaningful version to
     * test, and failing closed would make every plugin uninstallable on a
     * working copy. Callers should surface a warning instead.
     */
    public static function satisfiesMinimum(?string $minimum): bool
    {
        if ($minimum === null || trim($minimum) === '' || self::isDev()) {
            return true;
        }

        return version_compare(self::normalize(self::current()), self::normalize($minimum), '>=');
    }

    /**
     * Strip a leading "v" so "v1.2.0" and "1.2.0" compare equal.
     */
    public static function normalize(string $version): string
    {
        return ltrim(trim($version), 'vV');
    }
}
