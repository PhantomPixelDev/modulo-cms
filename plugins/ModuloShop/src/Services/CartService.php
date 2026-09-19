<?php

namespace Plugins\ModuloShop\src\Services;

use App\Models\Post;
use App\Models\PostType;
use Illuminate\Support\Facades\Session;

class CartService
{
    protected const SESSION_KEY = 'shop_cart';

    /** @var array<int, Post|null> Products loaded during this request */
    protected array $products = [];

    protected PostType|false|null $productType = false;

    public function __construct(protected ModuloShopSettings $settings) {}

    public function getCart(): array
    {
        return Session::get(self::SESSION_KEY, [
            'items' => [],
            'currency' => 'USD',
        ]);
    }

    public function getItems(): array
    {
        return $this->getCart()['items'] ?? [];
    }

    public function addItem(int $productId, int $quantity = 1): array
    {
        $product = $this->getProduct($productId);

        if (! $product) {
            throw new \InvalidArgumentException('Product not found');
        }

        $meta = $product->meta_data ?? [];
        $stock = $meta['stock'] ?? null;

        // Check stock
        if ($stock !== null) {
            $currentQty = $this->getItemQuantity($productId);
            if ($currentQty + $quantity > $stock) {
                throw new \InvalidArgumentException('Not enough stock available');
            }
        }

        $cart = $this->getCart();
        $items = $cart['items'];

        $itemKey = $this->findItemKey($productId);

        if ($itemKey !== null) {
            $items[$itemKey]['quantity'] += $quantity;
        } else {
            $items[] = [
                'product_id' => $productId,
                'quantity' => $quantity,
                'added_at' => now()->toISOString(),
            ];
        }

        $cart['items'] = $items;

        $this->saveCart($cart);

        return $this->getCartWithProducts();
    }

    public function updateItemQuantity(int $productId, int $quantity): array
    {
        if ($quantity <= 0) {
            return $this->removeItem($productId);
        }

        $product = $this->getProduct($productId);

        if (! $product) {
            throw new \InvalidArgumentException('Product not found');
        }

        $meta = $product->meta_data ?? [];
        $stock = $meta['stock'] ?? null;

        if ($stock !== null && $quantity > $stock) {
            throw new \InvalidArgumentException('Not enough stock available');
        }

        $cart = $this->getCart();
        $itemKey = $this->findItemKey($productId);

        if ($itemKey !== null) {
            $cart['items'][$itemKey]['quantity'] = $quantity;
            $this->saveCart($cart);
        }

        return $this->getCartWithProducts();
    }

    public function removeItem(int $productId): array
    {
        $cart = $this->getCart();
        $itemKey = $this->findItemKey($productId);

        if ($itemKey !== null) {
            unset($cart['items'][$itemKey]);
            $cart['items'] = array_values($cart['items']);
            $this->saveCart($cart);
        }

        return $this->getCartWithProducts();
    }

    public function clear(): void
    {
        Session::forget(self::SESSION_KEY);
    }

    public function getItemCount(): int
    {
        $items = $this->getItems();

        return array_sum(array_column($items, 'quantity'));
    }

    public function getItemQuantity(int $productId): int
    {
        $itemKey = $this->findItemKey($productId);

        if ($itemKey !== null) {
            $items = $this->getItems();

            return $items[$itemKey]['quantity'] ?? 0;
        }

        return 0;
    }

    public function getCartWithProducts(): array
    {
        $cart = $this->getCart();
        $items = [];
        $subtotal = 0;
        $currency = $this->settings->currency();

        // One query for all products instead of two per cart line
        $this->loadProducts(array_column($cart['items'], 'product_id'));

        foreach ($cart['items'] as $item) {
            $product = $this->getProduct($item['product_id']);

            if (! $product) {
                continue;
            }

            $meta = $product->meta_data ?? [];
            $price = (float) ($meta['sale_price'] ?? $meta['price'] ?? 0);
            $originalPrice = (float) ($meta['price'] ?? 0);
            $itemSubtotal = $price * $item['quantity'];
            $subtotal += $itemSubtotal;

            $items[] = [
                'product_id' => $product->id,
                'product_name' => $product->title,
                'product_slug' => $product->slug,
                'product_image' => $product->featured_image,
                'product_url' => url('/shop/'.$product->slug),
                'sku' => $meta['sku'] ?? null,
                'price' => $price,
                'original_price' => $originalPrice,
                'quantity' => $item['quantity'],
                'subtotal' => $itemSubtotal,
                'stock' => $meta['stock'] ?? null,
                'in_stock' => ! isset($meta['stock']) || $meta['stock'] > 0,
            ];
        }

        return [
            'items' => $items,
            'item_count' => $this->getItemCount(),
            'subtotal' => $subtotal,
            'currency' => $currency,
            'is_empty' => empty($items),
        ];
    }

    /**
     * Pass an already built cart to avoid loading it twice.
     */
    public function getTotals(?array $cart = null): array
    {
        $cart ??= $this->getCartWithProducts();

        return [
            'subtotal' => $cart['subtotal'],
            'discount' => 0,
            'shipping' => 0,
            'tax' => 0,
            'total' => $cart['subtotal'],
            'currency' => $cart['currency'],
        ];
    }

    protected function saveCart(array $cart): void
    {
        Session::put(self::SESSION_KEY, $cart);
    }

    protected function findItemKey(int $productId): ?int
    {
        $items = $this->getItems();

        foreach ($items as $key => $item) {
            if ($item['product_id'] === $productId) {
                return $key;
            }
        }

        return null;
    }

    protected function getProduct(int $productId): ?Post
    {
        if (! array_key_exists($productId, $this->products)) {
            $this->loadProducts([$productId]);
        }

        return $this->products[$productId] ?? null;
    }

    /**
     * @param  array<int, int>  $ids
     */
    protected function loadProducts(array $ids): void
    {
        $missing = array_values(array_diff(array_unique($ids), array_keys($this->products)));
        if ($missing === []) {
            return;
        }

        if ($this->productType === false) {
            $this->productType = PostType::where('slug', 'product')->first();
        }

        $found = $this->productType
            ? Post::whereIn('id', $missing)
                ->where('post_type_id', $this->productType->id)
                ->published()
                ->get()
                ->keyBy('id')
            : collect();

        foreach ($missing as $id) {
            $this->products[$id] = $found->get($id);
        }
    }
}
