<?php

use App\Models\Post;
use App\Models\PostType;
use App\Models\User;
use App\Services\InstallService;
use App\Services\ThemeManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Plugins\ModuloShop\ModuloShopServiceProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

uses(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

beforeEach(function () {
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    // Treat the site as installed unless a test says otherwise, so the
    // installer redirect does not swallow unrelated requests.
    markInstalled();
});

afterEach(function () {
    markNotInstalled();
});

function installLockPath(): string
{
    return storage_path(InstallService::LOCK_FILE);
}

function markInstalled(): void
{
    File::delete(installProgressPath());
    File::put(installLockPath(), 'testing');
}

function markNotInstalled(): void
{
    File::delete(installLockPath());
    File::delete(installProgressPath());
}

function installProgressPath(): string
{
    return storage_path(InstallService::PROGRESS_FILE);
}

/**
 * A wizard run that has started but not finished -- the state the installer is
 * in from the moment someone loads it until they press Finish.
 */
function markInstalling(): void
{
    markNotInstalled();
    File::put(installProgressPath(), 'testing');
}

function makeAdminUserWithPermissions(array $perms = []): User
{
    $user = User::factory()->create();

    $allPerms = array_values(array_unique(array_merge(['access admin'], $perms)));
    foreach ($allPerms as $perm) {
        Permission::findOrCreate($perm, 'web');
    }

    $user->givePermissionTo($allPerms);

    return $user;
}

/**
 * Register the ModuloShop plugin and run its migrations for the current test.
 */
function bootShopPlugin(TestCase $test): void
{
    app()->register(ModuloShopServiceProvider::class);
    // Routes added after boot need their names indexed for route()
    app('router')->getRoutes()->refreshNameLookups();

    $test->artisan('migrate', [
        '--path' => 'plugins/ModuloShop/database/migrations',
        '--realpath' => false,
    ]);
}

function createShopProduct(array $meta = []): Post
{
    $postType = PostType::where('name', 'product')->first()
        ?? PostType::factory()->create([
            'name' => 'product',
            'slug' => 'product',
            'route_prefix' => 'shop',
        ]);

    return Post::factory()->published()->create([
        'post_type_id' => $postType->id,
        'meta_data' => array_merge([
            'price' => 29.99,
            'currency' => 'USD',
            'sku' => 'SKU-TEST',
        ], $meta),
    ]);
}

/**
 * Install and activate a bundled React theme so frontend routes can render.
 */
function activateReactTheme(string $slug = 'modern-react'): void
{
    $manager = app(ThemeManager::class);
    $theme = $manager->discoverThemes()->firstWhere('config.slug', $slug);
    $manager->installTheme($theme);
    $manager->activateTheme($slug);
}

/**
 * Create a published page (post type "page", served at /{slug}).
 */
function makePublishedPage(array $attributes = []): Post
{
    $pageType = PostType::where('name', 'page')->first()
        ?? PostType::factory()->create([
            'name' => 'page',
            'slug' => 'page',
            'label' => 'Page',
            'route_prefix' => null,
            'has_comments' => false,
        ]);

    return Post::factory()->published()->create(array_merge([
        'post_type_id' => $pageType->id,
    ], $attributes));
}

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/
