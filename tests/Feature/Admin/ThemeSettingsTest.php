<?php

use App\Models\Theme;
use App\Services\ThemeManager;
use App\Services\ThemeSettings;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    activateReactTheme();
    $this->theme = Theme::where('is_active', true)->firstOrFail();
    $this->owner = makeAdminUserWithPermissions(['customize themes']);
});

it('shows the active theme controls and typed defaults', function () {
    $this->actingAs($this->owner)->get(route('dashboard.admin.themes.settings.index'))
        ->assertRedirect(route('dashboard.admin.themes.settings.edit', $this->theme));
    $this->get(route('dashboard.admin.themes.settings.edit', $this->theme))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Dashboard', false)
            ->where('adminSection', 'theme-settings')
            ->where('themeSettings.fields.primary_color.type', 'color')
            ->where('themeSettings.values.show_sidebar', true));
});

it('requires customization permission for reading saving and resetting', function () {
    $this->actingAs(makeAdminUserWithPermissions(['view themes']));
    $this->get(route('dashboard.admin.themes.settings.edit', $this->theme))->assertForbidden();
    $this->putJson(route('dashboard.admin.themes.settings.update', $this->theme), ['values' => []])->assertForbidden();
    $this->deleteJson(route('dashboard.admin.themes.settings.reset', $this->theme))->assertForbidden();
});

it('saves settings without writing files and invalidates active-theme and page caches', function () {
    $manifest = File::get($this->theme->full_path.'/theme.json');
    app(ThemeManager::class)->getActiveTheme();
    $generation = Cache::get('page-cache:version');
    $values = app(ThemeSettings::class)->values($this->theme);
    $values['primary_color'] = '#be123c';
    $values['font_family'] = 'helvetica';
    $values['show_sidebar'] = false;
    $this->actingAs($this->owner)->put(route('dashboard.admin.themes.settings.update', $this->theme), ['values' => $values])->assertRedirect();
    expect($this->theme->fresh()->settings)->toBe($values)
        ->and(app(ThemeSettings::class)->values(app(ThemeManager::class)->getActiveTheme()))->toBe($values)
        ->and(Cache::get('page-cache:version'))->not->toBe($generation)
        ->and(File::get($this->theme->full_path.'/theme.json'))->toBe($manifest);
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('theme.settings.primary_color', '#be123c')->where('theme.settings.show_sidebar', false));
});

it('rejects unknown controls unsafe colors invalid choices and incomplete forms', function () {
    $values = app(ThemeSettings::class)->values($this->theme);
    $this->actingAs($this->owner);
    foreach ([
        ['primary_color' => '#fff;}</style><script>alert(1)</script>'],
        ['font_family' => 'url(https://example.test/font)'],
        ['show_sidebar' => 'yes'],
        ['executable_code' => 'bad'],
    ] as $changes) {
        $this->putJson(route('dashboard.admin.themes.settings.update', $this->theme), ['values' => array_replace($values, $changes)])
            ->assertUnprocessable();
    }
    $this->putJson(route('dashboard.admin.themes.settings.update', $this->theme), ['values' => []])
        ->assertUnprocessable()->assertJsonValidationErrors('values.primary_color');
    expect($this->theme->fresh()->settings)->toBeNull();
});

it('resets to defaults while leaving other themes alone', function () {
    $values = app(ThemeSettings::class)->values($this->theme);
    $this->theme->update(['settings' => array_replace($values, ['primary_color' => '#be123c'])]);
    $other = $this->theme->replicate();
    $other->slug = 'other';
    $other->is_active = false;
    $other->save();
    $this->actingAs($this->owner)->delete(route('dashboard.admin.themes.settings.reset', $this->theme))->assertRedirect();
    expect($this->theme->fresh()->settings)->toBeNull()
        ->and(app(ThemeSettings::class)->values($this->theme->fresh()))->toBe($values)
        ->and($other->fresh()->settings['primary_color'])->toBe('#be123c');
});

it('allows safe appearance changes on the demo while still blocking theme installation', function () {
    config(['demo.enabled' => true]);
    $this->actingAs($this->owner)->put(route('dashboard.admin.themes.settings.update', $this->theme), [
        'values' => app(ThemeSettings::class)->values($this->theme),
    ])->assertRedirect();
    $this->post(route('dashboard.admin.themes.install'), ['slug' => 'anything'])->assertForbidden();
});

it('inherits child theme controls keeps choices on reinstall and ignores obsolete saved fields', function () {
    $child = Theme::create([
        'name' => 'Child', 'slug' => 'settings-child', 'directory_path' => 'settings-child',
        'parent_theme_id' => $this->theme->id, 'version' => '1.0.0', 'template_engine' => 'react',
        'is_installed' => true, 'settings' => ['primary_color' => '#be123c', 'removed_control' => 'obsolete'],
    ]);
    $settings = app(ThemeSettings::class);
    expect($settings->values($child)['primary_color'])->toBe('#be123c')
        ->and($settings->values($child))->not->toHaveKey('removed_control');
    $this->theme->update(['settings' => ['primary_color' => '#be123c']]);
    $manager = app(ThemeManager::class);
    $manager->installTheme($manager->discoverThemes()->firstWhere('config.slug', 'modern-react'));
    expect($this->theme->fresh()->settings['primary_color'])->toBe('#be123c');
});
