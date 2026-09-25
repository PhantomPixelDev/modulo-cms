<?php

use App\Models\Activity;
use App\Models\Plugin;
use App\Models\User;
use App\Support\ActivityLog;
use Spatie\Permission\Models\Role;

function activityAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate('admin', 'web'));

    return $user;
}

it('records sign-ins and failed attempts', function () {
    $user = User::factory()->create(['password' => bcrypt('secret-password')]);

    $this->post(route('login'), ['email' => $user->email, 'password' => 'wrong-password']);
    $this->post(route('login'), ['email' => $user->email, 'password' => 'secret-password']);

    $failed = Activity::where('event', 'auth.failed')->firstOrFail();
    expect($failed->description)->toContain($user->email)
        ->and($failed->ip_address)->not->toBeNull()
        ->and(Activity::where('event', 'auth.login')->where('user_id', $user->id)->exists())->toBeTrue();
});

it('records who changed a user and what, without secrets', function () {
    $admin = activityAdmin();
    $user = User::factory()->create();
    $this->actingAs($admin);

    $user->update(['name' => 'Renamed', 'password' => bcrypt('another-password')]);

    $entry = Activity::where('event', 'user.updated')->latest('id')->firstOrFail();
    expect($entry->user_id)->toBe($admin->id)
        ->and($entry->subject_id)->toBe($user->id)
        ->and($entry->properties['changed'])->toBe(['name'])
        ->and($entry->properties['secrets_changed'])->toBe(['password'])
        ->and(json_encode($entry->properties))->not->toContain('another-password');
});

it('ignores bookkeeping-only changes', function () {
    $plugin = Plugin::create(['name' => 'Fixture', 'slug' => 'fixture', 'version' => '1.0.0', 'service_provider' => 'Plugins\\Fixture\\FixtureServiceProvider']);
    $before = Activity::count();

    $plugin->update(['last_checked_at' => now(), 'available_version' => '1.1.0']);

    expect(Activity::count())->toBe($before);
});

it('names plugin activation and updates as such', function () {
    $plugin = Plugin::create(['name' => 'Fixture', 'slug' => 'fixture', 'version' => '1.0.0', 'service_provider' => 'Plugins\\Fixture\\FixtureServiceProvider']);

    $plugin->update(['is_active' => true]);
    $plugin->update(['version' => '1.1.0']);

    expect(Activity::where('event', 'plugin.installed')->exists())->toBeTrue()
        ->and(Activity::where('event', 'plugin.activated')->exists())->toBeTrue()
        ->and(Activity::where('event', 'plugin.updated')->value('properties'))->toBe(['from' => '1.0.0', 'to' => '1.1.0']);
});

it('drops secrets from explicit entries too', function () {
    ActivityLog::record('test.event', 'Something', null, ['password' => 'x', 'nested' => ['token' => 'y', 'ok' => 1]]);

    expect(Activity::where('event', 'test.event')->value('properties'))->toBe(['nested' => ['ok' => 1]]);
});

it('shows the log to administrators, filtered', function () {
    $admin = activityAdmin();
    ActivityLog::record('backup.created', 'Created backup a.zip', null, [], $admin->id);
    ActivityLog::record('settings.updated', 'Updated general settings', null, [], $admin->id);

    $this->actingAs($admin)
        ->get(route('dashboard.admin.system.activity', ['group' => 'backup']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('adminSection', 'activity')
            ->has('activity.entries.data', 1)
            ->where('activity.entries.data.0.event', 'backup.created'));

    $this->actingAs(makeAdminUserWithPermissions(['edit settings']))
        ->get(route('dashboard.admin.system.activity'))
        ->assertForbidden();
});

it('prunes entries past the retention period', function () {
    config(['security.activity_retention_days' => 30]);
    ActivityLog::record('old.event', 'Old');
    Activity::where('event', 'old.event')->update(['created_at' => now()->subDays(31)]);
    ActivityLog::record('new.event', 'New');

    $this->artisan('model:prune', ['--model' => [Activity::class]])->assertSuccessful();

    expect(Activity::where('event', 'old.event')->exists())->toBeFalse()
        ->and(Activity::where('event', 'new.event')->exists())->toBeTrue();
});
