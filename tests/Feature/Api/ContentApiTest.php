<?php

use App\Models\ApiToken;
use App\Models\Post;
use App\Models\PostType;
use App\Models\User;
use Illuminate\Support\Facades\Route;

function apiPostType(): PostType
{
    return PostType::firstOrCreate(['name' => 'post'], PostType::factory()->raw(['name' => 'post', 'slug' => 'post', 'route_prefix' => 'posts', 'is_public' => true]));
}

function apiToken(array $permissions = [], array $abilities = ['read']): array
{
    $user = makeAdminUserWithPermissions($permissions);
    [, $plain] = ApiToken::issue($user, 'test', $abilities);

    return [$user, ['Authorization' => 'Bearer '.$plain]];
}

it('serves published posts to anyone, without drafts or scheduled posts', function () {
    $type = apiPostType();
    Post::factory()->create(['post_type_id' => $type->id, 'title' => 'Live', 'slug' => 'live', 'status' => 'published', 'published_at' => now()->subDay()]);
    Post::factory()->create(['post_type_id' => $type->id, 'title' => 'Draft', 'status' => 'draft']);
    Post::factory()->create(['post_type_id' => $type->id, 'title' => 'Later', 'status' => 'published', 'published_at' => now()->addDay()]);

    $this->getJson('/api/v1/posts')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Live')
        ->assertJsonPath('data.0.url', url('/posts/live'))
        ->assertJsonMissingPath('data.0.content');

    $this->getJson('/api/v1/posts/live')->assertOk()->assertJsonStructure(['data' => ['content', 'seo']]);
    $this->getJson('/api/v1/posts?status=draft')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'Live');
});

it('shows unpublished content to a token whose user may view posts', function () {
    $type = apiPostType();
    Post::factory()->create(['post_type_id' => $type->id, 'title' => 'Draft', 'slug' => 'draft-one', 'status' => 'draft']);
    [, $headers] = apiToken(['view posts']);

    $this->getJson('/api/v1/posts?status=draft', $headers)->assertOk()->assertJsonPath('data.0.title', 'Draft');
    $this->getJson('/api/v1/posts/draft-one', $headers)->assertOk();
});

it('rejects a wrong or expired token instead of quietly serving less', function () {
    $this->getJson('/api/v1/posts', ['Authorization' => 'Bearer mod_nope'])->assertUnauthorized();

    $user = User::factory()->create();
    [, $plain] = ApiToken::issue($user, 'old', ['read'], now()->subMinute());
    $this->getJson('/api/v1/posts', ['Authorization' => 'Bearer '.$plain])->assertUnauthorized();
});

it('creates, changes and trashes posts with a write token and the permissions', function () {
    apiPostType();
    [$user, $headers] = apiToken(['create posts', 'edit posts', 'delete posts', 'view posts'], ['read', 'write']);

    $created = $this->postJson('/api/v1/posts', ['title' => 'From the API', 'content' => '<p>Hi</p>', 'status' => 'published'], $headers)
        ->assertCreated()
        ->assertJsonPath('data.slug', 'from-the-api')
        ->assertJsonPath('data.author.id', $user->id)
        ->json('data');

    expect(Post::find($created['id'])->published_at)->not->toBeNull();

    $this->patchJson('/api/v1/posts/'.$created['id'], ['title' => 'Renamed'], $headers)->assertOk()->assertJsonPath('data.title', 'Renamed');

    $this->deleteJson('/api/v1/posts/'.$created['id'], [], $headers)->assertOk();
    expect(Post::onlyTrashed()->find($created['id']))->not->toBeNull();
});

it('needs the write ability and the user permission to write', function () {
    apiPostType();
    [, $readOnly] = apiToken(['create posts'], ['read']);
    $this->postJson('/api/v1/posts', ['title' => 'Nope'], $readOnly)->assertForbidden();

    [, $noPermission] = apiToken([], ['read', 'write']);
    $this->postJson('/api/v1/posts', ['title' => 'Nope'], $noPermission)->assertForbidden();

    $this->postJson('/api/v1/posts', ['title' => 'Nope'])->assertUnauthorized();
    expect(Post::count())->toBe(0);
});

it('describes every v1 route in the OpenAPI document', function () {
    $spec = $this->getJson('/api/v1/openapi.json')->assertOk()->json();

    $documented = [];
    foreach ($spec['paths'] as $path => $operations) {
        foreach (array_keys($operations) as $method) {
            $documented[] = strtoupper($method).' '.preg_replace('/\{[^}]+\}/', '{}', $path);
        }
    }

    foreach (Route::getRoutes() as $route) {
        if (! str_starts_with($route->uri(), 'api/v1/')) {
            continue;
        }
        $path = preg_replace('/\{[^}]+\}/', '{}', substr($route->uri(), strlen('api/v1')));
        foreach (array_diff($route->methods(), ['HEAD']) as $method) {
            expect($documented)->toContain("{$method} {$path}");
        }
    }
});

it('serves site data, post types and menus', function () {
    apiPostType();

    $this->getJson('/api/v1/site')->assertOk()->assertJsonStructure(['data' => ['name', 'tagline', 'url', 'logo']]);
    $this->getJson('/api/v1/post-types')->assertOk()->assertJsonPath('data.0.name', 'post');
    $this->getJson('/api/v1/menus/nowhere')->assertNotFound();
});

it('lets users create and revoke their own tokens', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->withSession(['auth.password_confirmed_at' => time()]);

    $this->post(route('api-tokens.store'), ['name' => 'CI', 'abilities' => ['read'], 'expires_in_days' => 30])
        ->assertSessionHas('api_token_plain', fn ($plain) => str_starts_with($plain, 'mod_'));

    $token = ApiToken::where('user_id', $user->id)->sole();
    expect($token->expires_at?->isFuture())->toBeTrue();

    $other = User::factory()->create();
    [$foreign] = ApiToken::issue($other, 'theirs', ['read']);
    $this->delete(route('api-tokens.destroy', ['id' => $foreign->id]))->assertNotFound();

    $this->delete(route('api-tokens.destroy', ['id' => $token->id]))->assertSessionHas('success');
    expect(ApiToken::where('user_id', $user->id)->exists())->toBeFalse();
});
