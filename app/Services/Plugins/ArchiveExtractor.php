<?php

namespace App\Services\Plugins;

use Illuminate\Support\Facades\File;
use RuntimeException;
use ZipArchive;

/**
 * Extracts a plugin archive, treating its contents as hostile.
 *
 * ZipArchive::extractTo() offers none of this. It happily writes entries whose
 * names escape the destination, follows nothing but also checks nothing, and
 * will expand a small archive into an arbitrarily large one. Every check here
 * runs before a single byte is written.
 */
class ArchiveExtractor
{
    /**
     * Extensions a plugin may contain.
     *
     * PHP is on the list because shipping PHP is what a plugin *is*. What
     * stops that being a remote code execution hole is elsewhere: PHP is never
     * extracted into public/, and the web server only ever executes
     * /index.php. Executables and shared objects have no business here.
     */
    public const ALLOWED_EXTENSIONS = [
        'php', 'json', 'md', 'txt', 'yml', 'yaml', 'xml',
        'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'css', 'scss', 'map',
        'blade', 'html', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'ico',
        'woff', 'woff2', 'ttf', 'eot', 'otf',
        'sql', 'lock', 'stub', 'po', 'mo', 'csv',
    ];

    /** Files with no extension that are still allowed. */
    public const ALLOWED_FILENAMES = ['LICENSE', 'README', 'CHANGELOG', 'VERSION', 'Makefile'];

    public const MAX_ENTRIES = 5_000;

    public const MAX_TOTAL_BYTES = 256 * 1024 * 1024;

    public const MAX_ENTRY_BYTES = 64 * 1024 * 1024;

    /**
     * Unpack an archive into a directory that must not already exist.
     *
     * @throws RuntimeException when the archive is malformed or unsafe
     */
    public function extract(string $archivePath, string $destination): void
    {
        if (! File::exists($archivePath)) {
            throw new RuntimeException('Archive not found.');
        }

        $zip = new ZipArchive;
        $opened = $zip->open($archivePath, ZipArchive::RDONLY);

        if ($opened !== true) {
            throw new RuntimeException('Could not open the archive (code '.$opened.').');
        }

        try {
            $this->inspect($zip);

            File::ensureDirectoryExists($destination);
            $realDestination = realpath($destination);

            if ($realDestination === false) {
                throw new RuntimeException('Destination directory could not be resolved.');
            }

            for ($i = 0; $i < $zip->numFiles; $i++) {
                $stat = $zip->statIndex($i);

                if ($stat === false) {
                    throw new RuntimeException('Archive entry '.$i.' could not be read.');
                }

                $name = $stat['name'];

                if ($this->isDirectoryEntry($name)) {
                    File::ensureDirectoryExists($this->safeTarget($realDestination, $name));

                    continue;
                }

                $target = $this->safeTarget($realDestination, $name);
                File::ensureDirectoryExists(dirname($target));

                $stream = $zip->getStream($name);

                if ($stream === false) {
                    throw new RuntimeException('Could not read "'.$name.'" from the archive.');
                }

                $handle = fopen($target, 'wb');

                if ($handle === false) {
                    fclose($stream);

                    throw new RuntimeException('Could not write "'.$name.'".');
                }

                // Copy with a ceiling rather than trusting the declared size:
                // the header can lie about how much data follows.
                $written = stream_copy_to_stream($stream, $handle, static::MAX_ENTRY_BYTES + 1);
                fclose($stream);
                fclose($handle);

                if ($written > static::MAX_ENTRY_BYTES) {
                    throw new RuntimeException('"'.$name.'" is larger than the permitted '.$this->humanBytes(static::MAX_ENTRY_BYTES).'.');
                }
            }
        } finally {
            $zip->close();
        }
    }

    /**
     * Validate every entry before writing anything.
     *
     * @throws RuntimeException
     */
    protected function inspect(ZipArchive $zip): void
    {
        if ($zip->numFiles > static::MAX_ENTRIES) {
            throw new RuntimeException('The archive contains more than '.static::MAX_ENTRIES.' entries.');
        }

        $total = 0;

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);

            if ($stat === false) {
                throw new RuntimeException('Archive entry '.$i.' could not be read.');
            }

            $name = $stat['name'];

            $this->assertSafeName($name);

            if ($this->isSymlink($zip, $i)) {
                // extractTo() would write these, and a link pointing outside
                // the destination turns a later write into an arbitrary one.
                throw new RuntimeException('"'.$name.'" is a symbolic link, which plugin archives may not contain.');
            }

            if ($this->isDirectoryEntry($name)) {
                continue;
            }

            $this->assertAllowedFile($name);

            $size = (int) $stat['size'];

            if ($size > static::MAX_ENTRY_BYTES) {
                throw new RuntimeException('"'.$name.'" declares '.$this->humanBytes($size).', over the per-file limit.');
            }

            $total += $size;

            if ($total > static::MAX_TOTAL_BYTES) {
                throw new RuntimeException('The archive expands to more than '.$this->humanBytes(static::MAX_TOTAL_BYTES).'.');
            }
        }
    }

    /**
     * @throws RuntimeException
     */
    protected function assertSafeName(string $name): void
    {
        if (trim($name) === '') {
            throw new RuntimeException('The archive contains an entry with an empty name.');
        }

        if (str_contains($name, "\0")) {
            throw new RuntimeException('The archive contains an entry with a null byte in its name.');
        }

        $normalised = str_replace('\\', '/', $name);

        if (str_starts_with($normalised, '/') || preg_match('/^[a-zA-Z]:/', $normalised)) {
            throw new RuntimeException('"'.$name.'" is an absolute path.');
        }

        foreach (explode('/', $normalised) as $segment) {
            if ($segment === '..') {
                throw new RuntimeException('"'.$name.'" escapes the destination directory.');
            }
        }
    }

    /**
     * @throws RuntimeException
     */
    protected function assertAllowedFile(string $name): void
    {
        $basename = basename(str_replace('\\', '/', $name));

        // .blade.php and similar: judge by the final extension.
        $extension = strtolower((string) pathinfo($basename, PATHINFO_EXTENSION));

        if ($extension === '') {
            if (in_array(strtoupper($basename), self::ALLOWED_FILENAMES, true)) {
                return;
            }

            throw new RuntimeException('"'.$name.'" has no extension and is not a recognised file.');
        }

        if (! in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            throw new RuntimeException('"'.$name.'" has a disallowed extension (.'.$extension.').');
        }
    }

    /**
     * Symlinks are recorded in the upper 16 bits of the external attributes,
     * which hold the unix mode. ZipArchive exposes no friendlier way to ask.
     */
    protected function isSymlink(ZipArchive $zip, int $index): bool
    {
        $attributes = null;
        $opsys = null;

        if (! $zip->getExternalAttributesIndex($index, $opsys, $attributes)) {
            return false;
        }

        if ($opsys !== ZipArchive::OPSYS_UNIX) {
            return false;
        }

        return (($attributes >> 16) & 0xF000) === 0xA000;
    }

    protected function isDirectoryEntry(string $name): bool
    {
        return str_ends_with($name, '/');
    }

    /**
     * @throws RuntimeException
     */
    protected function safeTarget(string $realDestination, string $name): string
    {
        $normalised = ltrim(str_replace('\\', '/', $name), '/');
        $target = $realDestination.DIRECTORY_SEPARATOR.$normalised;

        // Belt and braces: assertSafeName() already rejected traversal, but the
        // resolved parent must still sit inside the destination.
        $parent = dirname($target);
        $resolvedParent = realpath($parent);

        if ($resolvedParent !== false && ! str_starts_with($resolvedParent, $realDestination)) {
            throw new RuntimeException('"'.$name.'" resolves outside the destination directory.');
        }

        return $target;
    }

    protected function humanBytes(int $bytes): string
    {
        return $bytes >= 1024 * 1024
            ? round($bytes / 1024 / 1024).'MB'
            : round($bytes / 1024).'KB';
    }
}
