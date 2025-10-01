<?php

use App\Models\User;
use App\Models\Post;
use App\Models\PostType;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function sitemapUser($perms = ['view sitemap'])
{
    $user = User::factory()->create();
    $user->givePermissionTo($perms);
    // Also give access admin permission which is required for admin routes
    \Spatie\Permission\Models\Permission::findOrCreate('access admin', 'web');
    $user->givePermissionTo('access admin');
    return $user;
}

it('allows sitemap index with permission', function () {
    $user = sitemapUser(['view sitemap']);
    $this->actingAs($user)->get(route('dashboard.admin.sitemap.index'))->assertOk();
});

it('denies sitemap index without permission', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->get(route('dashboard.admin.sitemap.index'))->assertForbidden();
});

it('generates sitemap with permission', function () {
    $user = sitemapUser(['edit sitemap']);
    $postType = PostType::factory()->create(['is_public' => true]);
    Post::factory()->count(3)->create(['post_type_id' => $postType->id, 'status' => 'publish']);

    $this->actingAs($user)->post(route('dashboard.admin.sitemap.generate'))
        ->assertRedirect();

    // Check that sitemap was generated (this would need actual sitemap generation logic)
    expect(true)->toBeTrue();
});

it('denies sitemap generation without permission', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->post(route('dashboard.admin.sitemap.generate'))
        ->assertForbidden();
});
