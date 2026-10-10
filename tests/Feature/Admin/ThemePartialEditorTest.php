<?php

use App\Models\EditorDraft;
use App\Models\Locale;
use App\Models\Post;
use App\Models\Theme;
use App\Services\ThemeManager;
use App\Services\ThemePartialFields;
use App\Services\ThemePartialService;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    activateReactTheme();
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'native_name' => 'English', 'is_active' => true, 'is_default' => true]);
    $this->author = makeAdminUserWithPermissions(['create posts']);
});

it('returns a typed catalog to the picker without requiring theme management', function () {
    $this->actingAs($this->author)->getJson(route('dashboard.admin.partials.index'))->assertOk()
        ->assertJsonPath('partialCatalog.0.fields.1.type', 'select')
        ->assertJsonPath('partialCatalog.1.fields.1.type', 'boolean');
});

it('previews a module through the active theme without creating content', function () {
    $posts = Post::count();
    $drafts = EditorDraft::count();
    $url = $this->actingAs($this->author)->postJson(route('dashboard.admin.partials.preview'), [
        'name' => 'callout', 'attributes' => ['title' => 'He said "hello" & <goodbye> \'yes\'', 'tone' => 'success'],
        'body' => '<p><strong>Useful</strong></p><script>alert(1)</script>',
    ])->assertOk()->json('url');
    $this->get($url)->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Themes/ModernReact/Page', false)
            ->where('page.content_partials.0.attributes.title', 'He said "hello" & <goodbye> \'yes\'')
            ->where('page.content_partials.0.html', '<p><strong>Useful</strong></p>')
            ->where('page.seo.noindex', true));
    expect(Post::count())->toBe($posts)->and(EditorDraft::count())->toBe($drafts);
});

it('handles optional empty fields and rejects bad typed values', function () {
    $this->actingAs($this->author)->postJson(route('dashboard.admin.partials.preview'), ['name' => 'callout', 'attributes' => ['title' => '', 'tone' => 'info'], 'body' => ''])
        ->assertOk();
    $this->postJson(route('dashboard.admin.partials.preview'), ['name' => 'callout', 'attributes' => ['tone' => 'danger']])
        ->assertUnprocessable()->assertJsonValidationErrors('attributes.tone');
    $this->postJson(route('dashboard.admin.partials.preview'), ['name' => 'disclosure', 'attributes' => ['title' => '', 'open' => 'yes']])
        ->assertUnprocessable()->assertJsonValidationErrors(['attributes.title', 'attributes.open']);
    $this->postJson(route('dashboard.admin.partials.preview'), ['name' => 'navigation', 'attributes' => []])->assertUnprocessable();
});

it('keeps previews private, expiring and tied to the active theme', function () {
    $url = $this->actingAs($this->author)->postJson(route('dashboard.admin.partials.preview'), ['name' => 'callout', 'attributes' => []])->assertOk()->json('url');
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']))->get($url)->assertNotFound();
    $this->actingAs($this->author);
    Theme::where('is_active', true)->update(['is_active' => false]);
    app(ThemeManager::class)->clearCache();
    $this->get($url)->assertConflict();
    $this->travel(11)->minutes();
    $this->get($url)->assertGone();
});

it('enforces picker and preview permissions', function () {
    $this->actingAs(makeAdminUserWithPermissions([]))->getJson(route('dashboard.admin.partials.index'))->assertForbidden();
    $this->postJson(route('dashboard.admin.partials.preview'), ['name' => 'callout', 'attributes' => []])->assertForbidden();
});

it('validates field definitions and image schemes without changing legacy rendering', function () {
    $fields = app(ThemePartialFields::class);
    expect($fields->manifestErrors(['fields' => ['bad' => ['type' => 'script']]]))->not->toBeEmpty()
        ->and($fields->manifestErrors(['fields' => ['tone' => ['type' => 'select', 'options' => []]]]))->not->toBeEmpty()
        ->and(ThemePartialFields::imageUrl('javascript:alert(1)'))->toBeFalse()
        ->and(ThemePartialFields::imageUrl('/storage/photo.jpg'))->toBeTrue();
    $result = app(ThemePartialService::class)->render('[partial name="callout" tone="old-value"]Legacy[/partial]');
    expect($result['partials'][0]['attributes']['tone'])->toBe('old-value');
});
