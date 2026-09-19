<?php

use App\Models\Post;

beforeEach(function () {
    bootShopPlugin($this);
});

function productPrices($response): array
{
    return collect($response->json('products.data'))
        ->map(fn ($p) => (float) $p['meta_data']['price'])
        ->all();
}

it('sorts and filters products by price', function () {
    createShopProduct(['price' => 30]);
    createShopProduct(['price' => 10]);
    createShopProduct(['price' => 20]);

    $asc = $this->getJson('/shop?orderby=price&order=asc')->assertOk();
    expect(productPrices($asc))->toBe([10.0, 20.0, 30.0]);

    $filtered = $this->getJson('/shop?min_price=15&max_price=25')->assertOk();
    expect(productPrices($filtered))->toBe([20.0]);
});

it('does not interpolate the sort direction into sql', function () {
    createShopProduct(['price' => 10]);

    // Interpolated raw, the quote breaks the query (a 500); whitelisted, it's ignored
    $this->getJson('/shop?orderby=price&order='.urlencode("desc, (SELECT 'x"))
        ->assertOk();

    expect(Post::count())->toBe(1);
});

it('caps the page size', function () {
    createShopProduct();

    $this->getJson('/shop?per_page=100000')
        ->assertOk()
        ->assertJsonPath('products.per_page', 60);
});
