<?php

use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use App\Models\User;
use Database\Seeders\BootstrapSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    activateReactTheme();
});

it('defaults to the normal site identity and only published content', function () {
    config(['demo.enabled' => false]);
    SiteSetting::set('site_name', 'My publication');
    $type = PostType::factory()->create(['name' => 'post', 'slug' => 'post']);
    Post::factory()->published()->create(['post_type_id' => $type->id, 'title' => 'Public article']);
    Post::factory()->create(['post_type_id' => $type->id, 'title' => 'Private work', 'status' => 'draft']);
    $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('demo.enabled', false)->where('site.name', 'My publication')
        ->has('posts.data', 1)->where('posts.data.0.title', 'Public article'));
});

it('opts into demo promotion explicitly', function () {
    config(['demo.enabled' => true]);
    $this->get('/')->assertInertia(fn (Assert $page) => $page->where('demo.enabled', true));
});

it('keeps a configured front page ahead of the demo homepage', function () {
    config(['demo.enabled' => true]);
    $front = makePublishedPage(['title' => 'Our front page']);
    SiteSetting::set('show_on_front', 'page');
    SiteSetting::set('front_page_id', $front->id);
    $this->get('/')->assertOk()->assertSee('Our front page');
});

it('refuses production demo seeding without both explicit guards', function () {
    app()->detectEnvironment(fn () => 'production');
    config(['demo.enabled' => false]);
    $this->artisan('modulo:seed-demo', ['--force' => true])->assertFailed();
    config(['demo.enabled' => true]);
    $this->artisan('modulo:seed-demo')->assertFailed();
});

it('seeds the disposable production demo only through the authorized command', function () {
    $this->seed(BootstrapSeeder::class);
    app()->detectEnvironment(fn () => 'production');
    config(['demo.enabled' => true]);
    $this->artisan('modulo:seed-demo', ['--force' => true])->assertSuccessful();
    expect(User::where('email', 'admin@example.com')->exists())->toBeTrue()
        ->and(config('demo.seeding_authorized'))->toBeFalse();
});
