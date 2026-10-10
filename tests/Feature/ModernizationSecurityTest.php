<?php

use App\Models\ApiToken;
use App\Models\Post;
use App\Models\PostType;
use App\Models\User;
use App\Services\InstallOwnership;
use App\Services\MailSettings;
use App\Services\Plugins\PackageDownloader;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Role;

it('rejects every dangerous demo request before controller validation', function (string $method, string $path) {
    config(['demo.enabled' => true]);
    Role::findOrCreate('super-admin', 'web');
    $user = User::factory()->create();
    $user->assignRole('super-admin');
    $this->actingAs($user)->call($method, $path)->assertForbidden();
})->with([
    ['GET', '/dashboard/admin/system/backups'],
    ['GET', '/%64ashboard/admin/system/backups'],
    ['POST', '/%64ashboard/admin/plugins/install'],
    ['POST', '/dashboard/admin/system/backups/upload'],
    ['POST', '/dashboard/admin/system/backups/example/restore'],
    ['POST', '/dashboard/admin/plugins/install'],
    ['POST', '/dashboard/admin/themes/registry/install'],
    ['GET', '/dashboard/admin/users'],
    ['POST', '/dashboard/admin/roles'],
    ['POST', '/settings/api-tokens'],
    ['PUT', '/settings/password'],
    ['POST', '/forgot-password'],
    ['POST', '/reset-password'],
    ['POST', '/%72eset-password'],
    ['PATCH', '/settings/profile'],
    ['PUT', '/dashboard/admin/system/email'],
]);

it('does not issue public demo password reset links to guests', function () {
    config(['demo.enabled' => true]);
    Notification::fake();
    $user = User::factory()->create();
    $this->post('/forgot-password', ['email' => $user->email])->assertForbidden();
    Notification::assertNothingSent();
    $this->assertDatabaseCount('password_reset_tokens', 0);
});

it('rejects even a valid public demo password reset token without changing credentials', function () {
    config(['demo.enabled' => true]);
    $user = User::factory()->create();
    $original = $user->password;
    $token = Password::createToken($user);
    $this->post('/reset-password', [
        'email' => $user->email, 'token' => $token,
        'password' => 'Replacement-password-2026!',
        'password_confirmation' => 'Replacement-password-2026!',
    ])->assertForbidden();
    expect($user->fresh()->password)->toBe($original)
        ->and(Password::tokenExists($user, $token))->toBeTrue();
});

it('keeps editing available on the public demo', function () {
    config(['demo.enabled' => true]);
    $user = makeAdminUserWithPermissions(['create posts']);
    $type = PostType::factory()->create();
    $this->actingAs($user)->post('/dashboard/admin/posts', [
        'title' => 'Visitor draft', 'content' => 'Text', 'status' => 'draft', 'post_type_id' => $type->id,
    ])->assertSessionHasNoErrors();
    expect(Post::where('title', 'Visitor draft')->exists())->toBeTrue();
});

it('keeps public demo email away from configured external transports', function () {
    config(['demo.enabled' => true, 'mail.default' => 'smtp']);
    app(MailSettings::class)->apply();
    expect(config('mail.default'))->toBe('log');
});

it('requires a recently confirmed password to install executable packages', function () {
    $this->actingAs(makeAdminUserWithPermissions(['install plugins']))
        ->post('/dashboard/admin/plugins/install', ['slug' => 'example'])
        ->assertRedirect(route('password.confirm'));
});

it('checks publication permissions for date-only API writes', function () {
    $type = PostType::factory()->create(['name' => 'post', 'slug' => 'post']);
    $writer = makeAdminUserWithPermissions(['edit posts']);
    [, $plain] = ApiToken::issue($writer, 'write', ['write']);
    $post = Post::factory()->create(['post_type_id' => $type->id, 'status' => 'published', 'published_at' => now()->addDay()]);
    $original = $post->published_at;
    $this->patchJson('/api/v1/posts/'.$post->id, ['published_at' => now()->subMinute()->toIso8601String()], ['Authorization' => 'Bearer '.$plain])
        ->assertUnprocessable()->assertJsonValidationErrors('status');
    expect($post->fresh()->published_at->equalTo($original))->toBeTrue();
    $this->patchJson('/api/v1/posts/'.$post->id, ['title' => 'Scheduled typo fixed'], ['Authorization' => 'Bearer '.$plain])->assertOk();
});

it('rejects explicit release of scheduled editor content by a writer', function () {
    $type = PostType::factory()->create();
    $writer = makeAdminUserWithPermissions(['edit posts']);
    $post = Post::factory()->create(['post_type_id' => $type->id, 'status' => 'published', 'published_at' => now()->addDay()]);
    $this->actingAs($writer)->put('/dashboard/admin/posts/'.$post->id, [
        'title' => $post->title, 'content' => 'Text', 'post_type_id' => $type->id, 'editor_action' => 'publish',
    ])->assertSessionHasErrors('status');
});

it('enforces two-factor enrollment on legacy plugin routes and bearer tokens', function () {
    config(['security.require_two_factor_for_admins' => true]);
    Role::findOrCreate('admin', 'web');
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    Route::middleware('web')->get('/dashboard/admin/legacy-plugin', fn () => response('secret'));
    $this->actingAs($admin)->get('/dashboard/admin/legacy-plugin')->assertRedirect(route('two-factor.edit'));
    $this->getJson('/settings/api-tokens')->assertForbidden()->assertJsonPath('code', 'two_factor_required');
    [, $plain] = ApiToken::issue($admin, 'legacy', ['read']);
    $this->getJson('/api/v1/posts', ['Authorization' => 'Bearer '.$plain])->assertForbidden()->assertJsonPath('code', 'two_factor_required');
});

it('requires an operator token and refuses a second installer session', function () {
    markNotInstalled();
    $ownership = app(InstallOwnership::class);
    try {
        $this->post('/install/configure', ['site_name' => 'Unclaimed', 'timezone' => 'UTC'])->assertForbidden();
        $this->get('/install')->assertInertia(fn ($page) => $page->where('claimed', false)->where('requirements', []));
        $token = $ownership->issue(rotate: true);
        expect(File::get($ownership->path()))->not->toContain($token);
        $this->post('/install/claim', ['setup_token' => $token])->assertRedirect();
        $this->withCookie(config('session.cookie'), session()->getId());
        $this->get('/install')->assertInertia(fn ($page) => $page->where('claimed', true));
        $this->postJson('/install/claim', ['setup_token' => $token])->assertUnprocessable()->assertJsonValidationErrors('setup_token');
        app('session')->invalidate();
        $this->withCookie(config('session.cookie'), session()->getId());
        $this->post('/install/configure', ['site_name' => 'Other browser', 'timezone' => 'UTC'])->assertForbidden();
    } finally {
        File::delete($ownership->path());
        markInstalled();
    }
});

it('refuses unsafe package download targets', function (string $url) {
    expect(fn () => app(PackageDownloader::class)->validateUrl($url))->toThrow(RuntimeException::class);
})->with(['http://github.com/a.zip', 'https://127.0.0.1/a.zip', 'https://github.com:8443/a.zip', 'https://user:pass@github.com/a.zip', 'https://attacker.example/a.zip']);

it('rejects a redirect to an internal host and removes partial downloads', function () {
    $destination = storage_path('framework/testing/redirect-package.zip');
    File::ensureDirectoryExists(dirname($destination));
    Http::fake(function () use ($destination) {
        File::put($destination, 'partial');

        return Http::response('', 302, ['Location' => 'https://127.0.0.1/private']);
    });
    expect(fn () => app(PackageDownloader::class)->download('https://github.com/owner/a.zip', $destination))->toThrow(RuntimeException::class);
    expect(File::exists($destination))->toBeFalse();
    Http::assertSentCount(1);
});
