<?php

namespace App\Services;

use App\Support\InstallChannel;
use App\Support\Version;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Asks GitHub whether a newer release exists.
 *
 * Mirrors ThemeManager::hasUpdates(), which is the same shape with the local
 * filesystem as its "remote". The difference worth stating: this never applies
 * anything. Delivering new code is channel-specific and, on Docker,
 * impossible from inside the container -- so the result is advice plus the
 * exact command for the detected channel.
 */
class UpdateChecker
{
    public const CACHE_KEY = 'modulo:update-check';

    /**
     * @return array{
     *     checked: bool,
     *     current: string,
     *     latest: string|null,
     *     available: bool,
     *     url: string|null,
     *     published_at: string|null,
     *     error: string|null,
     * }
     */
    public function check(bool $force = false): array
    {
        $current = Version::current();

        if (! config('updates.enabled')) {
            return $this->result($current, null, null, null, 'Update checks are disabled.');
        }

        // A development checkout has no meaningful version to compare, and
        // telling someone their working copy is "out of date" is noise.
        if (Version::isDev()) {
            return $this->result($current, null, null, null, 'Development build; not checking for updates.');
        }

        if ($force) {
            Cache::forget(self::CACHE_KEY);
        }

        $release = Cache::remember(
            self::CACHE_KEY,
            (int) config('updates.cache_ttl'),
            fn () => $this->fetchLatestRelease(),
        );

        if ($release === null || ($release['error'] ?? null) !== null) {
            return $this->result($current, null, null, null, $release['error'] ?? 'Could not reach the update server.');
        }

        return $this->result(
            $current,
            $release['version'],
            $release['url'],
            $release['published_at'],
            null,
        );
    }

    /**
     * The command that actually performs the update for this install.
     *
     * A Docker install cannot rewrite itself: the image is immutable, opcache
     * runs with validate_timestamps off, and public/ is baked into the nginx
     * image at build time, so an app container that replaced its own assets
     * would serve new markup with stale files.
     *
     * @return array<int, string>
     */
    public function upgradeCommands(): array
    {
        return match (InstallChannel::detect()) {
            InstallChannel::DOCKER => [
                'docker compose pull',
                'docker compose up -d',
                'docker compose exec app php artisan modulo:upgrade',
            ],
            InstallChannel::GIT => [
                'git fetch --tags && git checkout <version>',
                'composer install --no-dev --optimize-autoloader',
                'npm ci && npm run build',
                'php artisan modulo:upgrade',
            ],
            default => [
                '# download and verify the release tarball, then replace the directory',
                'php artisan modulo:upgrade',
            ],
        };
    }

    /**
     * @return array{version: string, url: string|null, published_at: string|null, error: string|null}|null
     */
    protected function fetchLatestRelease(): ?array
    {
        $endpoint = str_replace(
            ':repository',
            (string) config('updates.repository'),
            (string) config('updates.endpoint'),
        );

        try {
            // Same shape as SearchEnginePingingService, the only other outbound
            // call in the application: short timeout, failure is not fatal.
            $response = Http::timeout((int) config('updates.timeout'))
                ->withHeaders(['Accept' => 'application/vnd.github+json'])
                ->get($endpoint);

            if (! $response->successful()) {
                return ['version' => '', 'url' => null, 'published_at' => null, 'error' => 'Update server returned '.$response->status().'.'];
            }

            $payload = $response->json();
        } catch (Throwable $e) {
            return ['version' => '', 'url' => null, 'published_at' => null, 'error' => $e->getMessage()];
        }

        if (! is_array($payload) || ! isset($payload['tag_name'])) {
            return ['version' => '', 'url' => null, 'published_at' => null, 'error' => 'Unexpected response from the update server.'];
        }

        if (($payload['prerelease'] ?? false) && ! config('updates.include_prereleases')) {
            return ['version' => '', 'url' => null, 'published_at' => null, 'error' => 'Latest release is a prerelease.'];
        }

        return [
            'version' => Version::normalize((string) $payload['tag_name']),
            'url' => isset($payload['html_url']) ? (string) $payload['html_url'] : null,
            'published_at' => isset($payload['published_at']) ? (string) $payload['published_at'] : null,
            'error' => null,
        ];
    }

    /**
     * @return array{checked: bool, current: string, latest: string|null, available: bool, url: string|null, published_at: string|null, error: string|null}
     */
    protected function result(string $current, ?string $latest, ?string $url, ?string $publishedAt, ?string $error): array
    {
        $available = $latest !== null
            && $latest !== ''
            && version_compare($latest, Version::normalize($current), '>');

        return [
            'checked' => $error === null,
            'current' => $current,
            'latest' => $latest !== '' ? $latest : null,
            'available' => $available,
            'url' => $url,
            'published_at' => $publishedAt,
            'error' => $error,
        ];
    }
}
