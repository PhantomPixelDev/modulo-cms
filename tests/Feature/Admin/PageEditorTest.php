<?php

use App\Models\Post;
use App\Models\PostType;
use Inertia\Testing\AssertableInertia as Assert;

function pageEditor()
{
    return makeAdminUserWithPermissions(['view posts', 'create posts', 'edit posts', 'publish content']);
}

function pagePayload(array $overrides = []): array
{
    return array_merge(['title' => 'About', 'slug' => 'about', 'content' => '<p>Hi</p>', 'status' => 'draft'], $overrides);
}

it('puts a page under another one, but never under itself or its own sub-pages', function () {
    $about = makePublishedPage(['title' => 'About', 'slug' => 'about']);
    $team = makePublishedPage(['title' => 'Team', 'slug' => 'team', 'parent_id' => $about->id]);
    $contact = makePublishedPage(['title' => 'Contact', 'slug' => 'contact']);
    $this->actingAs(pageEditor());

    $this->put(route('dashboard.admin.pages.update', $contact), pagePayload(['title' => 'Contact', 'slug' => 'contact', 'status' => 'published', 'parent_id' => $about->id]))
        ->assertSessionHasNoErrors();
    expect($contact->fresh()->parent_id)->toBe($about->id);

    $this->put(route('dashboard.admin.pages.update', $about), pagePayload(['status' => 'published', 'parent_id' => $team->id]))
        ->assertSessionHasErrors('parent_id');
    $this->put(route('dashboard.admin.pages.update', $about), pagePayload(['status' => 'published', 'parent_id' => $about->id]))
        ->assertSessionHasErrors('parent_id');
});

it('offers only possible parents in the form', function () {
    $about = makePublishedPage(['title' => 'About', 'slug' => 'about']);
    makePublishedPage(['title' => 'Team', 'slug' => 'team', 'parent_id' => $about->id]);
    makePublishedPage(['title' => 'Contact', 'slug' => 'contact']);

    $this->actingAs(pageEditor())->get(route('dashboard.admin.pages.edit', $about))
        ->assertInertia(fn (Assert $page) => $page
            ->has('pageParents', 1)
            ->where('pageParents.0.title', 'Contact')
            ->has('pageFields')
            ->has('authors'));
});

it('keeps the chosen publish date, so pages can be scheduled', function () {
    makePublishedPage(['slug' => 'home']);
    $this->actingAs(pageEditor());
    $later = now()->addWeek()->startOfMinute();

    $this->post(route('dashboard.admin.pages.store'), pagePayload(['status' => 'published', 'published_at' => $later->toIso8601String()]))
        ->assertSessionHasNoErrors();
    expect(Post::where('slug', 'about')->first()->published_at->equalTo($later))->toBeTrue();

    // Saving as a draft no longer throws the date away
    $page = Post::where('slug', 'about')->first();
    $this->put(route('dashboard.admin.pages.update', $page), pagePayload())->assertSessionHasNoErrors();
    expect($page->fresh()->published_at->equalTo($later))->toBeTrue();
});

it('saves search engine settings and checks the page custom fields', function () {
    makePublishedPage(['slug' => 'home']);
    PostType::where('name', 'page')->update(['fields' => json_encode([['key' => 'hero_text', 'label' => 'Hero text', 'type' => 'text', 'required' => true]])]);
    $this->actingAs(pageEditor());

    $this->post(route('dashboard.admin.pages.store'), pagePayload(['meta_data' => ['noindex' => true, 'fields' => []]]))
        ->assertSessionHasErrors(['meta_data.fields.hero_text' => 'The Hero text field is required.']);

    $this->post(route('dashboard.admin.pages.store'), pagePayload(['meta_data' => ['noindex' => true, 'fields' => ['hero_text' => 'Welcome']]]))
        ->assertSessionHasNoErrors();

    expect(Post::where('slug', 'about')->first()->meta_data)->toBe(['noindex' => true, 'fields' => ['hero_text' => 'Welcome']]);
});
