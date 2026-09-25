<?php

use App\Console\Commands\CheckUpdatesCommand;
use App\Models\Plugin;
use App\Models\User;
use App\Notifications\UpdatesAvailable;
use App\Services\Plugins\PluginRegistry;
use App\Services\UpdateCenter;
use App\Services\UpdateChecker;
use App\Support\SystemMeta;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Cache::forget(UpdateChecker::CACHE_KEY);
    Cache::forget(PluginRegistry::CACHE_KEY);
    Cache::forget(UpdateCenter::PENDING_CACHE_KEY);

    config([
        'updates.enabled' => true,
        'updates.repository' => 'owner/repo',
        'version.version' => '1.0.0',
        'plugins.registry_url' => 'https://raw.githubusercontent.com/owner/registry/main/registry.json',
    ]);
});

/**
 * A core release (with release.json) and a registry offering one plugin.
 */
function fakeUpdateSources(string $core = 'v1.2.0', array $manifest = [], string $pluginVersion = '2.0.0'): void
{
    Http::fake([
        'api.github.com/*' => Http::response([
            'tag_name' => $core,
            'html_url' => 'https://github.com/owner/repo/releases/tag/'.$core,
            'published_at' => '2026-09-01T00:00:00Z',
            'body' => 'Release notes',
            'assets' => [[
                'name' => 'release.json',
                'browser_download_url' => 'https://github.com/owner/repo/releases/download/'.$core.'/release.json',
            ]],
        ]),
        'github.com/owner/repo/releases/download/*' => Http::response(array_merge([
            'schema' => 1,
            'security' => false,
            'breaking' => false,
            'requirements' => ['php' => '^8.2', 'postgres' => '>=16'],
        ], $manifest)),
        'raw.githubusercontent.com/*' => Http::response([
            'schema' => 1,
            'plugins' => [[
                'slug' => 'fixture',
                'namespace' => 'Fixture',
                'latest' => [
                    'version' => $pluginVersion,
                    'asset_url' => 'https://github.com/owner/fixture/releases/download/v'.$pluginVersion.'/fixture.zip',
                    'sha256' => str_repeat('a', 64),
                ],
            ]],
        ]),
    ]);
}

function makePluginRow(array $attributes): Plugin
{
    return Plugin::create($attributes + [
        'name' => ucfirst($attributes['slug']),
        'description' => 'Fixture',
        'author' => 'Tests',
        'service_provider' => 'Plugins\\Fixture\\FixtureServiceProvider',
        'is_active' => false,
    ]);
}

function makeSiteAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate('admin', 'web'));

    return $user;
}

it('reads security flags and requirements from the release manifest', function () {
    fakeUpdateSources(manifest: ['security' => true, 'breaking' => true, 'requirements' => ['php' => '^99.0']]);

    $result = app(UpdateChecker::class)->check();

    expect($result['available'])->toBeTrue()
        ->and($result['security'])->toBeTrue()
        ->and($result['breaking'])->toBeTrue()
        ->and($result['notes'])->toBe('Release notes')
        ->and($result['unmet_requirements'])->toHaveCount(1)
        ->and($result['unmet_requirements'][0])->toContain('PHP 99.0');
});

it('still reports an update when a release has no manifest', function () {
    Http::fake(['api.github.com/*' => Http::response(['tag_name' => 'v1.1.0'])]);

    $result = app(UpdateChecker::class)->check();

    expect($result['available'])->toBeTrue()
        ->and($result['security'])->toBeFalse()
        ->and($result['unmet_requirements'])->toBe([]);
});

it('records available plugin updates and counts them without a network request', function () {
    makePluginRow(['slug' => 'fixture', 'name' => 'Fixture', 'version' => '1.0.0']);
    fakeUpdateSources();

    $result = app(UpdateCenter::class)->refresh();

    expect($result['plugins'])->toHaveCount(1)
        ->and(Plugin::where('slug', 'fixture')->value('available_version'))->toBe('2.0.0')
        ->and(SystemMeta::get(UpdateCenter::LAST_CHECKED_KEY))->not->toBeNull();

    Http::fake();
    expect(app(UpdateCenter::class)->pending())->toBe(['count' => 2, 'security' => false]);
    Http::assertNothingSent();
});

it('clears a stale available version once the registry no longer offers it', function () {
    makePluginRow(['slug' => 'fixture', 'version' => '2.0.0', 'available_version' => '1.5.0']);
    fakeUpdateSources(pluginVersion: '2.0.0');

    app(UpdateCenter::class)->refresh();

    expect(Plugin::where('slug', 'fixture')->value('available_version'))->toBeNull();
});

it('emails administrators once per new set of updates', function () {
    Notification::fake();
    $admin = makeSiteAdmin();
    fakeUpdateSources(manifest: ['security' => true]);

    $this->artisan('modulo:check-updates')->expectsOutputToContain('security release')->assertSuccessful();
    $this->artisan('modulo:check-updates')->assertSuccessful();

    Notification::assertSentToTimes($admin, UpdatesAvailable::class, 1);
    expect(SystemMeta::get(CheckUpdatesCommand::NOTIFIED_KEY))->not->toBeNull();
});

it('does not email when there is nothing to update', function () {
    Notification::fake();
    makeSiteAdmin();
    fakeUpdateSources(core: 'v1.0.0');

    $this->artisan('modulo:check-updates')->assertSuccessful();

    Notification::assertNothingSent();
});

it('shows the updates page to administrators only', function () {
    fakeUpdateSources();

    $this->actingAs(makeSiteAdmin())
        ->get(route('dashboard.admin.system.updates'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('adminSection', 'updates')
            ->where('updateCenter.core.latest', '1.2.0'));

    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->get(route('dashboard.admin.system.updates'))
        ->assertForbidden();
});

it('lets the check be run from the admin', function () {
    fakeUpdateSources();

    $this->actingAs(makeSiteAdmin())
        ->post(route('dashboard.admin.system.updates.check'))
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(SystemMeta::get(UpdateCenter::LAST_CHECKED_KEY))->not->toBeNull();
});

it('refuses plugin updates to users who cannot install plugins', function () {
    makePluginRow(['slug' => 'fixture', 'version' => '1.0.0']);

    $this->actingAs(makeAdminUserWithPermissions(['edit settings']))
        ->post(route('dashboard.admin.system.updates.plugins.update', 'fixture'))
        ->assertForbidden();
});

it('shares the pending count with administrators', function () {
    makePluginRow(['slug' => 'fixture', 'version' => '1.0.0', 'available_version' => '1.1.0']);

    $this->actingAs(makeSiteAdmin())
        ->get(route('dashboard.admin.system.updates'))
        ->assertInertia(fn (AssertableInertia $page) => $page->where('updatesPending.count', 1));
});
