<?php

use App\Models\Post;
use App\Models\PostType;

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

it('treats percent signs literally', function () {
    searchablePost(['title' => 'Plain title', 'excerpt' => 'nothing', 'content' => 'nothing']);
    searchablePost(['title' => 'Save 50% today', 'content' => 'Body']);

    $response = $this->get('/search?q='.urlencode('%'))->assertOk();

    $response->assertSee('Save 50% today')->assertDontSee('Plain title');
});

it('excludes posts of non-public post types', function () {
    searchablePost(['title' => 'Secret internal note', 'content' => 'x'], publicType: false);

    $this->get('/search?q=secret')
        ->assertOk()
        ->assertDontSee('Secret internal note');
});
