<?php

namespace App\Services;

use App\Models\Theme;
use App\Services\Plugins\ArchiveExtractor;
use App\Services\Plugins\PackageDownloader;
use App\Services\Plugins\PluginRegistry;
use App\Services\Plugins\PluginRequirements;
use App\Support\Version;
use Illuminate\Support\Facades\File;
use RuntimeException;

/**
 * Installs and updates themes from the registry.
 *
 * A runtime theme is a child theme: theme.json, stylesheets, images, fonts
 * and translations over a bundled parent that renders every template. No
 * code is accepted, so installing a theme can never run anything on the
 * server and never needs a rebuild of the front end.
 */
class ThemeInstaller
{
    /** Files without an extension a theme may still carry. */
    protected const ALLOWED_FILENAMES = ['LICENSE', 'README', 'CHANGELOG'];

    public function __construct(
        protected PluginRegistry $registry,
        protected ArchiveExtractor $extractor,
        protected PackageDownloader $downloader,
        protected ThemeManager $themes,
    ) {}

    /**
     * @return array{slug: string, version: string, updated: bool}
     *
     * @throws RuntimeException
     */
    public function install(string $slug): array
    {
        $release = $this->registry->latestTheme($slug);

        if ($release === null) {
            throw new RuntimeException('Theme "'.$slug.'" is not in the registry.');
        }

        if (! $this->registry->isAllowedUrl((string) $release['asset_url'])) {
            throw new RuntimeException('The package URL for "'.$slug.'" is not on an allowed host.');
        }

        $unmet = app(PluginRequirements::class)->unmet($release, needActive: false);
        if ($unmet !== []) {
            throw new RuntimeException(sprintf('Theme "%s" %s requires %s.', $slug, $release['version'], implode(', ', $unmet)));
        }

        $existing = Theme::where('slug', $slug)->first();

        if ($existing !== null && ! $existing->isRuntimeInstalled()) {
            throw new RuntimeException('"'.$slug.'" is bundled with Modulo and is updated with it.');
        }

        if ($existing !== null && version_compare(Version::normalize((string) $release['version']), Version::normalize((string) $existing->version)) < 0) {
            throw new RuntimeException(sprintf('Refusing to downgrade "%s" from %s to %s.', $slug, $existing->version, $release['version']));
        }

        $staging = rtrim((string) config('theme.staging_path'), '/').'/'.$slug.'-'.uniqid();
        $archive = $staging.'.zip';
        File::ensureDirectoryExists(dirname($staging));

        try {
            $this->downloader->download((string) $release['asset_url'], $archive);
            $this->downloader->verifyChecksum($archive, (string) $release['sha256']);
            $this->extractor->extract($archive, $staging);

            $package = $this->locatePackageRoot($staging);
            $manifest = json_decode((string) File::get($package.'/theme.json'), true);

            if (! is_array($manifest)) {
                throw new RuntimeException('The package theme.json is not valid JSON.');
            }

            $this->assertManifest($manifest, $slug, (string) $release['version']);
            $this->assertOnlyAllowedFiles($package);

            $target = rtrim((string) config('theme.install_path'), '/').'/'.$slug;
            $this->swapIntoPlace($package, $target);
        } finally {
            File::delete($archive);
            File::deleteDirectory($staging);
        }

        try {
            $theme = $this->themes->installTheme(['directory' => $slug, 'config' => $manifest, 'path' => $target]);
        } catch (\InvalidArgumentException $e) {
            throw new RuntimeException($e->getMessage(), 0, $e);
        }

        $this->themes->publishAssets($theme);
        $this->themes->clearCache();

        return ['slug' => $slug, 'version' => (string) $release['version'], 'updated' => $existing !== null];
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    protected function assertManifest(array $manifest, string $slug, string $version): void
    {
        if (($manifest['slug'] ?? null) !== $slug) {
            throw new RuntimeException(sprintf('The package claims to be "%s" but the registry listed it as "%s".', $manifest['slug'] ?? 'unknown', $slug));
        }

        if (Version::normalize((string) ($manifest['version'] ?? '')) !== Version::normalize($version)) {
            throw new RuntimeException(sprintf('The package is version %s but the registry offered %s.', $manifest['version'] ?? 'unknown', $version));
        }

        if (! is_string($manifest['parent'] ?? null) || $manifest['parent'] === '') {
            throw new RuntimeException('Only child themes (theme.json with a "parent") can be installed at runtime; a theme with its own components has to be built into the site.');
        }
    }

    protected function assertOnlyAllowedFiles(string $package): void
    {
        $allowed = array_map('strtolower', (array) config('theme.allowed_extensions', []));

        foreach (File::allFiles($package, true) as $file) {
            $extension = strtolower($file->getExtension());

            if ($extension === '' ? ! in_array($file->getFilename(), self::ALLOWED_FILENAMES, true) : ! in_array($extension, $allowed, true)) {
                throw new RuntimeException('The theme contains a file that is not allowed: '.$file->getRelativePathname());
            }
        }
    }

    protected function locatePackageRoot(string $staging): string
    {
        if (File::exists($staging.'/theme.json')) {
            return $staging;
        }

        foreach (File::directories($staging) as $candidate) {
            if (File::exists($candidate.'/theme.json')) {
                return $candidate;
            }
        }

        throw new RuntimeException('The package does not contain a theme.json.');
    }

    /**
     * Move the new files in, keeping the old ones until the move worked.
     */
    protected function swapIntoPlace(string $package, string $target): void
    {
        $parent = dirname($target);
        $previous = $parent.'/.previous-'.basename($target).'-'.bin2hex(random_bytes(4));
        File::ensureDirectoryExists($parent);

        $hadPrevious = File::isDirectory($target);

        if ($hadPrevious && ! File::moveDirectory($target, $previous)) {
            throw new RuntimeException('Could not set the existing theme aside; nothing was changed.');
        }

        if (! File::copyDirectory($package, $target)) {
            File::deleteDirectory($target);
            if ($hadPrevious) {
                File::moveDirectory($previous, $target);
            }

            throw new RuntimeException('Could not move the theme into place; nothing was changed.');
        }

        File::deleteDirectory($previous);
    }
}
