<?php

use App\Models\User;
use App\Services\UpdateChecker;
use App\Support\InstallChannel;
use App\Support\Version;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::forget(UpdateChecker::CACHE_KEY);
    config(['updates.enabled' => true, 'updates.repository' => 'owner/repo']);
});

function releaseResponse(string $tag, bool $prerelease = false): array
{
    return [
        'tag_name' => $tag,
        'prerelease' => $prerelease,
        'html_url' => 'https://github.com/owner/repo/releases/tag/'.$tag,
        'published_at' => '2026-09-01T00:00:00Z',
    ];
}

it('reports an update when the released version is newer', function () {
    config(['version.version' => '1.0.0']);
    Http::fake(['api.github.com/*' => Http::response(releaseResponse('v1.4.0'))]);

    $result = app(UpdateChecker::class)->check();

    expect($result['available'])->toBeTrue()
        ->and($result['latest'])->toBe('1.4.0')
        ->and($result['current'])->toBe('1.0.0')
        ->and($result['error'])->toBeNull();
});

it('reports no update when running the newest release', function () {
    config(['version.version' => '1.4.0']);
    Http::fake(['api.github.com/*' => Http::response(releaseResponse('v1.4.0'))]);

    expect(app(UpdateChecker::class)->check()['available'])->toBeFalse();
});

it('does not offer a downgrade', function () {
    config(['version.version' => '2.0.0']);
    Http::fake(['api.github.com/*' => Http::response(releaseResponse('v1.4.0'))]);

    expect(app(UpdateChecker::class)->check()['available'])->toBeFalse();
});

it('skips the check entirely on a development build', function () {
    config(['version.version' => Version::DEV]);
    Http::fake();

    $result = app(UpdateChecker::class)->check();

    expect($result['available'])->toBeFalse();
    // Telling someone their working copy is out of date is noise, and there is
    // no meaningful version to compare anyway.
    Http::assertNothingSent();
});

it('ignores a prerelease by default', function () {
    config(['version.version' => '1.0.0']);
    Http::fake(['api.github.com/*' => Http::response(releaseResponse('v2.0.0-rc.1', prerelease: true))]);

    expect(app(UpdateChecker::class)->check()['available'])->toBeFalse();
});

it('survives an unreachable update server', function () {
    config(['version.version' => '1.0.0']);
    Http::fake(['api.github.com/*' => Http::response('', 503)]);

    $result = app(UpdateChecker::class)->check();

    // A failed check must never take the admin down with it.
    expect($result['available'])->toBeFalse()
        ->and($result['error'])->not->toBeNull()
        ->and($result['current'])->toBe('1.0.0');
});

it('caches the answer rather than asking on every page load', function () {
    config(['version.version' => '1.0.0']);
    Http::fake(['api.github.com/*' => Http::response(releaseResponse('v1.4.0'))]);

    $checker = app(UpdateChecker::class);
    $checker->check();
    $checker->check();
    $checker->check();

    // The GitHub API is rate limited by IP, so this is a correctness concern
    // rather than an optimisation.
    Http::assertSentCount(1);
});

it('re-asks when the check is forced', function () {
    config(['version.version' => '1.0.0']);
    Http::fake(['api.github.com/*' => Http::response(releaseResponse('v1.4.0'))]);

    $checker = app(UpdateChecker::class);
    $checker->check();
    $checker->check(force: true);

    Http::assertSentCount(2);
});

it('tells a docker install to replace the image rather than update in place', function () {
    config(['version.channel' => InstallChannel::DOCKER]);

    $commands = app(UpdateChecker::class)->upgradeCommands();

    expect(implode(' ', $commands))->toContain('compose pull')
        ->and(implode(' ', $commands))->toContain('modulo:upgrade');
});

it('tells a git install to check out the tag and rebuild', function () {
    config(['version.channel' => InstallChannel::GIT]);

    expect(implode(' ', app(UpdateChecker::class)->upgradeCommands()))
        ->toContain('git fetch')
        ->toContain('npm run build');
});

it('does not expose the update endpoint to guests', function () {
    $this->getJson('/dashboard/admin/updates')->assertUnauthorized();
});

it('does not expose the update endpoint to users without settings access', function () {
    $this->actingAs(User::factory()->create());

    $this->getJson('/dashboard/admin/updates')->assertForbidden();
});

it('reports availability and the channel-specific commands to an administrator', function () {
    config(['version.version' => '1.0.0', 'version.channel' => InstallChannel::DOCKER]);
    Http::fake(['api.github.com/*' => Http::response(releaseResponse('v1.5.0'))]);

    $this->actingAs(makeAdminUserWithPermissions(['edit settings']));

    $this->getJson('/dashboard/admin/updates')
        ->assertOk()
        ->assertJsonPath('update.available', true)
        ->assertJsonPath('update.latest', '1.5.0')
        ->assertJsonPath('canSelfUpdate', false)
        ->assertJsonStructure(['update', 'channel', 'commands', 'canSelfUpdate']);
});

it('retries a failed check after a short while instead of hiding updates for hours', function () {
    config(['version.version' => '1.0.0', 'updates.error_cache_ttl' => 600]);
    Http::fakeSequence('api.github.com/*')
        ->push('', 503)
        ->push(releaseResponse('v1.4.0'));

    $checker = app(UpdateChecker::class);

    expect($checker->check()['error'])->not->toBeNull();

    // Within the error window the failure is reused, so a rate limit is not
    // made worse by every admin page load...
    $checker->check();
    Http::assertSentCount(1);

    // ...but once it passes, the check runs again and finds the release.
    $this->travel(11)->minutes();

    expect($checker->check()['available'])->toBeTrue();
    Http::assertSentCount(2);
});

it('explains a GitHub rate limit rather than reporting a bare 403', function () {
    config(['version.version' => '1.0.0']);
    Http::fake(['api.github.com/*' => Http::response(['message' => 'API rate limit exceeded'], 403, ['X-RateLimit-Remaining' => '0'])]);

    expect(app(UpdateChecker::class)->check()['error'])->toContain('rate limit');
});

it('offers a prerelease when the site opts in to them', function () {
    config(['version.version' => '1.0.0', 'updates.include_prereleases' => true]);
    Http::fake(['api.github.com/*' => Http::response([
        ['tag_name' => 'v2.0.0-rc.2', 'draft' => true, 'prerelease' => true],
        releaseResponse('v2.0.0-rc.1', prerelease: true),
        releaseResponse('v1.4.0'),
    ])]);

    $result = app(UpdateChecker::class)->check();

    // The draft is skipped; the newest published prerelease is offered.
    expect($result['available'])->toBeTrue()
        ->and($result['latest'])->toBe('2.0.0-rc.1');
});

it('names the release to install in the upgrade commands', function () {
    config(['version.channel' => InstallChannel::DOCKER]);
    expect(implode("\n", app(UpdateChecker::class)->upgradeCommands('v1.5.0')))
        ->toContain('./modulo update 1.5.0')
        ->toContain('MODULO_TAG=1.5.0');

    config(['version.channel' => InstallChannel::GIT]);
    expect(implode("\n", app(UpdateChecker::class)->upgradeCommands('1.5.0')))
        ->toContain('git checkout v1.5.0');
});
