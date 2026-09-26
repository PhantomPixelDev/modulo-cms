<?php

namespace Plugins\ModuloShop\src\Services;

use App\Models\Post;
use App\Models\PostType;
use Illuminate\Support\Facades\Session;
use Plugins\ModuloShop\src\Models\Coupon;
use Plugins\ModuloShop\src\Support\ProductData;

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

    public function addItem(int $productId, int $quantity = 1, ?string $variantId = null): array
    {
        [$product, $variant] = $this->resolve($productId, $variantId);
        $stock = $this->stockOf($product, $variant);

        if ($stock !== null && $this->getItemQuantity($productId, $variantId) + $quantity > $stock) {
            throw new \InvalidArgumentException('Not enough stock available');
        }

        $cart = $this->getCart();
        $itemKey = $this->findItemKey($productId, $variantId);

        if ($itemKey !== null) {
            $cart['items'][$itemKey]['quantity'] += $quantity;
        } else {
            $cart['items'][] = [
                'product_id' => $productId,
                'variant_id' => $variant['id'] ?? null,
                'quantity' => $quantity,
                'added_at' => now()->toISOString(),
            ];
        }

        $this->saveCart($cart);

        return $this->getCartWithProducts();
    }

    public function updateItemQuantity(int $productId, int $quantity, ?string $variantId = null): array
    {
        if ($quantity <= 0) {
            return $this->removeItem($productId, $variantId);
        }

        [$product, $variant] = $this->resolve($productId, $variantId);
        $stock = $this->stockOf($product, $variant);

        if ($stock !== null && $quantity > $stock) {
            throw new \InvalidArgumentException('Not enough stock available');
        }

        $cart = $this->getCart();
        $itemKey = $this->findItemKey($productId, $variantId);

        if ($itemKey !== null) {
            $cart['items'][$itemKey]['quantity'] = $quantity;
            $this->saveCart($cart);
        }

        return $this->getCartWithProducts();
    }

    public function removeItem(int $productId, ?string $variantId = null): array
    {
        $cart = $this->getCart();
        $itemKey = $this->findItemKey($productId, $variantId);

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

    public function getItemQuantity(int $productId, ?string $variantId = null): int
    {
        $itemKey = $this->findItemKey($productId, $variantId);

        return $itemKey !== null ? (int) ($this->getItems()[$itemKey]['quantity'] ?? 0) : 0;
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
            $variantId = $item['variant_id'] ?? null;
            $variant = $variantId !== null ? ProductData::variant($meta, $variantId) : null;

            // A variation that was deleted since: the line can't be bought any more
            if ($variantId !== null && $variant === null) {
                continue;
            }

            $price = ProductData::unitPrice($meta, $variant);
            $itemSubtotal = round($price * $item['quantity'], 2);
            $subtotal += $itemSubtotal;
            $stock = $this->stockOf($product, $variant);

            $items[] = [
                'key' => ProductData::lineKey($product->id, $variantId),
                'product_id' => $product->id,
                'variant_id' => $variantId,
                'variant_name' => $variant['name'] ?? null,
                'product_name' => $product->title,
                'product_slug' => $product->slug,
                'product_image' => $product->featured_image,
                'product_url' => url('/shop/'.$product->slug),
                'sku' => $variant['sku'] ?? $meta['sku'] ?? null,
                'price' => $price,
                'original_price' => (float) ($variant['price'] ?? $meta['price'] ?? 0),
                'quantity' => $item['quantity'],
                'subtotal' => $itemSubtotal,
                'stock' => $stock,
                'in_stock' => $stock === null || $stock > 0,
            ];
        }

        return [
            'items' => $items,
            'item_count' => $this->getItemCount(),
            'subtotal' => round($subtotal, 2),
            'currency' => $currency,
            'is_empty' => empty($items),
        ];
    }

    /**
     * Stock quantities per cart line (product, or product:variation), as
     * StockService takes them.
     *
     * @param  array<string, mixed>  $cart  From getCartWithProducts()
     * @return array<string, int>
     */
    public function quantities(array $cart): array
    {
        $quantities = [];
        foreach ($cart['items'] as $item) {
            $key = ProductData::lineKey((int) $item['product_id'], $item['variant_id'] ?? null);
            $quantities[$key] = ($quantities[$key] ?? 0) + (int) $item['quantity'];
        }

        return $quantities;
    }

    /**
     * @return array{0: Post, 1: array<string, mixed>|null}
     */
    protected function resolve(int $productId, ?string $variantId): array
    {
        $product = $this->getProduct($productId);

        if (! $product) {
            throw new \InvalidArgumentException('Product not found');
        }

        $meta = $product->meta_data ?? [];
        $hasVariants = ProductData::variants($meta) !== [];

        if ($hasVariants && ($variantId === null || $variantId === '')) {
            throw new \InvalidArgumentException('Please choose an option first');
        }

        $variant = $hasVariants ? ProductData::variant($meta, $variantId) : null;

        if ($hasVariants && $variant === null) {
            throw new \InvalidArgumentException('That option is no longer available');
        }

        return [$product, $variant];
    }

    /**
     * @param  array<string, mixed>|null  $variant
     */
    protected function stockOf(Post $product, ?array $variant): ?int
    {
        if (! $this->settings->get('enable_stock_management', true)) {
            return null;
        }

        if ($variant !== null) {
            return $variant['stock'];
        }

        $stock = ($product->meta_data ?? [])['stock'] ?? null;

        return $stock === null || $stock === '' ? null : (int) $stock;
    }

    /**
     * Pass an already built cart to avoid loading it twice.
     *
     * A coupon that stopped applying (expired, cart now below its minimum) is
     * reported in coupon_error and left out of the totals, not silently kept.
     */
    public function getTotals(?array $cart = null): array
    {
        $cart ??= $this->getCartWithProducts();
        $state = $this->getCart();

        return [
            ...app(PriceCalculator::class)->calculate(
                (float) $cart['subtotal'],
                $state['shipping_method'] ?? null,
                Coupon::findByCode($state['coupon_code'] ?? null),
            ),
            'currency' => $cart['currency'],
        ];
    }

    public function setShippingMethod(?string $methodId): void
    {
        $cart = $this->getCart();
        $cart['shipping_method'] = $methodId;
        $this->saveCart($cart);
    }

    /**
     * Remember a coupon for this cart. Returns why it can't be used, or null.
     */
    public function applyCoupon(string $code): ?string
    {
        $coupon = Coupon::findByCode($code);

        if (! $coupon) {
            return 'That coupon code is not valid.';
        }

        $reason = $coupon->unusableReason((float) $this->getCartWithProducts()['subtotal']);
        if ($reason !== null) {
            return $reason;
        }

        $cart = $this->getCart();
        $cart['coupon_code'] = $coupon->code;
        $this->saveCart($cart);

        return null;
    }

    public function removeCoupon(): void
    {
        $cart = $this->getCart();
        unset($cart['coupon_code']);
        $this->saveCart($cart);
    }

    protected function saveCart(array $cart): void
    {
        Session::put(self::SESSION_KEY, $cart);
    }

    protected function findItemKey(int $productId, ?string $variantId = null): ?int
    {
        foreach ($this->getItems() as $key => $item) {
            if ($item['product_id'] === $productId && ($item['variant_id'] ?? null) === ($variantId ?: null)) {
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
