<?php

use App\Models\User;
use App\Models\MediaBucket;
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
