<?php

namespace App\Services\Plugins;

use App\Support\Version;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * The index of installable plugins.
 *
 * Everything it returns came off the network and is treated as data, never as
 * instruction: entries are validated, download hosts are checked against an
 * allowlist, and the checksum recorded here is what an install is verified
 * against.
 */
class PluginRegistry
{
    public const CACHE_KEY = 'modulo:plugin-registry';

    /**
     * @return array<int, array<string, mixed>>
     */
    public function all(bool $force = false): array
    {
        if ($force) {
            Cache::forget(self::CACHE_KEY);
        }

        $index = Cache::remember(
            self::CACHE_KEY,
            (int) config('plugins.registry_cache_ttl'),
            fn () => $this->fetch(),
        );

        return $index['plugins'] ?? [];
    }

    /**
     * Themes in the registry.
     *
     * @return array<int, array<string, mixed>>
     */
    public function themes(bool $force = false): array
    {
        if ($force) {
            Cache::forget(self::CACHE_KEY);
        }

        $index = Cache::remember(self::CACHE_KEY, (int) config('plugins.registry_cache_ttl'), fn () => $this->fetch());

        return $index['themes'] ?? [];
    }

    /**
     * The newest release of a registry theme.
     *
     * @return array<string, mixed>|null
     */
    public function latestTheme(string $slug, bool $force = false): ?array
    {
        foreach ($this->themes($force) as $entry) {
            if (($entry['slug'] ?? null) === $slug && is_array($entry['latest'] ?? null)) {
                return $entry['latest'] + ['slug' => $slug, 'parent' => $entry['parent'] ?? null];
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function find(string $slug, bool $force = false): ?array
    {
        foreach ($this->all($force) as $entry) {
            if (($entry['slug'] ?? null) === $slug) {
                return $entry;
            }
        }

        return null;
    }

    /**
     * The newest release of a plugin this core can actually run.
     *
     * @return array<string, mixed>|null
     */
    public function latestFor(string $slug, bool $force = false): ?array
    {
        $entry = $this->find($slug, $force);

        if ($entry === null) {
            return null;
        }

        $latest = $entry['latest'] ?? null;

        if (! is_array($latest)) {
            return null;
        }

        return $latest + ['slug' => $slug, 'namespace' => $entry['namespace'] ?? null];
    }

    /**
     * Plugins with a newer release than the version installed.
     *
     * @param  array<string, string>  $installed  slug => version
     * @return array<int, array{slug: string, installed: string, available: string}>
     */
    public function updatesFor(array $installed, bool $force = false): array
    {
        $updates = [];

        foreach ($installed as $slug => $version) {
            $latest = $this->latestFor($slug, $force);

            if ($latest === null || ! isset($latest['version'])) {
                continue;
            }

            if (version_compare((string) $latest['version'], (string) $version, '>')) {
                $updates[] = [
                    'slug' => $slug,
                    'installed' => (string) $version,
                    'available' => (string) $latest['version'],
                ];
            }
        }

        return $updates;
    }

    /**
     * Whether a package may be downloaded from this URL.
     *
     * Checked even for registry-supplied URLs: a compromised index must not be
     * able to point an install at an arbitrary server.
     */
    public function isAllowedUrl(string $url): bool
    {
        $parts = parse_url($url);

        if ($parts === false || ($parts['scheme'] ?? '') !== 'https') {
            return false;
        }

        $host = strtolower($parts['host'] ?? '');

        return in_array($host, array_map('strtolower', (array) config('plugins.allowed_hosts', [])), true);
    }

    /**
     * Whether this core satisfies a release's minimum version.
     */
    public function isCompatible(array $release): bool
    {
        return Version::satisfiesMinimum($release['min_core_version'] ?? null);
    }

    /**
     * @return array<string, mixed>
     */
    protected function fetch(): array
    {
        $url = (string) config('plugins.registry_url');

        try {
            $response = Http::timeout((int) config('plugins.timeout'))
                ->withHeaders(['Accept' => 'application/json'])
                ->get($url);
        } catch (Throwable $e) {
            throw new RuntimeException('Could not reach the plugin registry: '.$e->getMessage());
        }

        if (! $response->successful()) {
            throw new RuntimeException('The plugin registry returned '.$response->status().'.');
        }

        $payload = $response->json();

        if (! is_array($payload) || ! isset($payload['plugins']) || ! is_array($payload['plugins'])) {
            throw new RuntimeException('The plugin registry returned an unexpected payload.');
        }

        $payload['plugins'] = array_values(array_filter(
            $payload['plugins'],
            fn ($entry) => is_array($entry) && $this->isUsableEntry($entry),
        ));

        // Themes share the index (same shape, their own list). Optional.
        $payload['themes'] = array_values(array_filter(
            is_array($payload['themes'] ?? null) ? $payload['themes'] : [],
            fn ($entry) => is_array($entry) && $this->isUsableEntry($entry),
        ));

        return $payload;
    }

    /**
     * Drop entries that could not be installed anyway, so a malformed index
     * fails one plugin rather than the whole listing.
     */
    protected function isUsableEntry(array $entry): bool
    {
        if (! isset($entry['slug']) || ! is_string($entry['slug'])) {
            return false;
        }

        if (! preg_match('/^[a-z0-9-]+$/', $entry['slug'])) {
            return false;
        }

        $latest = $entry['latest'] ?? null;

        if (! is_array($latest)) {
            return false;
        }

        foreach (['version', 'asset_url', 'sha256'] as $key) {
            if (! isset($latest[$key]) || ! is_string($latest[$key]) || trim($latest[$key]) === '') {
                return false;
            }
        }

        return $this->isAllowedUrl($latest['asset_url']);
    }
}
