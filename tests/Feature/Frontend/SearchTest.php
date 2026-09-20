<?php

use App\Models\Post;
use App\Models\PostType;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    activateReactTheme();
});

function searchablePost(array $attributes = [], bool $publicType = true): Post
{
    $type = PostType::factory()->create(['is_public' => $publicType]);

    return Post::factory()->published()->create(array_merge(['post_type_id' => $type->id], $attributes));
}

it('matches regardless of letter case', function () {
    searchablePost(['title' => 'Hello Laravel World', 'content' => 'Body']);

    $this->get('/search?q=hello laravel')
        ->assertOk()
        ->assertSee('Hello Laravel World');
});

it('does not treat percent signs as a wildcard', function () {
    searchablePost(['title' => 'Plain title', 'excerpt' => 'nothing', 'content' => 'nothing']);
    searchablePost(['title' => 'Save 50% today', 'content' => 'Body']);

    // LIKE escapes it; full-text search has no token for it. Either way the
    // query must not return every post.
    $this->get('/search?q='.urlencode('%'))
        ->assertOk()
        ->assertDontSee('Plain title');
});

it('excludes posts of non-public post types', function () {
    searchablePost(['title' => 'Secret internal note', 'content' => 'x'], publicType: false);

    $this->get('/search?q=secret')
        ->assertOk()
        ->assertDontSee('Secret internal note');
});

it('ranks title matches above body matches on postgres', function () {
    searchablePost(['title' => 'Unrelated', 'excerpt' => 'x', 'content' => 'Laravel appears only in the body here']);
    searchablePost(['title' => 'Laravel guide', 'excerpt' => 'x', 'content' => 'body']);

    $response = $this->get('/search?q=laravel')->assertOk();

    $titles = collect($response->viewData('page')['props']['posts']['data'])->pluck('title')->all();
    expect($titles)->toBe(['Laravel guide', 'Unrelated']);
})->skip(fn () => DB::connection()->getDriverName() !== 'pgsql', 'PostgreSQL full-text search only');

it('matches multi-word queries', function () {
    searchablePost(['title' => 'Hello Laravel World', 'content' => 'body']);

    $this->get('/search?q=laravel+world')->assertOk()->assertSee('Hello Laravel World');
});
