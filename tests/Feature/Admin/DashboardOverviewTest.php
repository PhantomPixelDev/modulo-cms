<?php

use App\Models\Comment;
use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

function overviewAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate('admin', 'web'));

    return $user;
}

it('shows an editor their drafts and what goes live next', function () {
    $type = PostType::factory()->create(['name' => 'news', 'slug' => 'news', 'route_prefix' => 'news']);
    $editor = makeAdminUserWithPermissions(['view posts']);
    Post::factory()->create(['post_type_id' => $type->id, 'status' => 'draft', 'author_id' => $editor->id, 'title' => 'My draft']);
    Post::factory()->create(['post_type_id' => $type->id, 'status' => 'draft', 'title' => 'Someone else']);
    Post::factory()->create(['post_type_id' => $type->id, 'status' => 'published', 'published_at' => now()->addDays(2), 'title' => 'Next week']);

    $this->actingAs($editor)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('overview.drafts', 1)
            ->where('overview.drafts.0.title', 'My draft')
            ->where('overview.scheduled.0.title', 'Next week')
            ->missing('overview.checklist')
            ->missing('overview.pendingComments'));
});

it('counts comments waiting for review', function () {
    $post = Post::factory()->published()->create();
    Comment::create(['post_id' => $post->id, 'author_name' => 'Ann', 'author_email' => 'ann@example.com', 'content' => '<b>Nice</b> post', 'status' => 'pending']);
    Comment::create(['post_id' => $post->id, 'author_name' => 'Bob', 'author_email' => 'bob@example.com', 'content' => 'Old', 'status' => 'approved']);

    $this->actingAs(overviewAdmin())->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('overview.pendingComments.count', 1)
            ->where('overview.pendingComments.latest.0.author', 'Ann')
            ->where('overview.pendingComments.latest.0.excerpt', 'Nice post'));
});

it('ticks off setup steps from the real state of the site', function () {
    config(['mail.default' => 'log']);
    SiteSetting::set('site_name', 'Bakery Rosa');

    $steps = fn () => collect($this->actingAs(overviewAdmin())->get(route('dashboard'))->viewData('page')['props']['overview']['checklist'])
        ->pluck('done', 'key')->all();

    expect($steps())->toMatchArray(['site_name' => true, 'logo' => false, 'email' => false, 'two_factor' => false]);

    SiteSetting::set('site_logo', '/storage/logo.png');
    config(['mail.default' => 'smtp']);

    expect($steps())->toMatchArray(['logo' => true, 'email' => true]);
});

it('lets the site owner hide the checklist for good', function () {
    $admin = overviewAdmin();

    $this->actingAs($admin)->post(route('dashboard.admin.onboarding.dismiss'))->assertRedirect();

    $this->actingAs($admin)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->missing('overview.checklist'));
});

it('does not let editors hide the checklist', function () {
    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->post(route('dashboard.admin.onboarding.dismiss'))
        ->assertForbidden();

    expect(SiteSetting::get('onboarding_dismissed', false))->toBeFalsy();
});
