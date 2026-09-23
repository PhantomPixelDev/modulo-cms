<?php

use App\Models\MediaBucket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Permission\Models\Permission;

uses(RefreshDatabase::class);

function mediaUser($perms = ['view media', 'upload media', 'edit media', 'delete media'])
{
    $user = User::factory()->create();
    if ($perms) {
        foreach ($perms as $perm) {
            Permission::findOrCreate($perm, 'web');
        }
        $user->givePermissionTo($perms);
    }
    // Also give access admin permission which is required for admin routes
    Permission::findOrCreate('access admin', 'web');
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
    $file = UploadedFile::fake()->createWithContent('shell.php', $png.'<?php echo "pwned"; ?>');

    $this->actingAs($user)
        ->post(route('dashboard.admin.media.store'), ['file' => $file])
        ->assertSessionHasErrors('file');

    expect(Media::count())->toBe(0);
});

it('stores uploads under a sanitized file name', function () {
    Storage::fake('public');
    $user = mediaUser(['upload media']);

    $file = UploadedFile::fake()->image('My Holiday Photo.png', 20, 20);

    $this->actingAs($user)
        ->post(route('dashboard.admin.media.store'), ['file' => $file])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $media = Media::first();
    expect($media)->not->toBeNull()
        ->and($media->file_name)->toBe('my-holiday-photo.png')
        ->and($media->name)->toBe('My Holiday Photo');
});

it('updates and deletes media records', function () {
    Storage::fake('public');
    $user = mediaUser();

    $this->actingAs($user)->post(route('dashboard.admin.media.store'), [
        'file' => UploadedFile::fake()->image('photo.png', 20, 20),
    ]);
    $media = Media::firstOrFail();

    $this->actingAs($user)
        ->put(route('dashboard.admin.media.update', $media->id), ['name' => 'Renamed'])
        ->assertRedirect();
    expect($media->fresh()->name)->toBe('Renamed');

    $this->actingAs($user)
        ->delete(route('dashboard.admin.media.destroy', $media->id))
        ->assertRedirect();
    expect(Media::count())->toBe(0);
});

/**
 * A media row attached to something other than the library, the way a plugin
 * attaches files to its own models.
 */
function foreignMedia(): Media
{
    return Media::query()->create([
        'model_type' => 'Plugins\Shop\Product',
        'model_id' => 1,
        'uuid' => (string) Str::uuid(),
        'collection_name' => 'images',
        'name' => 'product-photo',
        'file_name' => 'product-photo.jpg',
        'mime_type' => 'image/jpeg',
        'disk' => 'public',
        'conversions_disk' => 'public',
        'size' => 1024,
        'manipulations' => [],
        'custom_properties' => [],
        'generated_conversions' => [],
        'responsive_images' => [],
    ]);
}

it('does not let the library rename or delete media it does not own', function () {
    Storage::fake('public');
    $user = mediaUser();
    $media = foreignMedia();

    $this->actingAs($user)
        ->put(route('dashboard.admin.media.update', $media->id), ['name' => 'hijacked'])
        ->assertNotFound();
    $this->actingAs($user)
        ->delete(route('dashboard.admin.media.destroy', $media->id))
        ->assertNotFound();

    expect($media->fresh())->not->toBeNull()
        ->and($media->fresh()->name)->toBe('product-photo');
});

it('ignores media it does not own in bulk actions', function () {
    Storage::fake('public');
    $user = mediaUser();
    $media = foreignMedia();
    $folder = MediaBucket::firstOrCreate(['name' => 'default', 'parent_id' => null]);

    // "move" used to reassign any row to the library, taking it from its owner.
    $this->actingAs($user)->post(route('dashboard.admin.media.bulk'), [
        'action' => 'move', 'ids' => [$media->id], 'target_folder_id' => $folder->id,
    ])->assertRedirect();
    $this->actingAs($user)->post(route('dashboard.admin.media.bulk'), [
        'action' => 'delete', 'ids' => [$media->id],
    ])->assertRedirect();

    expect($media->fresh())->not->toBeNull()
        ->and($media->fresh()->model_type)->toBe('Plugins\Shop\Product');
});
