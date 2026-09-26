<?php

use App\Models\Plugin;
use App\Models\Post;
use App\Models\PostType;
use App\Models\User;
use App\Presenters\PostPresenter;
use App\Services\Plugins\PluginAdminMenu;
use App\Services\SiteSettingsService;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

/**
 * A throwaway plugin directory with the given plugin.json, registered as active.
 */
function demoPlugin(array $manifest = [], bool $active = true): void
{
    $root = storage_path('framework/testing/plugins-'.getmypid());
    File::deleteDirectory($root);
    File::ensureDirectoryExists($root.'/Demo');
    File::put($root.'/Demo/plugin.json', json_encode(array_merge([
        'name' => 'Demo', 'slug' => 'demo', 'version' => '1.0.0', 'service_provider' => 'Plugins\\Demo\\Provider',
    ], $manifest)));
    config(['plugins.path' => $root]);

    Plugin::create(['name' => 'Demo', 'slug' => 'demo', 'version' => '1.0.0', 'service_provider' => 'Plugins\\Demo\\Provider', 'is_active' => $active]);
}

function platformAdmin(): User
{
    $user = makeAdminUserWithPermissions();
    $user->assignRole(Role::findOrCreate('admin', 'web'));

    return $user;
}

afterEach(fn () => File::deleteDirectory(storage_path('framework/testing/plugins-'.getmypid())));

it('builds the sidebar entries plugins declare', function () {
    demoPlugin(['admin' => ['menu' => [
        ['label' => 'Demo', 'icon' => 'puzzle', 'route' => 'dashboard.admin.plugins.index', 'children' => [
            ['label' => 'Reports', 'href' => '/dashboard/admin/demo/reports'],
            ['label' => 'Elsewhere', 'href' => 'https://example.com/steal'],
        ]],
        ['label' => 'Broken', 'route' => 'no.such.route'],
    ]]]);

    expect(app(PluginAdminMenu::class)->for(platformAdmin()))->toBe([[
        'plugin' => 'demo',
        'label' => 'Demo',
        'icon' => 'puzzle',
        'href' => '/dashboard/admin/plugins',
        'children' => [['label' => 'Reports', 'href' => '/dashboard/admin/demo/reports']],
    ]]);
});

it('shows plugin entries only to people with one of their permissions', function () {
    demoPlugin(['admin' => ['menu' => [
        ['label' => 'Orders', 'href' => '/dashboard/admin/demo', 'permissions' => ['view demo orders']],
    ]]]);

    $clerk = makeAdminUserWithPermissions(['view demo orders']);
    $other = makeAdminUserWithPermissions(['view posts']);

    expect(app(PluginAdminMenu::class)->for($clerk))->toHaveCount(1)
        ->and(app(PluginAdminMenu::class)->for($other))->toBe([]);
});

it('leaves inactive plugins out of the sidebar', function () {
    demoPlugin(['admin' => ['menu' => [['label' => 'Demo', 'href' => '/dashboard/admin/demo']]]], active: false);

    expect(app(PluginAdminMenu::class)->for(platformAdmin()))->toBe([]);
});

it('shares the plugin menu with admin pages', function () {
    demoPlugin(['admin' => ['menu' => [['label' => 'Demo', 'href' => '/dashboard/admin/demo']]]]);

    $this->actingAs(platformAdmin())->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('pluginMenu.0.label', 'Demo'));
});

it('builds a settings form from the plugin schema and checks the values', function () {
    demoPlugin([
        'settings' => ['recipient' => '', 'mode' => 'fast'],
        'settings_schema' => [
            ['key' => 'recipient', 'type' => 'email', 'label' => 'Send to', 'required' => true],
            ['key' => 'mode', 'type' => 'select', 'label' => 'Mode', 'options' => ['fast', 'careful']],
            ['key' => 'Bad Key', 'type' => 'text', 'label' => 'Ignored'],
        ],
    ]);
    $this->actingAs(platformAdmin());

    $this->get(route('dashboard.admin.plugins.settings', 'demo'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('settingsSchema', 2)
            ->where('settingsSchema.0.label', 'Send to'));

    $this->put(route('dashboard.admin.plugins.update-settings', 'demo'), ['settings' => ['recipient' => 'nope', 'mode' => 'slow']])
        ->assertSessionHasErrors(['settings.recipient' => 'The Send to field must be a valid email address.', 'settings.mode']);

    $this->put(route('dashboard.admin.plugins.update-settings', 'demo'), ['settings' => ['recipient' => 'shop@example.com', 'mode' => 'careful']])
        ->assertSessionHasNoErrors();
    expect(Plugin::where('slug', 'demo')->value('settings'))->toMatchArray(['recipient' => 'shop@example.com', 'mode' => 'careful']);
});

it('runs the content filters plugins add', function () {
    add_filter('the_title', fn (string $title) => strtoupper($title));
    add_filter('the_content', fn (string $html) => $html.'<p>Signed, the plugin</p>');
    $post = Post::factory()->published()->create(['title' => 'Hello', 'content' => '<p>Body</p>']);

    $presented = app(PostPresenter::class)->presentPost($post);

    expect($presented['title'])->toBe('HELLO')
        ->and($presented['content'])->toContain('Signed, the plugin');
});

it('lets plugins change the site name everywhere', function () {
    add_filter('site_name', fn (string $name) => $name.' Shop');

    $settings = app(SiteSettingsService::class);

    expect($settings->siteName())->toEndWith(' Shop')
        ->and($settings->getPublicSettings()['site_name'])->toEndWith(' Shop');
});

it('tells plugins when content is saved, published and deleted', function () {
    $events = [];
    add_action('post_saved', function (Post $post) use (&$events) {
        $events[] = 'saved:'.$post->slug;
    });
    add_action('post_published', function (Post $post) use (&$events) {
        $events[] = 'published:'.$post->slug;
    });
    add_action('post_deleted', function (Post $post) use (&$events) {
        $events[] = 'deleted:'.$post->slug;
    });
    $type = PostType::factory()->create();

    $post = Post::factory()->create(['post_type_id' => $type->id, 'slug' => 'story', 'status' => 'draft']);
    $post->update(['status' => 'published', 'published_at' => now()]);
    $post->update(['title' => 'Typo fixed']);
    $post->delete();

    // Eloquent fires 'updated' (where publishing is noticed) before 'saved'
    expect($events)->toBe(['saved:story', 'published:story', 'saved:story', 'saved:story', 'deleted:story']);
});
