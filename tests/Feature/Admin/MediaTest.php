<?php

use App\Models\MediaBucket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function mediaUser($perms = ['view media', 'upload media', 'edit media', 'delete media'])
{
    $user = User::factory()->create();
    if ($perms) {
        foreach ($perms as $perm) {
            Spatie\Permission\Models\Permission::findOrCreate($perm, 'web');
        }
        $user->givePermissionTo($perms);
    }
    // Also give access admin permission which is required for admin routes
    Spatie\Permission\Models\Permission::findOrCreate('access admin', 'web');
    $user->givePermissionTo('access admin');

    return $user;
}

it('allows media index with permission', function () {
    $user = mediaUser(['view media']);
    $this->actingAs($user)->get(route('dashboard.admin.media.index'))->assertOk();
});

it('denies media index without permission', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->get(route('dashboard.admin.media.index'))->assertForbidden();
});

it('creates media folder with permission', function () {
    $user = mediaUser(['upload media']);

    $this->actingAs($user)->post(route('dashboard.admin.media.folders.store'), [
        'name' => 'Test Folder',
        'parent_id' => null,
    ])->assertRedirect();

    expect(MediaBucket::where('name', 'Test Folder')->exists())->toBeTrue();
});

it('denies media folder creation without permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('dashboard.admin.media.folders.store'), [
        'name' => 'Test Folder',
        'parent_id' => null,
    ])->assertForbidden();
});

// Note: Media upload and deletion tests would require Spatie Media Library setup
// which is complex to test in isolation. These tests verify the authorization logic.

it('rejects php files disguised as images', function () {
    Storage::fake('public');
    $user = mediaUser(['upload media']);

    // Valid 1x1 PNG header followed by a PHP payload (polyglot)
    $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    $file = \Illuminate\Http\UploadedFile::fake()->createWithContent('shell.php', $png.'<?php echo "pwned"; ?>');

    $this->actingAs($user)
        ->post(route('dashboard.admin.media.store'), ['file' => $file])
        ->assertSessionHasErrors('file');

    expect(\Spatie\MediaLibrary\MediaCollections\Models\Media::count())->toBe(0);
});

it('stores uploads under a sanitized file name', function () {
    Storage::fake('public');
    $user = mediaUser(['upload media']);

    $file = \Illuminate\Http\UploadedFile::fake()->image('My Holiday Photo.png', 20, 20);

    $this->actingAs($user)
        ->post(route('dashboard.admin.media.store'), ['file' => $file])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $media = \Spatie\MediaLibrary\MediaCollections\Models\Media::first();
    expect($media)->not->toBeNull()
        ->and($media->file_name)->toBe('my-holiday-photo.png')
        ->and($media->name)->toBe('My Holiday Photo');
});

it('updates and deletes media records', function () {
    Storage::fake('public');
    $user = mediaUser();

    $this->actingAs($user)->post(route('dashboard.admin.media.store'), [
        'file' => \Illuminate\Http\UploadedFile::fake()->image('photo.png', 20, 20),
    ]);
    $media = \Spatie\MediaLibrary\MediaCollections\Models\Media::firstOrFail();

    $this->actingAs($user)
        ->put(route('dashboard.admin.media.update', $media->id), ['name' => 'Renamed'])
        ->assertRedirect();
    expect($media->fresh()->name)->toBe('Renamed');

    $this->actingAs($user)
        ->delete(route('dashboard.admin.media.destroy', $media->id))
        ->assertRedirect();
    expect(\Spatie\MediaLibrary\MediaCollections\Models\Media::count())->toBe(0);
});
