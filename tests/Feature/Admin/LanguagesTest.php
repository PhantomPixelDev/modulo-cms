<?php

use App\Models\Locale;
use App\Models\Post;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Locale::query()->delete();
    Locale::create(['code' => 'en', 'name' => 'English', 'native_name' => 'English', 'is_active' => true, 'is_default' => true]);
    Locale::create(['code' => 'es', 'name' => 'Spanish', 'native_name' => 'Español', 'is_active' => true, 'is_default' => false]);
    Locale::clearCache();
    $this->actingAs(makeAdminUserWithPermissions(['edit settings']));
});

it('lists the languages with their content and offers common ones to add', function () {
    $post = Post::factory()->create();
    $post->setTranslation('es', ['title' => 'Hola', 'slug' => 'hola']);

    $this->get(route('dashboard.admin.languages.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('languages.items.0.code', 'en')
            ->where('languages.items.1.translations', 1)
            ->where('languages.common', fn ($common) => collect($common)->contains('code', 'de')));
});

it('adds a language, switched on', function () {
    $this->post(route('dashboard.admin.languages.store'), ['code' => 'de', 'name' => 'German', 'native_name' => 'Deutsch', 'direction' => 'ltr'])
        ->assertSessionHas('success');

    expect(Locale::getActive()->pluck('code')->all())->toContain('de');

    $this->post(route('dashboard.admin.languages.store'), ['code' => 'de', 'name' => 'German again', 'direction' => 'ltr'])
        ->assertSessionHasErrors('code');
    $this->post(route('dashboard.admin.languages.store'), ['code' => 'Deutsch!', 'name' => 'Bad', 'direction' => 'ltr'])
        ->assertSessionHasErrors('code');
});

it('makes another language the default and keeps one default', function () {
    $spanish = Locale::where('code', 'es')->first();
    $spanish->update(['is_active' => false]);

    $this->put(route('dashboard.admin.languages.update', $spanish), ['is_default' => true])->assertSessionHas('success');

    expect(Locale::where('is_default', true)->pluck('code')->all())->toBe(['es'])
        ->and($spanish->fresh()->is_active)->toBeTrue()
        ->and(Locale::getDefault()?->code)->toBe('es');
});

it('never switches off or removes the default language', function () {
    $english = Locale::where('code', 'en')->first();

    $this->put(route('dashboard.admin.languages.update', $english), ['is_active' => false])->assertSessionHas('error');
    $this->delete(route('dashboard.admin.languages.destroy', $english))->assertSessionHas('error');

    expect($english->fresh()->is_active)->toBeTrue();
});

it('removes a language only when nothing is written in it', function () {
    $spanish = Locale::where('code', 'es')->first();
    $post = Post::factory()->create();
    $post->setTranslation('es', ['title' => 'Hola', 'slug' => 'hola']);

    $this->delete(route('dashboard.admin.languages.destroy', $spanish))->assertSessionHas('error');
    expect(Locale::where('code', 'es')->exists())->toBeTrue();

    $post->translations()->delete();
    $this->delete(route('dashboard.admin.languages.destroy', $spanish))->assertSessionHas('success');
    expect(Locale::where('code', 'es')->exists())->toBeFalse();
});

it('keeps languages to people who may change settings', function () {
    $this->actingAs(makeAdminUserWithPermissions(['view posts']))
        ->get(route('dashboard.admin.languages.index'))
        ->assertForbidden();
});
