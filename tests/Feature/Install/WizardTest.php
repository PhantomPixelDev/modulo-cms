<?php

use App\Models\User;
use App\Services\InstallService;
use App\Services\SiteSettingsService;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    // These tests are about the uninstalled state, which the suite otherwise
    // suppresses so the redirect does not swallow unrelated requests.
    markNotInstalled();
});

afterEach(function () {
    markInstalled();
});

it('serves the wizard while no account exists', function () {
    $this->get('/install')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('install/Index')->has('requirements'));
});

it('sends an unconfigured site to the wizard', function () {
    $this->get('/')->assertRedirect('/install');
});

it('keeps the health endpoint reachable before installation', function () {
    // An orchestrator polls this to decide whether the container is alive, so
    // it must not be redirected into the installer.
    $this->getJson('/health')->assertOk()->assertJsonStructure(['status', 'version']);
});

it('answers API callers with 503 rather than a redirect', function () {
    $this->getJson('/api/menus/slug/anything')
        ->assertStatus(503)
        ->assertJsonStructure(['message', 'install_url']);
});

it('creates the first administrator as a super admin', function () {
    // The real flow gets roles from the database step; seed them directly so
    // this test is not entangled with running migrations inside a request.
    $this->seed(RolePermissionSeeder::class);

    $this->post('/install/administrator', [
        'name' => 'First Admin',
        'email' => 'first@example.test',
        'password' => 'a-sufficiently-long-password',
        'password_confirmation' => 'a-sufficiently-long-password',
    ])->assertRedirect();

    $user = User::where('email', 'first@example.test')->firstOrFail();

    expect($user->hasRole('super-admin'))->toBeTrue()
        ->and($user->is_admin)->toBeTrue()
        ->and($user->can('access admin'))->toBeTrue();
});

it('refuses to create a second account through the installer', function () {
    // The route is unauthenticated; the only thing protecting it is that it
    // stops working once anyone exists.
    markInstalling();
    User::factory()->create();

    $this->post('/install/administrator', [
        'name' => 'Intruder',
        'email' => 'intruder@example.test',
        'password' => 'a-sufficiently-long-password',
        'password_confirmation' => 'a-sufficiently-long-password',
    ])->assertSessionHasErrors('install');

    expect(User::where('email', 'intruder@example.test')->exists())->toBeFalse();
});

it('refuses to create an administrator before the database step', function () {
    // Otherwise the account is created with no role and cannot sign in anywhere.
    $this->post('/install/administrator', [
        'name' => 'Premature',
        'email' => 'premature@example.test',
        'password' => 'a-sufficiently-long-password',
        'password_confirmation' => 'a-sufficiently-long-password',
    ])->assertSessionHasErrors('install');
});

it('rejects a weak administrator password', function () {
    $this->post('/install/administrator', [
        'name' => 'Weak',
        'email' => 'weak@example.test',
        'password' => 'short',
        'password_confirmation' => 'short',
    ])->assertSessionHasErrors('password');

    expect(User::count())->toBe(0);
});

it('will not finish without an administrator', function () {
    // Finishing early would close the installer on a site nobody can log into.
    $this->post('/install/finish')->assertSessionHasErrors('install');

    expect(app(InstallService::class)->isInstalled())->toBeFalse();
});

it('closes itself once installation finishes', function () {
    markInstalling();
    User::factory()->create();

    $this->post('/install/finish')->assertRedirect('/login');

    expect(app(InstallService::class)->isInstalled())->toBeTrue();

    $this->get('/install')->assertNotFound();
    $this->post('/install/administrator', [])->assertNotFound();
});

it('treats an existing site with users as already installed', function () {
    // An install that predates the wizard has no lock file but plenty of users.
    User::factory()->create();

    expect(app(InstallService::class)->isInstalled())->toBeTrue();

    $this->get('/install')->assertNotFound();
});

it('applies the site settings collected by the wizard', function () {
    markInstalling();
    User::factory()->create();

    $this->post('/install/configure', [
        'site_name' => 'Wizard Configured Site',
        'site_description' => 'Set during setup',
        'timezone' => 'Europe/Warsaw',
    ])->assertRedirect();

    expect(app(SiteSettingsService::class)->get('site_name'))
        ->toBe('Wizard Configured Site');
});

it('does not seed demo content unless it was asked for', function () {
    markInstalling();
    User::factory()->create();

    $this->post('/install/configure', [
        'site_name' => 'Clean Site',
        'timezone' => 'UTC',
    ])->assertRedirect();

    // Demo accounts carry documented passwords; they must never appear by default.
    expect(User::where('email', 'admin@example.com')->exists())->toBeFalse();
});
