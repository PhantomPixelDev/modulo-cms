<?php

use App\Models\Plugin;
use App\Models\Post;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use Illuminate\Support\Facades\Mail;
use Plugins\ModuloShop\database\seeders\ShopSeeder;
use Plugins\ModuloShop\src\Services\CartService;
use Plugins\ModuloShop\src\Services\ModuloShopSettings;

beforeEach(function () {
    bootShopPlugin($this);
    (new ShopSeeder)->run();
    Mail::fake();
});

function shopTerm(string $taxonomy, string $name): TaxonomyTerm
{
    return TaxonomyTerm::create([
        'taxonomy_id' => Taxonomy::where('slug', $taxonomy)->value('id'),
        'name' => $name,
        'slug' => str($name)->slug(),
    ]);
}

function shopManager(): void
{
    test()->actingAs(makeAdminUserWithPermissions([
        'view shop products', 'edit shop products', 'delete shop products', 'manage shop settings',
    ]));
}

it('keeps categories and tags when an edit does not send them', function () {
    shopManager();
    $product = createShopProduct(['sale_price' => 5, 'custom_flag' => 'keep-me']);
    $shirts = shopTerm('product-category', 'Shirts');
    $summer = shopTerm('product-tag', 'Summer');
    $product->taxonomyTerms()->sync([$shirts->id, $summer->id]);

    $this->putJson(route('dashboard.admin.shop.products.update', $product), ['name' => 'Renamed', 'sale_price' => null])
        ->assertOk();

    $product->refresh();
    expect($product->taxonomyTerms->pluck('id')->sort()->values()->all())->toBe(collect([$shirts->id, $summer->id])->sort()->values()->all())
        ->and($product->meta_data['sale_price'])->toBeNull()
        ->and($product->meta_data['custom_flag'])->toBe('keep-me');

    // Sending only categories replaces the categories and leaves the tags alone.
    $hats = shopTerm('product-category', 'Hats');
    $this->putJson(route('dashboard.admin.shop.products.update', $product), ['categories' => [$hats->id]])->assertOk();

    expect($product->fresh()->taxonomyTerms->pluck('id')->sort()->values()->all())
        ->toBe(collect([$hats->id, $summer->id])->sort()->values()->all());
});

it('only lets shop permissions reach products', function () {
    shopManager();
    $post = Post::factory()->published()->create(['title' => 'A blog post']);

    $this->putJson(route('dashboard.admin.shop.products.update', $post), ['name' => 'Hijacked'])->assertNotFound();
    $this->deleteJson(route('dashboard.admin.shop.products.destroy', $post))->assertNotFound();

    expect($post->fresh()->title)->toBe('A blog post');
});

it('sends the create and edit pages to the product list', function () {
    shopManager();
    $product = createShopProduct();

    $this->get(route('dashboard.admin.shop.products.edit', $product))
        ->assertRedirect(route('dashboard.admin.shop.products.index', ['edit' => $product->id]));

    $this->get(route('dashboard.admin.shop.products.index', ['edit' => $product->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('editProduct.id', $product->id));
});

it('keeps settings the form does not cover when saving', function () {
    shopManager();
    Plugin::where('slug', 'modulo-shop')->delete();
    Plugin::forceCreate([
        'name' => 'Modulo Shop', 'slug' => 'modulo-shop', 'version' => '1.0.0',
        'service_provider' => 'Plugins\\ModuloShop\\ModuloShopServiceProvider', 'is_active' => true,
        'settings' => ['tax_rate' => 21, 'enable_checkout' => true],
    ]);

    $this->putJson(route('dashboard.admin.shop.settings.update'), [
        'store_name' => 'Store', 'currency' => 'EUR', 'currency_position' => 'after',
        'thousand_separator' => '.', 'decimal_separator' => ',', 'decimals' => 2,
        'products_per_page' => 12, 'low_stock_threshold' => 3,
    ])->assertOk();

    $settings = Plugin::where('slug', 'modulo-shop')->value('settings');
    expect($settings['tax_rate'])->toBe(21)
        ->and($settings['enable_checkout'])->toBeTrue()
        ->and($settings['currency'])->toBe('EUR');
});

it('closes checkout when the store owner switches it off', function () {
    Plugin::where('slug', 'modulo-shop')->delete();
    Plugin::forceCreate([
        'name' => 'Modulo Shop', 'slug' => 'modulo-shop', 'version' => '1.0.0',
        'service_provider' => 'Plugins\\ModuloShop\\ModuloShopServiceProvider', 'is_active' => true,
        'settings' => ['enable_checkout' => false],
    ]);
    // Settings are memoized per instance; start from the row just written.
    app()->forgetInstance(ModuloShopSettings::class);

    $product = createShopProduct(['stock' => 5]);
    app(CartService::class)->addItem($product->id, 1);

    $this->postJson('/shop/checkout', [
        'customer_name' => 'Jane', 'customer_email' => 'jane@example.com', 'billing_address_1' => '1 St',
        'billing_city' => 'Town', 'billing_postcode' => '1', 'billing_country' => 'US', 'payment_method' => 'cod',
    ])->assertStatus(503);

    $this->get('/shop/checkout')->assertRedirect('/shop/cart');
});

it('shows the admin screens from the plugin bundle and its sidebar entry', function () {
    Plugin::updateOrCreate(['slug' => 'modulo-shop'], [
        'name' => 'Modulo Shop', 'version' => '1.7.0', 'service_provider' => 'Plugins\ModuloShop\ModuloShopServiceProvider', 'is_active' => true,
    ]);
    $this->actingAs(makeAdminUserWithPermissions(['view shop products', 'view shop orders', 'manage shop settings']));

    $this->get(route('dashboard.admin.shop.products.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Plugins/modulo-shop/Products', false)
            ->where('pluginMenu.0.label', 'Shop')
            ->where('pluginMenu.0.href', '/dashboard/admin/shop/products'));

    $this->get(route('dashboard.admin.shop.orders.index'))->assertInertia(fn ($page) => $page->component('Plugins/modulo-shop/Orders', false));
    $this->get(route('dashboard.admin.shop.settings.index'))->assertInertia(fn ($page) => $page->component('Plugins/modulo-shop/Settings', false));
});
