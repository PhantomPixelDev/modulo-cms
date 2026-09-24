<?php

namespace App\Support;

/**
 * How this installation was delivered.
 *
 * The update path differs per channel, and one of them cannot update itself at
 * all: a Docker image is immutable and has its public/ directory baked into a
 * separate nginx image at build time. An app container that rewrote its own files would serve new markup with
 * stale assets. So the admin shows the right command for the detected channel
 * rather than pretending one updater fits all three.
 */
class InstallChannel
{
    public const DOCKER = 'docker';

    public const TARBALL = 'tarball';

    public const GIT = 'git';

    public static function detect(): string
    {
        $configured = trim((string) config('version.channel'));

        if (in_array($configured, [self::DOCKER, self::TARBALL, self::GIT], true)) {
            return $configured;
        }

        if (self::isContainer()) {
            return self::DOCKER;
        }

        if (is_dir(base_path('.git'))) {
            return self::GIT;
        }

        return self::TARBALL;
    }

    public static function isDocker(): bool
    {
        return self::detect() === self::DOCKER;
    }

    /**
     * Whether this channel can replace its own code in place.
     *
     * Docker cannot; the image is replaced from outside. The other two can.
     */
    public static function canSelfUpdate(): bool
    {
        return ! self::isDocker();
    }

    protected static function isContainer(): bool
    {
        // Written by Docker itself; Podman writes /run/.containerenv.
        return file_exists('/.dockerenv') || file_exists('/run/.containerenv');
    }
}
