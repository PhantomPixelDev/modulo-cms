<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Refreshes the plugins shipped inside the image onto the plugins volume.
 *
 * A named volume keeps whatever it was seeded with on first boot, so an image
 * upgrade would otherwise never reach the plugins bundled with it. A blind copy
 * is wrong the other way: it would downgrade a plugin the owner has since
 * updated from the registry. So a bundled copy only replaces what is on the
 * volume when it is strictly newer, or when nothing is there yet.
 *
 * Deliberately touches no database -- it runs at boot, before migrations.
 */
class PluginSyncBundledCommand extends Command
{
    protected $signature = 'plugin:sync-bundled
        {--from= : Directory holding the bundled plugins (default: plugins-bundled)}';

    protected $description = 'Copy bundled plugins onto the plugins directory where they are newer';

    public function handle(): int
    {
        $source = rtrim((string) ($this->option('from') ?: base_path('plugins-bundled')), '/');
        $target = rtrim((string) config('plugins.path'), '/');

        if (! File::isDirectory($source)) {
            $this->line('No bundled plugins to sync.');

            return self::SUCCESS;
        }

        File::ensureDirectoryExists($target);

        foreach (File::directories($source) as $bundled) {
            $name = basename($bundled);
            $bundledVersion = $this->versionOf($bundled);

            if ($bundledVersion === null) {
                $this->warn("  {$name}: no readable plugin.json, skipped");

                continue;
            }

            $installed = $target.'/'.$name;
            $installedVersion = File::isDirectory($installed) ? $this->versionOf($installed) : null;

            if ($installedVersion !== null && version_compare($bundledVersion, $installedVersion, '<=')) {
                $this->line("  {$name}: {$installedVersion} kept (bundled {$bundledVersion})");

                continue;
            }

            $this->replace($bundled, $installed);
            $this->info("  {$name}: ".($installedVersion ?? 'none')." -> {$bundledVersion}");
        }

        return self::SUCCESS;
    }

    protected function versionOf(string $directory): ?string
    {
        $manifest = $directory.'/plugin.json';

        if (! File::exists($manifest)) {
            return null;
        }

        $decoded = json_decode((string) File::get($manifest), true);
        $version = is_array($decoded) ? ($decoded['version'] ?? null) : null;

        return is_string($version) && $version !== '' ? ltrim($version, 'v') : null;
    }

    /**
     * Stage next to the destination and swap, so a failed copy never leaves a
     * half-written plugin where the application will load it.
     */
    protected function replace(string $from, string $to): void
    {
        // Dot-prefixed so discovery never picks up a half-copied package.
        $staging = dirname($to).'/.sync-'.basename($to).'-'.bin2hex(random_bytes(4));
        $backup = dirname($to).'/.old-'.basename($to).'-'.bin2hex(random_bytes(4));

        if (! File::copyDirectory($from, $staging)) {
            File::deleteDirectory($staging);

            throw new \RuntimeException("Could not stage {$from}.");
        }

        $hadPrevious = File::isDirectory($to);

        if ($hadPrevious && ! File::moveDirectory($to, $backup)) {
            File::deleteDirectory($staging);

            throw new \RuntimeException("Could not move {$to} aside.");
        }

        if (! File::moveDirectory($staging, $to)) {
            if ($hadPrevious) {
                File::moveDirectory($backup, $to);
            }
            File::deleteDirectory($staging);

            throw new \RuntimeException("Could not move the new copy into {$to}.");
        }

        File::deleteDirectory($backup);
    }
}
