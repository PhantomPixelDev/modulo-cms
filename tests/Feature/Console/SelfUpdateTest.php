<?php

use App\Services\SelfUpdater;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Process\Process;

/*
 * modulo:update against a throwaway install folder. The "artisan" in both the
 * old and the new code is a stub that logs how it was called, so the test
 * sees the order of operations without running a real upgrade.
 */

const SELF_UPDATE_ARTISAN_STUB = <<<'PHP'
<?php
$args = implode(' ', array_slice($argv, 1));
file_put_contents(__DIR__.'/storage/artisan.log', basename(__DIR__).':'.trim(file_get_contents(__DIR__.'/VERSION')).' '.$args.PHP_EOL, FILE_APPEND);
if (str_starts_with($args, 'modulo:upgrade') && file_exists(__DIR__.'/storage/fail-upgrade')) {
    fwrite(STDERR, "simulated upgrade failure\n");
    exit(1);
}
exit(0);
PHP;

beforeEach(function () {
    $this->work = storage_path('framework/testing/self-update-'.uniqid());
    $this->root = $this->work.'/site';

    // The running install: 1.0.0 with site-owned files that must survive.
    File::ensureDirectoryExists($this->root.'/app');
    File::ensureDirectoryExists($this->root.'/public/storage');
    File::ensureDirectoryExists($this->root.'/public/themes/modern-react');
    File::ensureDirectoryExists($this->root.'/storage/app');
    File::ensureDirectoryExists($this->root.'/plugins/RuntimePlugin');
    File::put($this->root.'/VERSION', '1.0.0');
    File::put($this->root.'/artisan', SELF_UPDATE_ARTISAN_STUB);
    File::put($this->root.'/app/Old.php', 'old');
    File::put($this->root.'/public/index.php', 'old index');
    File::put($this->root.'/public/themes/modern-react/published.css', 'published');
    File::put($this->root.'/.env', 'APP_KEY=secret');
    File::put($this->root.'/plugins/RuntimePlugin/plugin.json', '{}');

    config(['version.version' => '1.0.0', 'version.channel' => 'tarball', 'updates.repository' => 'owner/repo']);
    app()->instance(SelfUpdater::class, new SelfUpdater($this->root));
});

afterEach(function () {
    File::deleteDirectory($this->work);
});

/**
 * Build modulo-cms-<version>.tar.gz and fake the GitHub release around it.
 */
function fakeRelease(string $version, ?string $wrongChecksum = null): void
{
    $build = test()->work.'/build';
    $package = "{$build}/modulo-cms-{$version}";
    File::deleteDirectory($build);
    File::ensureDirectoryExists($package.'/app');
    File::ensureDirectoryExists($package.'/vendor');
    File::ensureDirectoryExists($package.'/public/build');
    File::ensureDirectoryExists($package.'/plugins/Bundled');
    File::put($package.'/VERSION', $version);
    File::put($package.'/artisan', SELF_UPDATE_ARTISAN_STUB);
    File::put($package.'/app/New.php', 'new');
    File::put($package.'/vendor/autoload.php', '<?php');
    File::put($package.'/public/index.php', 'new index');
    File::put($package.'/public/build/manifest.json', '{}');
    File::put($package.'/plugins/Bundled/plugin.json', '{}');

    $tarball = test()->work."/modulo-cms-{$version}.tar.gz";
    (new Process(['tar', '-czf', $tarball, '-C', $build, "modulo-cms-{$version}"]))->mustRun();
    $bytes = File::get($tarball);
    $sha = hash('sha256', $bytes);

    $base = "https://github.com/owner/repo/releases/download/v{$version}";
    Http::fake([
        "api.github.com/repos/owner/repo/releases/tags/v{$version}" => Http::response(['assets' => [
            ['name' => "modulo-cms-{$version}.tar.gz", 'browser_download_url' => "{$base}/modulo-cms-{$version}.tar.gz"],
            ['name' => "modulo-cms-{$version}.tar.gz.sha256", 'browser_download_url' => "{$base}/modulo-cms-{$version}.tar.gz.sha256"],
            ['name' => 'release.json', 'browser_download_url' => "{$base}/release.json"],
        ]]),
        "{$base}/modulo-cms-{$version}.tar.gz.sha256" => Http::response(($wrongChecksum ?? $sha)."  modulo-cms-{$version}.tar.gz\n"),
        "{$base}/release.json" => Http::response(['version' => $version, 'requirements' => ['php' => '>=8.2'], 'artifacts' => ['tarball' => ['sha256' => $wrongChecksum ?? $sha]]]),
        "{$base}/modulo-cms-{$version}.tar.gz" => Http::response($bytes),
    ]);
}

function artisanLog(): array
{
    $path = test()->root.'/storage/artisan.log';

    return File::exists($path) ? array_values(array_filter(explode(PHP_EOL, File::get($path)))) : [];
}

it('replaces the code, keeps the site files, and upgrades with the new code', function () {
    fakeRelease('1.1.0');

    $this->artisan('modulo:update', ['version' => '1.1.0', '--force' => true])
        ->expectsOutputToContain('Updated to 1.1.0')
        ->assertSuccessful();

    expect(File::get($this->root.'/VERSION'))->toBe('1.1.0')
        ->and(File::exists($this->root.'/app/New.php'))->toBeTrue()
        ->and(File::exists($this->root.'/app/Old.php'))->toBeFalse()
        ->and(File::get($this->root.'/public/index.php'))->toBe('new index')
        // Site-owned: untouched.
        ->and(File::get($this->root.'/.env'))->toBe('APP_KEY=secret')
        ->and(File::exists($this->root.'/public/storage'))->toBeTrue()
        ->and(File::get($this->root.'/public/themes/modern-react/published.css'))->toBe('published')
        ->and(File::exists($this->root.'/plugins/RuntimePlugin/plugin.json'))->toBeTrue()
        // Bundled plugins are synced, not dropped over plugins/.
        ->and(File::exists($this->root.'/plugins/Bundled'))->toBeFalse();

    $log = artisanLog();
    expect($log[0])->toBe('site:1.0.0 down --retry=60')
        ->and($log[1])->toStartWith('site:1.1.0 plugin:sync-bundled --from=')
        ->and($log[2])->toBe('site:1.1.0 modulo:upgrade --no-interaction')
        ->and(end($log))->toBe('site:1.1.0 up');
});

it('rolls the code back to the previous version', function () {
    fakeRelease('1.1.0');
    $this->artisan('modulo:update', ['version' => '1.1.0', '--force' => true])->assertSuccessful();

    $this->artisan('modulo:update', ['--rollback' => true, '--force' => true])
        ->expectsOutputToContain('rolled back to 1.0.0')
        ->assertSuccessful();

    expect(File::get($this->root.'/VERSION'))->toBe('1.0.0')
        ->and(File::exists($this->root.'/app/Old.php'))->toBeTrue()
        // Added by the release, so removed by the rollback.
        ->and(File::exists($this->root.'/app/New.php'))->toBeFalse()
        ->and(File::exists($this->root.'/vendor'))->toBeFalse()
        ->and(File::get($this->root.'/public/index.php'))->toBe('old index')
        ->and(File::get($this->root.'/.env'))->toBe('APP_KEY=secret');
});

it('changes nothing when the download does not match the checksum', function () {
    fakeRelease('1.1.0', wrongChecksum: str_repeat('0', 64));

    $this->artisan('modulo:update', ['version' => '1.1.0', '--force' => true])
        ->expectsOutputToContain('does not match')
        ->assertFailed();

    expect(File::get($this->root.'/VERSION'))->toBe('1.0.0')
        ->and(artisanLog())->toBe([]);
});

it('leaves the site in maintenance when the upgrade fails', function () {
    fakeRelease('1.1.0');
    File::put($this->root.'/storage/fail-upgrade', '1');

    $this->artisan('modulo:update', ['version' => '1.1.0', '--force' => true])
        ->expectsOutputToContain('stays in maintenance mode')
        ->assertFailed();

    $log = artisanLog();
    expect(end($log))->toBe('site:1.1.0 modulo:upgrade --no-interaction');
});

it('refuses a downgrade and non-tarball installs', function () {
    $this->artisan('modulo:update', ['version' => '0.9.0', '--force' => true])
        ->expectsOutputToContain('not newer')
        ->assertFailed();

    config(['version.channel' => 'docker']);
    $this->artisan('modulo:update', ['--force' => true])
        ->expectsOutputToContain('./modulo update')
        ->assertFailed();
});
