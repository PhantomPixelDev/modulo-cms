<?php

use App\Models\User;
use App\Models\Template;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function userWithPerms(array $perms = []): User {
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

it('denies templates index without permission', function () {
    // Ensure permission exists but is not granted
    Spatie\Permission\Models\Permission::findOrCreate('view templates', 'web');
    $user = userWithPerms([]);
    $this->actingAs($user)
        ->get(route('dashboard.admin.templates.index'))
        ->assertForbidden();
});

it('allows templates index with permission', function () {
    $user = userWithPerms(['view templates']);
    $this->actingAs($user)
        ->get(route('dashboard.admin.templates.index'))
        ->assertOk();
});

it('creates template with permission', function () {
    $user = userWithPerms(['create templates']);
    $this->actingAs($user)
        ->post(route('dashboard.admin.templates.store'), [
            'name' => 'Homepage',
            'type' => 'page',
            'content' => '<div>Hi</div>',
        ])->assertRedirect(route('dashboard.admin.templates.index'));

    expect(Template::where('name', 'Homepage')->exists())->toBeTrue();
});
