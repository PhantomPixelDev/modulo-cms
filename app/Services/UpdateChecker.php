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
 * This never applies anything. Delivering new code is channel-specific and, on
 * Docker, impossible from inside the container -- so the result is advice plus
 * the exact commands for the detected channel.
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

        $release = $force ? null : Cache::get(self::CACHE_KEY);

        if (! is_array($release)) {
            $release = $this->fetchLatestRelease();

            // A failed check is only remembered briefly: one network hiccup or
            // rate limit must not hide a (possibly security) release for half
            // a day, but retrying on every admin page load would make a rate
            // limit worse.
            $ttl = $release['error'] === null
                ? (int) config('updates.cache_ttl')
                : (int) config('updates.error_cache_ttl', 600);

            Cache::put(self::CACHE_KEY, $release, $ttl);
        }

        if ($release['error'] !== null) {
            return $this->result($current, null, null, null, $release['error']);
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
     * The commands that actually perform the update for this install.
     *
     * A Docker install cannot rewrite itself: the image is immutable and
     * public/ is baked into the nginx image at build time, so an app container
     * that replaced its own files would serve new markup with stale assets.
     * The new image is pulled on the host instead; its app container runs the
     * guarded `modulo:upgrade` on boot.
     *
     * @return array<int, string>
     */
    public function upgradeCommands(?string $version = null): array
    {
        $version = $version !== null && $version !== '' ? Version::normalize($version) : null;
        $target = $version ?? '<version>';

        return match (InstallChannel::detect()) {
            InstallChannel::DOCKER => [
                '# From the folder with docker-compose.yml (backs up, pulls, migrates, checks health):',
                './modulo update'.($version !== null ? ' '.$version : ''),
                '',
                '# Or by hand:',
                "sed -i 's/^MODULO_TAG=.*/MODULO_TAG={$target}/' .env",
                'docker compose pull',
                'docker compose up -d',
                '# Only needed when RUN_MIGRATIONS is not "true" in .env:',
                'docker compose exec app php artisan modulo:upgrade',
            ],
            InstallChannel::GIT => [
                "git fetch --tags && git checkout v{$target}",
                'composer install --no-dev --optimize-autoloader',
                'npm ci && npm run build',
                'php artisan modulo:upgrade',
            ],
            default => [
                "# Download modulo-cms-{$target}.tar.gz and its .sha256 from the release page,",
                '# verify it (sha256sum -c), and unpack it over the site keeping .env, storage/ and plugins/.',
                'php artisan modulo:upgrade',
            ],
        };
    }

    /**
     * @return array{version: string, url: string|null, published_at: string|null, error: string|null}
     */
    protected function fetchLatestRelease(): array
    {
        // GitHub's /releases/latest never returns a prerelease, so following
        // prereleases means reading the (newest-first) release list instead.
        $includePrereleases = (bool) config('updates.include_prereleases');
        $endpoint = str_replace(
            ':repository',
            (string) config('updates.repository'),
            (string) config($includePrereleases ? 'updates.list_endpoint' : 'updates.endpoint'),
        );

        try {
            // Same shape as SearchEnginePingingService, the only other outbound
            // call in the application: short timeout, failure is not fatal.
            $response = Http::timeout((int) config('updates.timeout'))
                ->withHeaders(['Accept' => 'application/vnd.github+json'])
                ->get($endpoint);

            if ($response->status() === 429
                || ($response->status() === 403 && $response->header('X-RateLimit-Remaining') === '0')) {
                return $this->failure('GitHub rate limit reached; the check will be retried shortly.');
            }

            if (! $response->successful()) {
                return $this->failure('Update server returned '.$response->status().'.');
            }

            $payload = $response->json();
        } catch (Throwable $e) {
            return $this->failure($e->getMessage());
        }

        if ($includePrereleases && is_array($payload) && array_is_list($payload)) {
            $payload = collect($payload)->first(fn ($release) => is_array($release) && ! ($release['draft'] ?? false));
        }

        if (! is_array($payload) || ! isset($payload['tag_name'])) {
            return $this->failure('Unexpected response from the update server.');
        }

        if (($payload['prerelease'] ?? false) && ! $includePrereleases) {
            return $this->failure('Latest release is a prerelease.');
        }

        return [
            'version' => Version::normalize((string) $payload['tag_name']),
            'url' => isset($payload['html_url']) ? (string) $payload['html_url'] : null,
            'published_at' => isset($payload['published_at']) ? (string) $payload['published_at'] : null,
            'error' => null,
        ];
    }

    /**
     * @return array{version: string, url: null, published_at: null, error: string}
     */
    protected function failure(string $error): array
    {
        return ['version' => '', 'url' => null, 'published_at' => null, 'error' => $error];
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
