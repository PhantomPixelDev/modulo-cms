<?php

namespace App\Services\Plugins;

use App\Models\Plugin;
use App\Services\PluginManager;
use App\Support\Version;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Installs and updates plugins from the registry.
 *
 * The install is staged: download, verify, extract and validate somewhere
 * harmless, and only then move it into place. Nothing touches the live
 * plugins directory until the package has proven itself, and the previous
 * version is kept aside so a failed move can be reversed.
 */
class PluginInstaller
{
    public function __construct(
        protected PluginRegistry $registry,
        protected ArchiveExtractor $extractor,
        protected PluginManager $manager,
    ) {}

    /**
     * Install, or update, a plugin from the registry.
     *
     * @return array{slug: string, version: string, updated: bool}
     *
     * @throws RuntimeException
     */
    public function install(string $slug, ?string $version = null): array
    {
        $release = $this->resolveRelease($slug, $version);

        if (! $this->registry->isCompatible($release)) {
            throw new RuntimeException(sprintf(
                'Plugin "%s" %s requires Modulo %s or newer; this is %s.',
                $slug,
                $release['version'],
                $release['min_core_version'] ?? '?',
                Version::current(),
            ));
        }

        $existing = Plugin::where('slug', $slug)->first();

        // Older code over a newer schema is the one outcome nothing downstream
        // can undo: plugin migrations only ever run forwards. Refuse before a
        // single byte is downloaded.
        if ($existing !== null && version_compare(
            Version::normalize((string) $release['version']),
            Version::normalize((string) $existing->version),
        ) < 0) {
            throw new RuntimeException(sprintf(
                'Refusing to downgrade "%s" from %s to %s. Uninstall it first if an older version is really needed.',
                $slug,
                $existing->version,
                $release['version'],
            ));
        }

        $staging = rtrim((string) config('plugins.staging_path'), '/').'/'.$slug.'-'.uniqid();
        $archive = $staging.'.zip';

        File::ensureDirectoryExists(dirname($staging));

        try {
            $this->download((string) $release['asset_url'], $archive);
            $this->verifyChecksum($archive, (string) $release['sha256']);
            $this->extractor->extract($archive, $staging);

            $package = $this->locatePackageRoot($staging);
            $manifest = $this->readManifest($package);

            $this->assertManifestMatches($manifest, $slug, (string) $release['version']);

            $target = $this->targetDirectory($manifest);

            $this->swapIntoPlace($package, $target, $slug);
        } finally {
            File::delete($archive);
            File::deleteDirectory($staging);
        }

        // Discovery does the version comparison and runs any new migrations.
        $this->manager->rediscoverSlug($slug);

        Plugin::where('slug', $slug)->update([
            'source' => 'registry',
            'source_url' => $release['asset_url'],
            'checksum' => $release['sha256'],
            'min_core_version' => $release['min_core_version'] ?? null,
            'last_checked_at' => now(),
            'available_version' => null,
        ]);

        return [
            'slug' => $slug,
            'version' => (string) $release['version'],
            'updated' => $existing !== null,
        ];
    }

    /**
     * @return array<string, mixed>
     *
     * @throws RuntimeException
     */
    protected function resolveRelease(string $slug, ?string $version): array
    {
        $release = $this->registry->latestFor($slug);

        if ($release === null) {
            throw new RuntimeException('Plugin "'.$slug.'" is not in the registry.');
        }

        if ($version !== null && Version::normalize((string) $release['version']) !== Version::normalize($version)) {
            throw new RuntimeException(sprintf(
                'The registry offers "%s" %s; %s was requested.',
                $slug,
                $release['version'],
                $version,
            ));
        }

        if (! $this->registry->isAllowedUrl((string) $release['asset_url'])) {
            throw new RuntimeException('The package URL for "'.$slug.'" is not on an allowed host.');
        }

        return $release;
    }

    /**
     * @throws RuntimeException
     */
    protected function download(string $url, string $destination): void
    {
        try {
            $response = Http::timeout((int) config('plugins.timeout'))
                // GitHub answers release downloads with a redirect to its asset
                // CDN. Follow it, but never down to plain HTTP; the checksum
                // is what guarantees the bytes either way.
                ->withOptions([
                    'sink' => $destination,
                    'allow_redirects' => ['max' => 5, 'protocols' => ['https'], 'strict' => true],
                ])
                ->get($url);
        } catch (Throwable $e) {
            throw new RuntimeException('Could not download the package: '.$e->getMessage());
        }

        if (! $response->successful()) {
            throw new RuntimeException('Downloading the package returned '.$response->status().'.');
        }

        if (! File::exists($destination) || File::size($destination) === 0) {
            throw new RuntimeException('The downloaded package is empty.');
        }
    }

    /**
     * @throws RuntimeException
     */
    protected function verifyChecksum(string $archive, string $expected): void
    {
        $actual = hash_file('sha256', $archive);

        // hash_equals rather than !==: this is the only thing standing between
        // the registry's promise and arbitrary code on the server.
        if ($actual === false || ! hash_equals(strtolower($expected), strtolower($actual))) {
            throw new RuntimeException('The package checksum does not match the registry. Refusing to install.');
        }
    }

    /**
     * Find the directory holding plugin.json.
     *
     * Release assets usually contain a single top-level folder, and a GitHub
     * source archive always does, named after the repository and ref.
     *
     * @throws RuntimeException
     */
    protected function locatePackageRoot(string $staging): string
    {
        if (File::exists($staging.'/plugin.json')) {
            return $staging;
        }

        foreach (File::directories($staging) as $candidate) {
            if (File::exists($candidate.'/plugin.json')) {
                return $candidate;
            }
        }

        throw new RuntimeException('The package does not contain a plugin.json.');
    }

    /**
     * @return array<string, mixed>
     *
     * @throws RuntimeException
     */
    protected function readManifest(string $package): array
    {
        $manifest = json_decode((string) File::get($package.'/plugin.json'), true);

        if (! is_array($manifest)) {
            throw new RuntimeException('The package manifest is not valid JSON.');
        }

        return $manifest;
    }

    /**
     * @throws RuntimeException
     */
    protected function assertManifestMatches(array $manifest, string $slug, string $version): void
    {
        if (($manifest['slug'] ?? null) !== $slug) {
            throw new RuntimeException(sprintf(
                'The package claims to be "%s" but the registry listed it as "%s".',
                $manifest['slug'] ?? 'unknown',
                $slug,
            ));
        }

        if (Version::normalize((string) ($manifest['version'] ?? '')) !== Version::normalize($version)) {
            throw new RuntimeException(sprintf(
                'The package is version %s but the registry offered %s.',
                $manifest['version'] ?? 'unknown',
                $version,
            ));
        }
    }

    /**
     * Where this package must live.
     *
     * Derived from the manifest's namespace, never from the archive's folder
     * name: PSR-4 resolves Plugins\<Folder> by path, and a GitHub archive is
     * named after the repository and ref rather than the namespace.
     */
    protected function targetDirectory(array $manifest): string
    {
        $namespace = $manifest['namespace'] ?? null;

        if (! is_string($namespace) || trim($namespace) === '') {
            $provider = (string) ($manifest['service_provider'] ?? '');
            $parts = explode('\\', $provider);
            $namespace = $parts[1] ?? '';
        }

        if (! preg_match('/^[A-Za-z][A-Za-z0-9_]*$/', $namespace)) {
            throw new RuntimeException('The package does not declare a usable namespace.');
        }

        return rtrim((string) config('plugins.path'), '/').'/'.$namespace;
    }

    /**
     * Move the staged package into place, keeping the old one until it works.
     *
     * Every rename happens inside the plugins directory. rename() cannot move
     * a directory across filesystems, and in Docker the plugins directory and
     * storage are separate volumes -- so the package is first copied next to
     * its destination, under a dot-prefixed name discovery ignores.
     *
     * @throws RuntimeException
     */
    protected function swapIntoPlace(string $package, string $target, string $slug): void
    {
        $parent = dirname($target);
        $suffix = $slug.'-'.bin2hex(random_bytes(4));
        $incoming = $parent.'/.incoming-'.$suffix;
        $previous = $parent.'/.previous-'.$suffix;

        File::ensureDirectoryExists($parent);

        if (! File::copyDirectory($package, $incoming)) {
            File::deleteDirectory($incoming);

            throw new RuntimeException('Could not copy the package into the plugins directory; nothing was changed.');
        }

        $hadPrevious = File::isDirectory($target);

        if ($hadPrevious && ! File::moveDirectory($target, $previous)) {
            File::deleteDirectory($incoming);

            throw new RuntimeException('Could not set the existing plugin aside; nothing was changed.');
        }

        if (! File::moveDirectory($incoming, $target)) {
            // Put the old version back rather than leaving the site with no
            // plugin at all.
            if ($hadPrevious) {
                File::moveDirectory($previous, $target);
                Log::warning('Plugin "'.$slug.'" install failed; restored the previous version.');
            }
            File::deleteDirectory($incoming);

            throw new RuntimeException('Could not move the package into place.');
        }

        if ($hadPrevious) {
            $this->keepBackup($previous, $slug);
        }
    }

    /**
     * Keep the replaced version where an operator can find it. Best effort:
     * the install has already succeeded, and a failed backup must not undo it.
     */
    protected function keepBackup(string $previous, string $slug): void
    {
        $backup = rtrim((string) config('plugins.backup_path'), '/').'/'.$slug.'-'.now()->format('Ymd-His');

        try {
            File::ensureDirectoryExists(dirname($backup));

            if (! File::copyDirectory($previous, $backup)) {
                Log::warning('Could not keep a backup of plugin "'.$slug.'".');
            }
        } finally {
            File::deleteDirectory($previous);
        }
    }
}
