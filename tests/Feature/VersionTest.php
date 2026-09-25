<?php

use App\Support\InstallChannel;
use App\Support\Version;

it('reads the version from the VERSION file', function () {
    expect(trim((string) file_get_contents(base_path('VERSION'))))
        ->not->toBe('')
        ->and(Version::current())->toBeString()->not->toBe('');
});

it('falls back to the development sentinel rather than an empty string', function () {
    config(['version.version' => '   ']);

    expect(Version::current())->toBe(Version::DEV)
        ->and(Version::isDev())->toBeTrue();
});

it('recognises a real version as not being a development build', function () {
    config(['version.version' => '1.4.2']);

    expect(Version::isDev())->toBeFalse()
        ->and(Version::current())->toBe('1.4.2');
});

it('compares versions ignoring a leading v', function () {
    config(['version.version' => '1.4.2']);

    expect(Version::compare('v1.4.2'))->toBe(0)
        ->and(Version::compare('1.4.3'))->toBe(-1)
        ->and(Version::compare('1.4.1'))->toBe(1);
});

it('treats a development build as satisfying every minimum requirement', function () {
    config(['version.version' => Version::DEV]);

    // Failing closed here would make every plugin uninstallable on a working
    // copy; callers surface a warning instead.
    expect(Version::satisfiesMinimum('99.0.0'))->toBeTrue();
});

it('enforces the minimum version on a released build', function () {
    config(['version.version' => '1.2.0']);

    expect(Version::satisfiesMinimum('1.0.0'))->toBeTrue()
        ->and(Version::satisfiesMinimum('1.2.0'))->toBeTrue()
        ->and(Version::satisfiesMinimum('1.3.0'))->toBeFalse()
        ->and(Version::satisfiesMinimum(null))->toBeTrue()
        ->and(Version::satisfiesMinimum(''))->toBeTrue();
});

it('honours an explicitly configured install channel', function () {
    config(['version.channel' => InstallChannel::TARBALL]);

    expect(InstallChannel::detect())->toBe(InstallChannel::TARBALL)
        ->and(InstallChannel::isDocker())->toBeFalse()
        ->and(InstallChannel::canSelfUpdate())->toBeTrue();
});

it('reports that a docker install cannot update itself in place', function () {
    // The image is immutable and public/ is baked into the nginx image at
    // build time.
    config(['version.channel' => InstallChannel::DOCKER]);

    expect(InstallChannel::isDocker())->toBeTrue()
        ->and(InstallChannel::canSelfUpdate())->toBeFalse();
});

it('ignores an unrecognised configured channel and detects instead', function () {
    config(['version.channel' => 'nonsense']);

    expect(InstallChannel::detect())->toBeIn([
        InstallChannel::DOCKER,
        InstallChannel::TARBALL,
        InstallChannel::GIT,
    ]);
});

it('reports the version and channel on the health endpoint', function () {
    $response = $this->getJson('/health');

    $response->assertOk()
        ->assertJsonStructure(['status', 'version', 'channel', 'checks'])
        ->assertJsonPath('version', Version::current());
});

it('shares the build identity with the front end', function () {
    $this->get('/')->assertInertia(
        fn ($page) => $page
            ->has('modulo')
            ->where('modulo.version', Version::current())
            ->where('modulo.isDev', Version::isDev())
    );
});
