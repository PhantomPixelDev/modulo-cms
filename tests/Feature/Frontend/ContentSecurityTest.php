<?php

use App\Models\User;

beforeEach(function () {
    activateReactTheme();
});

it('sanitizes raw html content on public pages', function () {
    $page = makePublishedPage([
        'slug' => 'xss-page',
        'content' => '<p>Visible body</p><script>alert("pwned")</script><img src="/x.png" onerror="alert(2)">',
    ]);

    $this->get('/' . $page->slug)
        ->assertOk()
        ->assertSee('Visible body')
        ->assertDontSee('pwned')
        ->assertDontSee('onerror');
});

it('does not expose the author email on public pages', function () {
    $author = User::factory()->create(['email' => 'secret-author@example.com']);
    $page = makePublishedPage(['slug' => 'about-us', 'author_id' => $author->id]);

    $this->get('/' . $page->slug)
        ->assertOk()
        ->assertDontSee('secret-author@example.com');
});

it('neutralizes javascript urls in button shortcodes', function () {
    $page = makePublishedPage([
        'slug' => 'shortcode-page',
        'content' => '<p>Intro</p>[button url="javascript:alert(1)"]Click[/button]',
    ]);

    $this->get('/' . $page->slug)
        ->assertOk()
        ->assertSee('Click')
        ->assertDontSee('javascript:alert');
});
