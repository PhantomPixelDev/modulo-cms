<?php

use App\Models\ApiToken;
use App\Models\Locale;
use App\Models\MediaBucket;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Post;
use App\Models\PostAutosave;
use App\Models\PostType;
use App\Models\SiteSetting;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use App\Services\MenuService;
use App\Services\SvgValidator;
use App\Support\ActivityLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

it('keeps published content of private post types out of anonymous API reads', function () {
    $type = PostType::factory()->create(['is_public' => false]);
    $post = Post::factory()->published()->create(['post_type_id' => $type->id]);

    $this->getJson('/api/v1/posts')->assertOk()->assertJsonCount(0, 'data');
    $this->getJson('/api/v1/posts/'.$post->slug)->assertNotFound();
});

it('requires the read ability to see unpublished content', function () {
    $type = PostType::factory()->create(['name' => 'post', 'slug' => 'post', 'is_public' => true]);
    $post = Post::factory()->create(['post_type_id' => $type->id, 'status' => 'draft']);
    $user = makeAdminUserWithPermissions(['view posts']);
    [, $plain] = ApiToken::issue($user, 'write only', ['write']);
    $headers = ['Authorization' => 'Bearer '.$plain];

    $this->getJson('/api/v1/posts?status=any', $headers)->assertOk()->assertJsonCount(0, 'data');
    $this->getJson('/api/v1/posts/'.$post->slug, $headers)->assertNotFound();
});

it('checks page publishing permission even when the API receives the type slug', function () {
    PostType::factory()->create(['name' => 'page', 'slug' => 'pages']);
    $user = makeAdminUserWithPermissions(['create posts', 'publish posts']);
    [, $plain] = ApiToken::issue($user, 'writer', ['write']);

    $this->postJson('/api/v1/posts', ['type' => 'pages', 'title' => 'Page', 'status' => 'published'], [
        'Authorization' => 'Bearer '.$plain,
    ])->assertUnprocessable()->assertJsonValidationErrors('status');
    expect(Post::count())->toBe(0);
});

it('rejects executable menu URLs and translated URLs', function (string $url) {
    $menu = Menu::create(['name' => 'Main', 'slug' => 'main']);
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'native_name' => 'English', 'is_active' => true]);
    $this->actingAs(makeAdminUserWithPermissions(['edit menus']));

    $this->postJson(route('dashboard.admin.menu-items.store'), [
        'menu_id' => $menu->id, 'label' => 'Unsafe', 'url' => $url,
    ])->assertUnprocessable()->assertJsonValidationErrors('url');
    $this->postJson(route('dashboard.admin.menu-items.store'), [
        'menu_id' => $menu->id, 'label' => 'Unsafe', 'url' => '/',
        'translations' => [['locale' => 'en', 'url' => $url]],
    ])->assertUnprocessable()->assertJsonValidationErrors('translations.0.url');
})->with(['javascript:alert(1)', "java\tscript:alert(1)", 'javascript&#58;alert(1)', 'data:text/html,<script>alert(1)</script>']);

it('neutralizes unsafe menu URLs that already exist in the database', function () {
    $menu = Menu::create(['name' => 'Main', 'slug' => 'main']);
    $item = MenuItem::create(['menu_id' => $menu->id, 'label' => 'Old', 'url' => 'javascript:alert(1)']);
    $item->setTranslation('en', ['label' => 'Old', 'url' => 'data:text/html,bad']);
    $tree = app(MenuService::class)->buildMenuTree($menu->fresh('items'));

    expect($item->resolveUrl('en'))->toBe('#')
        ->and($tree['items'][0]['url'])->toBe('#');
});

it('rejects menu parents from another menu', function () {
    $menu = Menu::create(['name' => 'Main', 'slug' => 'main']);
    $other = Menu::create(['name' => 'Other', 'slug' => 'other']);
    $parent = MenuItem::create(['menu_id' => $other->id, 'label' => 'Other']);

    $this->actingAs(makeAdminUserWithPermissions(['edit menus']))->postJson(route('dashboard.admin.menu-items.store'), [
        'menu_id' => $menu->id, 'label' => 'Wrong menu', 'parent_id' => $parent->id,
    ])->assertUnprocessable()->assertJsonValidationErrors('parent_id');
});

it('rejects menu cycles and nesting beyond the builder limit', function () {
    $menu = Menu::create(['name' => 'Main', 'slug' => 'main']);
    $root = MenuItem::create(['menu_id' => $menu->id, 'label' => 'Root']);
    $child = MenuItem::create(['menu_id' => $menu->id, 'label' => 'Child', 'parent_id' => $root->id]);
    $leaf = MenuItem::create(['menu_id' => $menu->id, 'label' => 'Leaf', 'parent_id' => $child->id]);
    $this->actingAs(makeAdminUserWithPermissions(['edit menus']));

    $this->putJson(route('dashboard.admin.menu-items.update', $root), [
        'label' => 'Root', 'parent_id' => $child->id,
    ])->assertUnprocessable()->assertJsonValidationErrors('parent_id');
    $this->postJson(route('dashboard.admin.menu-items.store'), [
        'menu_id' => $menu->id, 'label' => 'Too deep', 'parent_id' => $leaf->id,
    ])->assertUnprocessable()->assertJsonValidationErrors('parent_id');
    expect($root->fresh()->parent_id)->toBeNull();
});

it('rejects moving a menu subtree to a different menu through an item update', function () {
    $menu = Menu::create(['name' => 'Main', 'slug' => 'main']);
    $other = Menu::create(['name' => 'Other', 'slug' => 'other']);
    $root = MenuItem::create(['menu_id' => $menu->id, 'label' => 'Root']);
    MenuItem::create(['menu_id' => $menu->id, 'label' => 'Child', 'parent_id' => $root->id]);

    $this->actingAs(makeAdminUserWithPermissions(['edit menus']))->putJson(route('dashboard.admin.menu-items.update', $root), [
        'label' => 'Root', 'menu_id' => $other->id,
    ])->assertUnprocessable()->assertJsonValidationErrors('menu_id');
});

it('rejects media folder cycles', function () {
    $root = MediaBucket::create(['name' => 'Root']);
    $child = MediaBucket::create(['name' => 'Child', 'parent_id' => $root->id]);
    $this->actingAs(makeAdminUserWithPermissions(['edit media']));

    foreach ([$root->id, $child->id] as $parentId) {
        $this->putJson(route('dashboard.admin.media.folders.update', $root), ['parent_id' => $parentId])
            ->assertUnprocessable()->assertJsonValidationErrors('parent_id');
    }
    expect($root->fresh()->parent_id)->toBeNull();
});

it('updates and deletes the requested media folder through route binding', function () {
    $folder = MediaBucket::create(['name' => 'Original']);
    $this->actingAs(makeAdminUserWithPermissions(['edit media', 'delete media']));

    $this->putJson(route('dashboard.admin.media.folders.update', $folder), ['name' => 'Renamed'])->assertRedirect();
    expect($folder->fresh()->name)->toBe('Renamed')->and(MediaBucket::count())->toBe(1);
    $this->deleteJson(route('dashboard.admin.media.folders.destroy', $folder))->assertRedirect();
    expect(MediaBucket::find($folder->id))->toBeNull();
    $this->putJson(route('dashboard.admin.media.folders.update', 999999), ['name' => 'Missing'])->assertNotFound();
});

it('allows safe static SVG graphics with local gradients', function () {
    expect(app(SvgValidator::class)->isSafe('<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="paint"><stop offset="0" stop-color="red"/></linearGradient></defs><rect width="10" height="10" fill="url(#paint)"/></svg>'))->toBeTrue();
});

it('rejects entity encoded script URLs and animated links in SVG uploads', function (string $svg) {
    Storage::fake('public');
    SiteSetting::set('allow_svg_uploads', true, 'media', 'boolean');

    $this->actingAs(makeAdminUserWithPermissions(['upload media']))->post(route('dashboard.admin.media.store'), [
        'file' => UploadedFile::fake()->createWithContent('unsafe.svg', $svg),
    ])->assertSessionHas('error');
    expect(Media::count())->toBe(0);
})->with([
    '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript&#58;alert(1)"><text>click</text></a></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><a><set attributeName="href" to="javascript:alert(1)"/><text>click</text></a></svg>',
]);

it('separates page cache entries by visitor locale', function () {
    config(['content.page_cache.enabled' => true]);
    activateReactTheme();
    makePublishedPage(['slug' => 'about']);
    foreach (['en', 'de'] as $code) {
        Locale::firstOrCreate(['code' => $code], ['name' => $code, 'native_name' => $code, 'is_active' => true]);
    }
    Locale::clearCache();

    $this->withSession(['locale' => 'en'])->get('/about')->assertHeader('X-Page-Cache', 'miss')->assertSee('<html lang="en">', false);
    $this->withSession(['locale' => 'de'])->get('/about')->assertHeader('X-Page-Cache', 'miss')->assertSee('<html lang="de">', false);
    $this->withSession(['locale' => 'en'])->get('/about')->assertHeader('X-Page-Cache', 'hit')->assertSee('<html lang="en">', false);
});

it('keeps public pages cached while editors autosave and audit entries are written', function () {
    config(['content.page_cache.enabled' => true]);
    activateReactTheme();
    $page = makePublishedPage(['slug' => 'about']);
    $user = makeAdminUserWithPermissions(['edit posts']);
    $this->get('/about')->assertHeader('X-Page-Cache', 'miss');

    PostAutosave::create(['post_id' => $page->id, 'user_id' => $user->id, 'title' => 'Unsaved draft']);
    ActivityLog::record('auth.failed', 'Failed login attempt');

    $this->get('/about')->assertHeader('X-Page-Cache', 'hit')->assertDontSee('Unsaved draft');
    $page->update(['title' => 'Saved change']);
    $this->get('/about')->assertHeader('X-Page-Cache', 'miss')->assertSee('Saved change');
});

it('bypasses page caching when a guest session contains personal plugin data', function () {
    config(['content.page_cache.enabled' => true]);
    activateReactTheme();
    makePublishedPage(['slug' => 'about']);
    $this->get('/about')->assertHeader('X-Page-Cache', 'miss');

    $this->withSession(['shop.cart' => ['items' => [1]]])->get('/about')->assertHeaderMissing('X-Page-Cache');
});

it('rejects array search terms and ignores malformed locale preferences', function () {
    activateReactTheme();
    $this->getJson('/search?q[]=bad')->assertUnprocessable()->assertJsonValidationErrors('q');
    $this->get('/?lang[]=bad')->assertOk();
});

it('rejects taxonomy term cycles through the resource route', function () {
    $taxonomy = Taxonomy::create(['name' => 'category', 'slug' => 'category', 'label' => 'Category', 'plural_label' => 'Categories']);
    $root = TaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'Root', 'slug' => 'root']);
    $child = TaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'Child', 'slug' => 'child', 'parent_id' => $root->id]);
    $this->actingAs(makeAdminUserWithPermissions(['edit taxonomy terms']));

    foreach ([$root->id, $child->id] as $parentId) {
        $this->putJson(route('dashboard.admin.taxonomy-terms.update', $root), [
            'taxonomy_id' => $taxonomy->id, 'name' => $root->name, 'parent_id' => $parentId,
        ])->assertUnprocessable()->assertJsonValidationErrors('parent_id');
    }
    expect($root->fresh()->parent_id)->toBeNull();
});

it('does not move taxonomy subtrees across taxonomies', function () {
    $taxonomy = Taxonomy::create(['name' => 'category', 'slug' => 'category', 'label' => 'Category', 'plural_label' => 'Categories']);
    $other = Taxonomy::create(['name' => 'other', 'slug' => 'other', 'label' => 'Other', 'plural_label' => 'Others']);
    $root = TaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'Root', 'slug' => 'root']);
    TaxonomyTerm::create(['taxonomy_id' => $taxonomy->id, 'name' => 'Child', 'slug' => 'child', 'parent_id' => $root->id]);

    $this->actingAs(makeAdminUserWithPermissions(['edit taxonomy terms']))->putJson(route('dashboard.admin.taxonomy-terms.update', $root), [
        'taxonomy_id' => $other->id, 'name' => $root->name,
    ])->assertUnprocessable()->assertJsonValidationErrors('taxonomy_id');
    expect($root->fresh()->taxonomy_id)->toBe($taxonomy->id);
});
