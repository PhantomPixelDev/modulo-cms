<?php

namespace App\Services;

use App\Support\InstallChannel;
use App\Support\Version;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use PDO;
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
     *     security: bool,
     *     breaking: bool,
     *     requires_migrations: bool,
     *     notes: string|null,
     *     requirements: array<string, string>,
     *     unmet_requirements: array<int, string>,
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
            $release,
        );
    }

    /**
     * The last check's result without making a request: null when nothing is
     * cached. For places that run on every page load (the sidebar badge).
     *
     * @return array<string, mixed>|null
     */
    public function cached(): ?array
    {
        if (! config('updates.enabled') || Version::isDev()) {
            return null;
        }

        $release = Cache::get(self::CACHE_KEY);

        if (! is_array($release) || ($release['error'] ?? null) !== null) {
            return null;
        }

        return $this->result(Version::current(), $release['version'] ?? null, $release['url'] ?? null, $release['published_at'] ?? null, null, $release);
    }

    /**
     * Requirements from a release manifest this server does not meet.
     *
     * Constraints are Composer-style (`^8.2`, `>=16`); the lowest version they
     * name is treated as the minimum, which is all a release ever asks for.
     *
     * @param  array<string, mixed>  $requirements
     * @return array<int, string>
     */
    public function unmetRequirements(array $requirements): array
    {
        $unmet = [];

        $php = $requirements['php'] ?? null;
        if (is_string($php) && ($minimum = $this->minimumOf($php)) !== null && version_compare(PHP_VERSION, $minimum, '<')) {
            $unmet[] = "PHP {$minimum} or newer (this server runs ".PHP_VERSION.')';
        }

        $postgres = $requirements['postgres'] ?? null;
        if (is_string($postgres) && ($minimum = $this->minimumOf($postgres)) !== null && ($running = $this->postgresVersion()) !== null
            && version_compare($running, $minimum, '<')) {
            $unmet[] = "PostgreSQL {$minimum} or newer (the database runs {$running})";
        }

        return $unmet;
    }

    protected function minimumOf(string $constraint): ?string
    {
        return preg_match('/(\d+(?:\.\d+){0,2})/', $constraint, $m) === 1 ? $m[1] : null;
    }

    protected function postgresVersion(): ?string
    {
        try {
            $connection = DB::connection();

            if ($connection->getDriverName() !== 'pgsql') {
                return null;
            }

            $version = (string) $connection->getPdo()->getAttribute(PDO::ATTR_SERVER_VERSION);

            return preg_match('/^(\d+(?:\.\d+)?)/', $version, $m) === 1 ? $m[1] : null;
        } catch (Throwable) {
            return null;
        }
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
                '# Downloads and verifies the release, backs up, swaps the code and migrates:',
                'php artisan modulo:update'.($version !== null ? ' '.$version : ''),
                '',
                '# Undo the code swap if needed (restore the backup too if it migrated):',
                'php artisan modulo:update --rollback',
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

        $manifest = $this->fetchManifest($payload);

        return [
            'version' => Version::normalize((string) $payload['tag_name']),
            'url' => isset($payload['html_url']) ? (string) $payload['html_url'] : null,
            'published_at' => isset($payload['published_at']) ? (string) $payload['published_at'] : null,
            'error' => null,
            'notes' => isset($payload['body']) && is_string($payload['body']) ? mb_substr($payload['body'], 0, 20000) : null,
            'security' => (bool) ($manifest['security'] ?? false),
            'breaking' => (bool) ($manifest['breaking'] ?? false),
            'requires_migrations' => (bool) ($manifest['requires_migrations'] ?? false),
            'requirements' => array_filter(
                is_array($manifest['requirements'] ?? null) ? $manifest['requirements'] : [],
                fn ($value, $key) => is_string($key) && is_string($value),
                ARRAY_FILTER_USE_BOTH,
            ),
        ];
    }

    /**
     * The release.json published with every release since 1.x: security and
     * breaking flags plus server requirements. Older releases have none, and
     * a manifest that cannot be read only costs those extras.
     *
     * @param  array<string, mixed>  $release
     * @return array<string, mixed>
     */
    protected function fetchManifest(array $release): array
    {
        $asset = collect(is_array($release['assets'] ?? null) ? $release['assets'] : [])
            ->first(fn ($asset) => is_array($asset) && ($asset['name'] ?? null) === 'release.json');

        $url = is_array($asset) ? ($asset['browser_download_url'] ?? null) : null;

        if (! is_string($url) || ! str_starts_with($url, 'https://')) {
            return [];
        }

        try {
            $response = Http::timeout((int) config('updates.timeout'))->accept('application/json')->get($url);
            $manifest = $response->successful() ? $response->json() : null;
        } catch (Throwable) {
            return [];
        }

        return is_array($manifest) ? $manifest : [];
    }

    /**
     * @return array{version: string, url: null, published_at: null, error: string}
     */
    protected function failure(string $error): array
    {
        return ['version' => '', 'url' => null, 'published_at' => null, 'error' => $error];
    }

    /**
     * @param  array<string, mixed>  $release
     * @return array{checked: bool, current: string, latest: string|null, available: bool, url: string|null, published_at: string|null, error: string|null, security: bool, breaking: bool, requires_migrations: bool, notes: string|null, requirements: array<string, string>, unmet_requirements: array<int, string>}
     */
    protected function result(string $current, ?string $latest, ?string $url, ?string $publishedAt, ?string $error, array $release = []): array
    {
        $available = $latest !== null
            && $latest !== ''
            && version_compare($latest, Version::normalize($current), '>');

        /** @var array<string, string> $requirements */
        $requirements = is_array($release['requirements'] ?? null) ? $release['requirements'] : [];

        return [
            'checked' => $error === null,
            'current' => $current,
            'latest' => $latest !== '' ? $latest : null,
            'available' => $available,
            'url' => $url,
            'published_at' => $publishedAt,
            'error' => $error,
            'security' => $available && (bool) ($release['security'] ?? false),
            'breaking' => $available && (bool) ($release['breaking'] ?? false),
            'requires_migrations' => $available && (bool) ($release['requires_migrations'] ?? false),
            'notes' => $available && is_string($release['notes'] ?? null) ? $release['notes'] : null,
            'requirements' => $requirements,
            'unmet_requirements' => $available ? $this->unmetRequirements($requirements) : [],
        ];
    }
}
