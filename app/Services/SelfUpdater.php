<?php

namespace App\Services;

use App\Support\InstallChannel;
use App\Support\Version;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Symfony\Component\Process\Process;
use Throwable;

/**
 * Updates a release-tarball install in place: download, verify, swap the code,
 * then let the new code run its own guarded `modulo:upgrade`.
 *
 * What stays: .env, storage/, plugins/ (runtime-installed plugins; bundled ones
 * are synced from the release where newer) and the runtime folders under
 * public/ (storage link, published theme and plugin assets). Everything else
 * that the release ships is replaced, and the previous code is kept under
 * storage/app/updates/previous for `modulo:update --rollback`.
 *
 * Docker installs are updated from outside (./modulo update) and git checkouts
 * with git; both are refused here.
 */
class SelfUpdater
{
    /** Top-level entries never replaced by a release. */
    public const PRESERVED = ['.env', 'storage', 'plugins', 'plugins-bundled', '.git'];

    /** Entries under public/ that belong to this site, not to the release. */
    public const PRESERVED_PUBLIC = ['storage', 'themes', 'plugins'];

    /** @var callable(string): void */
    protected $log;

    public function __construct(protected ?string $root = null)
    {
        $this->root ??= base_path();
        $this->log = fn (string $line) => null;
    }

    /**
     * @param  callable(string): void  $log
     */
    public function onLog(callable $log): static
    {
        $this->log = $log;

        return $this;
    }

    public function workDirectory(): string
    {
        return $this->root.'/storage/app/updates';
    }

    public function previousDirectory(): string
    {
        return $this->workDirectory().'/previous';
    }

    /**
     * @throws RuntimeException when this install cannot update itself
     */
    public function assertSupported(): void
    {
        $channel = InstallChannel::detect();

        if ($channel === InstallChannel::DOCKER) {
            throw new RuntimeException('This is a Docker install: update it from the host with ./modulo update.');
        }

        if ($channel === InstallChannel::GIT) {
            throw new RuntimeException('This is a git checkout: update it with git (see docs/upgrading.md).');
        }

        if (! is_writable($this->root)) {
            throw new RuntimeException("The install directory ({$this->root}) is not writable by this user; run the update as the user that owns the files.");
        }
    }

    /**
     * The release to install: its tarball URL, checksum and manifest.
     *
     * @return array{version: string, tarball_url: string, sha256: string, manifest: array<string, mixed>}
     *
     * @throws RuntimeException
     */
    public function resolve(string $version): array
    {
        $version = Version::normalize($version);
        $repository = (string) config('updates.repository');

        try {
            $response = Http::timeout(15)->accept('application/vnd.github+json')
                ->get("https://api.github.com/repos/{$repository}/releases/tags/v{$version}");
        } catch (Throwable $e) {
            throw new RuntimeException('Could not reach GitHub: '.$e->getMessage());
        }

        if (! $response->successful() || ! is_array($response->json('assets'))) {
            throw new RuntimeException("Release v{$version} was not found ({$response->status()}).");
        }

        $assets = collect($response->json('assets'))->filter(fn ($a) => is_array($a))->keyBy('name');
        $name = "modulo-cms-{$version}.tar.gz";

        $tarball = $assets[$name]['browser_download_url'] ?? null;
        $checksumUrl = $assets["{$name}.sha256"]['browser_download_url'] ?? null;

        if (! is_string($tarball) || ! is_string($checksumUrl) || ! str_starts_with($tarball, 'https://') || ! str_starts_with($checksumUrl, 'https://')) {
            throw new RuntimeException("Release v{$version} has no {$name} with a .sha256 file.");
        }

        $sha256 = strtolower(trim(strtok((string) Http::timeout(15)->get($checksumUrl)->body(), " \n") ?: ''));

        if (preg_match('/^[a-f0-9]{64}$/', $sha256) !== 1) {
            throw new RuntimeException('The release checksum file is not readable.');
        }

        $manifest = [];
        if (is_string($manifestUrl = $assets['release.json']['browser_download_url'] ?? null) && str_starts_with($manifestUrl, 'https://')) {
            $manifest = Http::timeout(15)->get($manifestUrl)->json() ?? [];

            // Two independent statements of the same checksum must agree.
            $declared = $manifest['artifacts']['tarball']['sha256'] ?? null;
            if (is_string($declared) && ! hash_equals(strtolower($declared), $sha256)) {
                throw new RuntimeException('release.json and the .sha256 file disagree about the tarball checksum. Refusing to update.');
            }
        }

        return ['version' => $version, 'tarball_url' => $tarball, 'sha256' => $sha256, 'manifest' => is_array($manifest) ? $manifest : []];
    }

    /**
     * Download, verify and unpack a release. Returns the unpacked directory.
     *
     * @param  array{version: string, tarball_url: string, sha256: string}  $release
     *
     * @throws RuntimeException
     */
    public function stage(array $release): string
    {
        $work = $this->workDirectory();
        $archive = "{$work}/modulo-cms-{$release['version']}.tar.gz";
        $extractTo = "{$work}/stage-{$release['version']}";

        File::ensureDirectoryExists($work, 0750);
        File::deleteDirectory($extractTo);
        File::ensureDirectoryExists($extractTo, 0750);

        ($this->log)("Downloading {$release['tarball_url']}");
        try {
            $response = Http::timeout(300)
                ->withOptions(['sink' => $archive, 'allow_redirects' => ['max' => 5, 'protocols' => ['https'], 'strict' => true]])
                ->get($release['tarball_url']);
        } catch (Throwable $e) {
            throw new RuntimeException('Download failed: '.$e->getMessage());
        }

        if (! $response->successful()) {
            throw new RuntimeException('Download failed: HTTP '.$response->status());
        }

        $actual = hash_file('sha256', $archive);
        if ($actual === false || ! hash_equals($release['sha256'], strtolower($actual))) {
            File::delete($archive);

            throw new RuntimeException('The download does not match the release checksum. Refusing to update.');
        }
        ($this->log)('Checksum verified.');

        // GNU/BSD tar refuse absolute paths and ".." members by default.
        $tar = new Process(['tar', '-xzf', $archive, '-C', $extractTo, '--no-same-owner'], timeout: 600);
        $tar->run();
        File::delete($archive);

        if (! $tar->isSuccessful()) {
            throw new RuntimeException('Could not unpack the release: '.trim($tar->getErrorOutput()));
        }

        $package = "{$extractTo}/modulo-cms-{$release['version']}";

        foreach (['artisan', 'vendor/autoload.php', 'public/index.php', 'VERSION'] as $required) {
            if (! File::exists("{$package}/{$required}")) {
                throw new RuntimeException("The release is incomplete: {$required} is missing.");
            }
        }

        if (Version::normalize(trim((string) File::get("{$package}/VERSION"))) !== $release['version']) {
            throw new RuntimeException('The release VERSION file does not match '.$release['version'].'.');
        }

        return $package;
    }

    /**
     * Replace the running code with a staged release, keeping the old code
     * aside. The caller puts the site into maintenance first.
     *
     * @return array<int, string> The entries replaced
     */
    public function swap(string $package, string $fromVersion): array
    {
        $previous = $this->previousDirectory();
        File::deleteDirectory($previous);
        File::ensureDirectoryExists($previous.'/public', 0750);
        File::put($previous.'/VERSION.previous', $fromVersion);

        $replaced = [];

        foreach ($this->entries($package) as $relative) {
            $source = "{$package}/{$relative}";
            $target = "{$this->root}/{$relative}";

            if (File::exists($target) || is_link($target)) {
                File::ensureDirectoryExists(dirname("{$previous}/{$relative}"));
                if (! @rename($target, "{$previous}/{$relative}")) {
                    $this->restore($replaced);

                    throw new RuntimeException("Could not move {$relative} aside; the previous code was put back.");
                }
            }

            if (! @rename($source, $target)) {
                @rename("{$previous}/{$relative}", $target);
                $this->restore($replaced);

                throw new RuntimeException("Could not move the new {$relative} into place; the previous code was put back.");
            }

            $replaced[] = $relative;
        }

        File::put($previous.'/manifest.json', (string) json_encode($replaced));

        return $replaced;
    }

    /**
     * Put back the code `swap()` set aside.
     *
     * @throws RuntimeException when there is nothing to roll back to
     */
    public function rollback(): string
    {
        $previous = $this->previousDirectory();
        $replaced = json_decode((string) @file_get_contents($previous.'/manifest.json'), true);

        if (! is_array($replaced)) {
            throw new RuntimeException('There is no previous version to roll back to.');
        }

        $this->restore($replaced);
        $version = trim((string) @file_get_contents($previous.'/VERSION.previous'));
        File::deleteDirectory($previous);

        return $version;
    }

    /**
     * Run an artisan command with the code now on disk (a fresh PHP process,
     * so it is the new release's code, not this one's).
     *
     * @param  array<int, string>  $arguments
     */
    public function artisan(array $arguments): bool
    {
        $process = new Process([PHP_BINARY, 'artisan', ...$arguments], $this->root, timeout: 1800);
        $process->run(fn ($type, $buffer) => ($this->log)(rtrim($buffer)));

        return $process->isSuccessful();
    }

    /**
     * Release entries to install, one level deep for public/ so the site's own
     * public folders survive.
     *
     * @return array<int, string>
     */
    protected function entries(string $package): array
    {
        $entries = [];

        foreach (scandir($package) ?: [] as $name) {
            if ($name === '.' || $name === '..' || in_array($name, self::PRESERVED, true)) {
                continue;
            }

            if ($name === 'public') {
                foreach (scandir("{$package}/public") ?: [] as $publicName) {
                    if ($publicName !== '.' && $publicName !== '..' && ! in_array($publicName, self::PRESERVED_PUBLIC, true)) {
                        $entries[] = "public/{$publicName}";
                    }
                }

                continue;
            }

            $entries[] = $name;
        }

        return $entries;
    }

    /**
     * @param  array<int, string>  $replaced
     */
    protected function restore(array $replaced): void
    {
        $previous = $this->previousDirectory();

        foreach (array_reverse($replaced) as $relative) {
            $target = "{$this->root}/{$relative}";

            File::isDirectory($target) && ! is_link($target) ? File::deleteDirectory($target) : File::delete($target);

            // Absent from the previous code means the release added it:
            // removing it (above) is the whole restore.
            if (File::exists("{$previous}/{$relative}") || is_link("{$previous}/{$relative}")) {
                @rename("{$previous}/{$relative}", $target);
            }
        }
    }
}
