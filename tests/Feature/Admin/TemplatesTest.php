<?php

use App\Models\User;
use App\Models\Template;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('denies templates index without permission', function () {
    // Ensure permission exists but is not granted
    Spatie\Permission\Models\Permission::findOrCreate('view templates', 'web');
    $user = makeAdminUserWithPermissions([]);
    $this->actingAs($user)
        ->get(route('dashboard.admin.templates.index'))
        ->assertForbidden();
});

it('allows templates index with permission', function () {
    $user = makeAdminUserWithPermissions(['view templates']);
    $this->actingAs($user)
        ->get(route('dashboard.admin.templates.index'))
        ->assertOk();
});

it('creates template with permission', function () {
    $user = makeAdminUserWithPermissions(['create templates']);
    $this->actingAs($user)
        ->post(route('dashboard.admin.templates.store'), [
            'name' => 'Homepage',
            'type' => 'page',
            'content' => '<div>Hi</div>',
        ])->assertRedirect(route('dashboard.admin.templates.index'));

    expect(Template::where('name', 'Homepage')->exists())->toBeTrue();
});
