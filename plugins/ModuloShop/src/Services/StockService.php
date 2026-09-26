<?php

namespace Plugins\ModuloShop\src\Services;

use App\Models\Post;
use Illuminate\Validation\ValidationException;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Support\ProductData;

/**
 * Stock lives in posts.meta_data.stock; null/missing means "not tracked".
 * Call reserve() inside the order's DB transaction so a failure rolls everything back.
 */
class StockService
{
    public function __construct(protected ModuloShopSettings $settings) {}

    /**
     * Lock the products and take the ordered quantities out of stock.
     *
     * @param  array<int|string, int>  $quantities  line key (product id, or "id:variation") => quantity
     *
     * @throws ValidationException when a product is gone or short on stock
     */
    public function reserve(array $quantities): void
    {
        $this->apply($quantities, -1);
    }

    /**
     * Put an order's quantities back into stock (cancellation / refund).
     */
    public function release(Order $order): void
    {
        $this->apply($order->quantities(), 1);
    }

    /**
     * @param  array<int|string, int>  $quantities
     */
    protected function apply(array $quantities, int $direction): void
    {
        if (! $this->enabled() || $quantities === []) {
            return;
        }

        $ids = array_unique(array_map(fn ($key) => ProductData::parseLineKey($key)[0], array_keys($quantities)));
        $products = Post::whereIn('id', $ids)->lockForUpdate()->get()->keyBy('id');
        $problems = [];
        $changed = [];

        foreach ($quantities as $key => $quantity) {
            [$productId, $variantId] = ProductData::parseLineKey($key);
            $product = $products->get($productId);

            if (! $product) {
                if ($direction < 0) {
                    $problems[] = 'A product in your cart is no longer available.';
                }

                continue;
            }

            $meta = $product->meta_data ?? [];

            if ($variantId !== null) {
                $index = collect($meta['variants'] ?? [])->search(fn ($row) => is_array($row) && ($row['id'] ?? null) === $variantId);
                if ($index === false) {
                    if ($direction < 0) {
                        $problems[] = "An option of \"{$product->title}\" is no longer available.";
                    }

                    continue;
                }
                $current = $meta['variants'][$index]['stock'] ?? null;
                $label = "{$product->title} ({$meta['variants'][$index]['name']})";
            } else {
                $current = $meta['stock'] ?? null;
                $label = $product->title;
            }

            if ($current === null || $current === '' || ! is_numeric($current)) {
                continue; // not tracked
            }

            $available = (int) $current;
            if ($direction < 0 && $available < $quantity) {
                $problems[] = $available > 0 ? "Only {$available} of \"{$label}\" left in stock." : "\"{$label}\" is out of stock.";

                continue;
            }

            if ($variantId !== null) {
                $meta['variants'][$index]['stock'] = $available + $direction * $quantity;
            } else {
                $meta['stock'] = $available + $direction * $quantity;
            }
            $product->meta_data = $meta;
            $changed[$product->id] = $product;
        }

        if ($problems !== []) {
            throw ValidationException::withMessages(['cart' => $problems]);
        }

        foreach ($changed as $product) {
            // Quiet: a stock change shouldn't ping search engines or flush every cache
            $product->saveQuietly();
        }
    }

    protected function enabled(): bool
    {
        return (bool) $this->settings->get('enable_stock_management', true);
    }
}
