<?php

use App\Models\Theme;
use App\Services\ThemeManager;
use App\Services\ThemeValidator;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;

it('denies the catalog to users without authoring or theme permission', function () {
    foreach (['view themes', 'create posts', 'edit posts', 'create pages', 'edit pages'] as $permission) {
        Permission::findOrCreate($permission, 'web');
    }
    $this->actingAs(makeAdminUserWithPermissions([]))->get(route('dashboard.admin.partials.index'))->assertForbidden();
});

it('lets authors browse only renderable modules from the active theme', function (string $permission) {
    activateReactTheme();
    $this->actingAs(makeAdminUserWithPermissions([$permission]))->get(route('dashboard.admin.partials.index'))
        ->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->component('admin/partials/Index')
        ->where('adminSection', 'partials')
        ->where('themeName', 'Modern React')
        ->has('partialCatalog', 2)
        ->where('partialCatalog.0.name', 'callout')
        ->where('partialCatalog.0.label', 'Callout')
        ->where('partialCatalog.0.defaults.tone', 'info')
        ->where('partialCatalog.1.name', 'disclosure'));
})->with(['create posts', 'edit posts', 'create pages', 'edit pages', 'view themes']);

it('shows an empty catalog without an active theme', function () {
    Theme::query()->update(['is_active' => false]);
    app(ThemeManager::class)->clearCache();
    $this->actingAs(makeAdminUserWithPermissions(['create pages']))->get(route('dashboard.admin.partials.index'))
        ->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('themeName', null)->has('partialCatalog', 0));
});

it('lists inherited modules while respecting child overrides and disabled modules', function () {
    activateReactTheme();
    $parent = Theme::where('slug', 'modern-react')->firstOrFail();
    $parent->update(['is_active' => false]);
    Theme::create([
        'name' => 'Catalog child', 'slug' => 'catalog-child', 'directory_path' => 'catalog-child',
        'version' => '1.0.0', 'parent_theme_id' => $parent->id, 'is_active' => true, 'is_installed' => true,
        'partials' => ['callout' => ['shortcode' => false]],
    ]);
    app(ThemeManager::class)->clearCache();
    $this->actingAs(makeAdminUserWithPermissions(['edit posts']))->get(route('dashboard.admin.partials.index'))
        ->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->has('partialCatalog', 1)->where('partialCatalog.0.name', 'disclosure'));
});

it('validates optional catalog hints', function () {
    $config = json_decode(file_get_contents(resource_path('themes/modern-react/theme.json')), true);
    $config['partials']['callout']['label'] = [];
    $config['partials']['callout']['body'] = 'false';
    $validator = app(ThemeValidator::class);
    expect($validator->validate($config, resource_path('themes/modern-react')))->toBeFalse()
        ->and(implode(' ', $validator->getErrors()))->toContain('label must be a string', 'body must be a boolean');
});
