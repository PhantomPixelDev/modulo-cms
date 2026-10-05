<?php

use App\Models\ApiToken;
use App\Models\Comment;
use App\Models\Post;
use App\Models\PostType;
use App\Models\SiteSetting;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use App\Models\User;
use App\Presenters\PostPresenter;
use App\Support\Totp;
use Spatie\Permission\Models\Role;

function extendedAuditTwoFactorUser(): User
{
    $user = User::factory()->create(['password' => bcrypt('secret-password')]);
    $user->forceFill([
        'two_factor_secret' => Totp::generateSecret(),
        'two_factor_confirmed_at' => now(),
    ])->save();
    $user->regenerateRecoveryCodes();

    return $user->fresh();
}

it('consumes authenticator codes across independently loaded user instances', function () {
    $first = extendedAuditTwoFactorUser();
    $second = User::findOrFail($first->id);
    $code = Totp::at($first->two_factor_secret, Totp::currentStep());

    expect($first->verifyTwoFactorCode($code))->toBeTrue()
        ->and($second->verifyTwoFactorCode($code))->toBeFalse();
});

it('consumes recovery codes across independently loaded user instances', function () {
    $first = extendedAuditTwoFactorUser();
    $second = User::findOrFail($first->id);
    $code = $first->two_factor_recovery_codes[0];

    expect($first->useRecoveryCode($code))->toBeTrue()
        ->and($second->useRecoveryCode($code))->toBeFalse()
        ->and($first->fresh()->two_factor_recovery_codes)->toHaveCount(7);
});

it('does not discard other recovery codes when a stale instance consumes a different code', function () {
    $first = extendedAuditTwoFactorUser();
    $second = User::findOrFail($first->id);
    $codes = $first->two_factor_recovery_codes;

    expect($first->useRecoveryCode($codes[0]))->toBeTrue()
        ->and($second->useRecoveryCode($codes[1]))->toBeTrue()
        ->and($first->fresh()->two_factor_recovery_codes)->toHaveCount(6)
        ->not->toContain($codes[0], $codes[1]);
});

it('preserves enabled two-factor settings when setup is submitted again', function (bool $required) {
    config(['security.require_two_factor_for_admins' => $required]);
    $user = extendedAuditTwoFactorUser();
    $user->assignRole(Role::findOrCreate('admin', 'web'));
    $original = $user->only(['two_factor_secret', 'two_factor_confirmed_at', 'two_factor_recovery_codes']);

    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()])
        ->post(route('two-factor.enable'))->assertRedirect();

    expect($user->fresh()->only(array_keys($original)))->toEqual($original);
})->with([false, true]);

it('expires an unfinished two-factor login', function () {
    $user = extendedAuditTwoFactorUser();
    $this->post(route('login'), ['email' => $user->email, 'password' => 'secret-password']);
    $this->travel(11)->minutes();

    $this->post(route('two-factor.login.store'), ['recovery_code' => $user->two_factor_recovery_codes[0]])
        ->assertRedirect(route('login'))->assertSessionMissing('login.id');
    $this->assertGuest();
});

it('invalidates unfinished two-factor logins when credentials change', function (string $field) {
    $user = extendedAuditTwoFactorUser();
    $this->post(route('login'), ['email' => $user->email, 'password' => 'secret-password']);
    $code = $user->two_factor_recovery_codes[0];
    $user->forceFill([$field => $field === 'password' ? bcrypt('changed-password') : Totp::generateSecret()])->save();

    $this->post(route('two-factor.login.store'), ['recovery_code' => $code])
        ->assertRedirect(route('login'))->assertSessionMissing('login.id');
    $this->assertGuest();
})->with(['password', 'two_factor_secret']);

it('rejects authenticator codes checked using an obsolete secret', function () {
    $user = extendedAuditTwoFactorUser();
    $code = Totp::at($user->two_factor_secret, Totp::currentStep());
    $user->fresh()->forceFill(['two_factor_secret' => null, 'two_factor_confirmed_at' => null])->save();

    expect($user->verifyTwoFactorCode($code))->toBeFalse();
});

it('keeps private types out of public archives and page lookups', function (string $surface) {
    activateReactTheme();
    $type = PostType::factory()->create([
        'name' => $surface === 'page' ? 'page' : 'internal',
        'slug' => $surface === 'page' ? 'pages' : 'internal',
        'is_public' => false,
    ]);
    $post = Post::factory()->published()->create([
        'post_type_id' => $type->id, 'slug' => 'confidential', 'title' => 'Confidential marker 1927',
    ]);

    if ($surface === 'taxonomy') {
        $taxonomy = Taxonomy::create([
            'name' => 'topics', 'label' => 'Topic', 'plural_label' => 'Topics', 'slug' => 'topics', 'is_public' => true,
        ]);
        $term = TaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'News', 'slug' => 'news']);
        $post->taxonomyTerms()->attach($term);
        $response = $this->get('/topics/news')->assertOk();
    } elseif ($surface === 'page') {
        $response = $this->get('/confidential')->assertNotFound();
    } elseif ($surface === 'front-page') {
        SiteSetting::set('show_on_front', 'page');
        SiteSetting::set('front_page_id', $post->id);
        $response = $this->get('/')->assertOk();
    } elseif ($surface === 'classic') {
        $type->update(['slug' => 'post']);
        $response = $this->get('/posts')->assertOk();
    } else {
        $response = $this->get('/')->assertOk();
    }

    $response->assertDontSee('Confidential marker 1927');
})->with(['taxonomy', 'page', 'front-page', 'classic', 'home']);

it('does not serve a future publication as the configured front page', function () {
    activateReactTheme();
    $page = makePublishedPage(['title' => 'Future front page marker', 'published_at' => now()->addDay()]);
    SiteSetting::set('show_on_front', 'page');
    SiteSetting::set('front_page_id', $page->id);

    $this->get('/')->assertOk()->assertDontSee('Future front page marker');
});

it('does not accept comments on private published content', function () {
    $type = PostType::factory()->create(['has_comments' => true, 'is_public' => false]);
    $post = Post::factory()->published()->create(['post_type_id' => $type->id]);

    $this->post(route('posts.comments.store', $post), [
        'content' => 'Private target', 'author_name' => 'Visitor', 'author_email' => 'visitor@example.test',
    ])->assertNotFound();

    expect(Comment::count())->toBe(0);
});

it('keeps private taxonomy labels out of public post representations', function (string $surface) {
    $post = Post::factory()->published()->create();
    $taxonomy = Taxonomy::create([
        'name' => 'internal', 'label' => 'Internal', 'plural_label' => 'Internal', 'slug' => 'internal', 'is_public' => false,
    ]);
    $term = TaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'Secret classification', 'slug' => 'secret']);
    $post->taxonomyTerms()->attach($term);

    if ($surface === 'api') {
        $this->getJson('/api/v1/posts/'.$post->slug)->assertOk()->assertJsonPath('data.terms', []);
    } else {
        expect(app(PostPresenter::class)->presentPost($post)['terms'])->toBe([]);
    }
})->with(['api', 'theme']);

it('does not allow public API filters to reveal private taxonomy assignments', function () {
    $post = Post::factory()->published()->create();
    $taxonomy = Taxonomy::create([
        'name' => 'internal', 'label' => 'Internal', 'plural_label' => 'Internal', 'slug' => 'internal', 'is_public' => false,
    ]);
    $term = TaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'Secret classification', 'slug' => 'secret']);
    $post->taxonomyTerms()->attach($term);

    $this->getJson('/api/v1/posts?term=secret')->assertOk()->assertJsonCount(0, 'data');

    [$token, $plain] = ApiToken::issue(makeAdminUserWithPermissions(['view posts']), 'read', ['read']);
    $this->getJson('/api/v1/posts?term=secret', ['Authorization' => 'Bearer '.$plain])
        ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.terms.0.name', 'Secret classification');
});

it('preserves public taxonomy assignments in theme and API output', function () {
    $post = Post::factory()->published()->create();
    $taxonomy = Taxonomy::create([
        'name' => 'topics', 'label' => 'Topic', 'plural_label' => 'Topics', 'slug' => 'topics', 'is_public' => true,
    ]);
    $term = TaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'News', 'slug' => 'news']);
    $post->taxonomyTerms()->attach($term);

    $this->getJson('/api/v1/posts?term=news')->assertOk()->assertJsonPath('data.0.terms.0.name', 'News');
    expect(app(PostPresenter::class)->presentPost($post)['terms'][0]['name'])->toBe('News');
});

it('keeps a configured public front page accessible', function () {
    activateReactTheme();
    $page = makePublishedPage(['title' => 'Public front page']);
    SiteSetting::set('show_on_front', 'page');
    SiteSetting::set('front_page_id', $page->id);

    $this->get('/')->assertOk()->assertSee('Public front page');
});

it('clears all unfinished challenge state after a successful login', function () {
    $user = extendedAuditTwoFactorUser();
    $this->post(route('login'), ['email' => $user->email, 'password' => 'secret-password']);
    $this->post(route('two-factor.login.store'), ['recovery_code' => $user->two_factor_recovery_codes[0]])
        ->assertSessionMissing('login.id')->assertSessionMissing('login.remember')
        ->assertSessionMissing('login.fingerprint')->assertSessionMissing('login.expires_at');
    $this->assertAuthenticatedAs($user);
});

it('omits private category and tag taxonomies from shared public sidebar data', function (string $slug) {
    activateReactTheme();
    $taxonomy = Taxonomy::create([
        'name' => $slug, 'label' => $slug, 'plural_label' => $slug, 'slug' => $slug, 'is_public' => false,
    ]);
    TaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'Private sidebar marker', 'slug' => 'hidden']);

    $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->where($slug, []));
})->with(['categories', 'tags']);

it('counts only public released posts in the category sidebar', function () {
    activateReactTheme();
    $taxonomy = Taxonomy::create([
        'name' => 'categories', 'label' => 'Category', 'plural_label' => 'Categories', 'slug' => 'categories', 'is_public' => true,
    ]);
    $term = TaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'News', 'slug' => 'news']);
    $public = Post::factory()->published()->create();
    $scheduled = Post::factory()->published()->create(['published_at' => now()->addDay()]);
    $private = Post::factory()->published()->create([
        'post_type_id' => PostType::factory()->create(['is_public' => false])->id,
    ]);
    foreach ([$public, $scheduled, $private] as $post) {
        $post->taxonomyTerms()->attach($term);
    }

    $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->where('categories.0.posts_count', 1));
});

it('treats SQL syntax in search input as data', function (string $input) {
    activateReactTheme();
    Post::factory()->published()->create(['title' => 'Ordinary news', 'excerpt' => 'A normal article', 'content' => 'Normal text']);

    $this->getJson('/api/v1/posts?'.http_build_query(['search' => $input]))
        ->assertOk()->assertJsonCount(0, 'data');
    $this->get('/search?'.http_build_query(['q' => $input]))
        ->assertOk()->assertInertia(fn ($page) => $page->where('posts.data', []));
})->with(["x' OR 1=1 --", "'; SELECT pg_sleep(2); --"]);
