<?php

namespace Plugins\ModuloShop\src\Services;

use App\Models\Post;
use Illuminate\Validation\ValidationException;
use Plugins\ModuloShop\src\Models\Order;

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
     * @param  array<int, int>  $quantities  product id => quantity
     *
     * @throws ValidationException when a product is gone or short on stock
     */
    public function reserve(array $quantities): void
    {
        if (! $this->enabled() || $quantities === []) {
            return;
        }

        $products = Post::whereIn('id', array_keys($quantities))->lockForUpdate()->get()->keyBy('id');
        $problems = [];

        foreach ($quantities as $productId => $quantity) {
            $product = $products->get($productId);
            if (! $product) {
                $problems[] = 'A product in your cart is no longer available.';

                continue;
            }

            $meta = $product->meta_data ?? [];
            if (! $this->tracksStock($meta)) {
                continue;
            }

            $available = (int) $meta['stock'];
            if ($available < $quantity) {
                $problems[] = $available > 0
                    ? "Only {$available} of \"{$product->title}\" left in stock."
                    : "\"{$product->title}\" is out of stock.";

                continue;
            }

            $meta['stock'] = $available - $quantity;
            $product->meta_data = $meta;
            // Quiet: a stock change shouldn't ping search engines or flush every cache
            $product->saveQuietly();
        }

        if ($problems !== []) {
            throw ValidationException::withMessages(['cart' => $problems]);
        }
    }

    /**
     * Put an order's quantities back into stock (cancellation / refund).
     */
    public function release(Order $order): void
    {
        if (! $this->enabled()) {
            return;
        }

        $quantities = $order->items()
            ->whereNotNull('product_id')
            ->get()
            ->groupBy('product_id')
            ->map(fn ($items) => (int) $items->sum('quantity'));

        $products = Post::whereIn('id', $quantities->keys())->lockForUpdate()->get();

        foreach ($products as $product) {
            $meta = $product->meta_data ?? [];
            if (! $this->tracksStock($meta)) {
                continue;
            }

            $meta['stock'] = (int) $meta['stock'] + $quantities[$product->id];
            $product->meta_data = $meta;
            $product->saveQuietly();
        }
    }

    protected function enabled(): bool
    {
        return (bool) $this->settings->get('enable_stock_management', true);
    }

    protected function tracksStock(array $meta): bool
    {
        return isset($meta['stock']) && $meta['stock'] !== '' && is_numeric($meta['stock']);
    }
}
