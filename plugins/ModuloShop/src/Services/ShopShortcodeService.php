<?php

namespace Plugins\ModuloShop\src\Services;

use App\Models\Post;
use App\Models\PostType;
use App\Services\ShortcodeService;
use Illuminate\Support\Facades\View;

class ShopShortcodeService
{
    protected ShortcodeService $shortcodeService;
    protected ?PostType $productType = null;

    public function __construct(ShortcodeService $shortcodeService)
    {
        $this->shortcodeService = $shortcodeService;
        $this->registerShortcodes();
    }

    protected function getProductType(): ?PostType
    {
        if ($this->productType === null) {
            $this->productType = PostType::where('name', 'product')->first();
        }
        return $this->productType;
    }

    protected function registerShortcodes(): void
    {
        // [products] - Display product grid/list
        $this->shortcodeService->register('products', [$this, 'renderProducts']);

        // [product id="X"] - Display single product
        $this->shortcodeService->register('product', [$this, 'renderProduct']);

        // [product_grid] - Display products in grid layout
        $this->shortcodeService->register('product_grid', [$this, 'renderProductGrid']);

        // [product_slider] - Display products in slider/carousel
        $this->shortcodeService->register('product_slider', [$this, 'renderProductSlider']);

        // [product_categories] - Display product categories
        $this->shortcodeService->register('product_categories', [$this, 'renderProductCategories']);

        // [featured_products] - Display featured products
        $this->shortcodeService->register('featured_products', [$this, 'renderFeaturedProducts']);

        // [sale_products] - Display products on sale
        $this->shortcodeService->register('sale_products', [$this, 'renderSaleProducts']);

        // [add_to_cart id="X"] - Add to cart button
        $this->shortcodeService->register('add_to_cart', [$this, 'renderAddToCart']);

        // [product_price id="X"] - Display product price
        $this->shortcodeService->register('product_price', [$this, 'renderProductPrice']);
    }

    /**
     * [products limit="12" columns="4" category="slug" orderby="date" order="desc"]
     */
    public function renderProducts(array $attrs): string
    {
        $productType = $this->getProductType();
        if (!$productType) {
            return '<!-- Product post type not found -->';
        }

        $limit = (int) ($attrs['limit'] ?? 12);
        $columns = (int) ($attrs['columns'] ?? 4);
        $category = $attrs['category'] ?? null;
        $orderby = $attrs['orderby'] ?? 'date';
        $order = strtolower($attrs['order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        $query = Post::where('post_type_id', $productType->id)
            ->published()
            ->with(['author', 'taxonomyTerms']);

        // Filter by category if specified
        if ($category) {
            $query->whereHas('taxonomyTerms', function ($q) use ($category) {
                $q->where('slug', $category);
            });
        }

        // Ordering
        switch ($orderby) {
            case 'price':
                $query->orderByRaw("CAST(JSON_EXTRACT(meta_data, '$.price') AS DECIMAL(10,2)) {$order}");
                break;
            case 'title':
                $query->orderBy('title', $order);
                break;
            case 'random':
                $query->inRandomOrder();
                break;
            default:
                $query->orderBy('published_at', $order);
        }

        $products = $query->limit($limit)->get();

        return $this->renderProductsHtml($products, $columns);
    }

    /**
     * [product id="X" show_price="yes" show_add_to_cart="yes"]
     */
    public function renderProduct(array $attrs): string
    {
        $id = $attrs['id'] ?? null;
        $slug = $attrs['slug'] ?? null;
        
        if (!$id && !$slug) {
            return '<!-- Product ID or slug required -->';
        }

        $productType = $this->getProductType();
        if (!$productType) {
            return '<!-- Product post type not found -->';
        }

        $query = Post::where('post_type_id', $productType->id)->published();
        
        if ($id) {
            $product = $query->where('id', $id)->first();
        } else {
            $product = $query->where('slug', $slug)->first();
        }

        if (!$product) {
            return '<!-- Product not found -->';
        }

        $showPrice = ($attrs['show_price'] ?? 'yes') === 'yes';
        $showAddToCart = ($attrs['show_add_to_cart'] ?? 'yes') === 'yes';

        return $this->renderSingleProductHtml($product, $showPrice, $showAddToCart);
    }

    /**
     * [product_grid limit="8" columns="4"]
     */
    public function renderProductGrid(array $attrs): string
    {
        $attrs['columns'] = $attrs['columns'] ?? 4;
        return $this->renderProducts($attrs);
    }

    /**
     * [product_slider limit="8" autoplay="yes"]
     */
    public function renderProductSlider(array $attrs): string
    {
        $productType = $this->getProductType();
        if (!$productType) {
            return '<!-- Product post type not found -->';
        }

        $limit = (int) ($attrs['limit'] ?? 8);
        $autoplay = ($attrs['autoplay'] ?? 'yes') === 'yes';

        $products = Post::where('post_type_id', $productType->id)
            ->published()
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();

        $autoplayAttr = $autoplay ? 'data-autoplay="true"' : '';

        $html = '<div class="product-slider swiper" ' . $autoplayAttr . '><div class="swiper-wrapper">';
        foreach ($products as $product) {
            $html .= '<div class="swiper-slide">' . $this->renderProductCard($product) . '</div>';
        }
        $html .= '</div><div class="swiper-pagination"></div><div class="swiper-button-prev"></div><div class="swiper-button-next"></div></div>';

        return $html;
    }

    /**
     * [product_categories parent="0" hide_empty="yes"]
     */
    public function renderProductCategories(array $attrs): string
    {
        $hideEmpty = ($attrs['hide_empty'] ?? 'yes') === 'yes';
        
        // Get product category taxonomy
        $taxonomy = \App\Models\Taxonomy::where('slug', 'product-category')->first();
        if (!$taxonomy) {
            return '<!-- Product category taxonomy not found -->';
        }

        $query = \App\Models\TaxonomyTerm::where('taxonomy_id', $taxonomy->id);
        
        if ($hideEmpty) {
            $query->has('posts');
        }

        $categories = $query->orderBy('name')->get();

        $html = '<ul class="product-categories list-none p-0">';
        foreach ($categories as $cat) {
            $url = url('/product-category/' . $cat->slug);
            $count = $hideEmpty ? $cat->posts()->count() : '';
            $html .= sprintf(
                '<li class="mb-2"><a href="%s" class="text-gray-700 hover:text-primary-600">%s</a>%s</li>',
                e($url),
                e($cat->name),
                $count ? " <span class=\"text-gray-400\">({$count})</span>" : ''
            );
        }
        $html .= '</ul>';

        return $html;
    }

    /**
     * [featured_products limit="4"]
     */
    public function renderFeaturedProducts(array $attrs): string
    {
        $productType = $this->getProductType();
        if (!$productType) {
            return '<!-- Product post type not found -->';
        }

        $limit = (int) ($attrs['limit'] ?? 4);
        $columns = (int) ($attrs['columns'] ?? 4);

        $products = Post::where('post_type_id', $productType->id)
            ->published()
            ->whereRaw("JSON_EXTRACT(meta_data, '$.featured') = true")
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();

        return $this->renderProductsHtml($products, $columns, 'Featured Products');
    }

    /**
     * [sale_products limit="4"]
     */
    public function renderSaleProducts(array $attrs): string
    {
        $productType = $this->getProductType();
        if (!$productType) {
            return '<!-- Product post type not found -->';
        }

        $limit = (int) ($attrs['limit'] ?? 4);
        $columns = (int) ($attrs['columns'] ?? 4);

        $products = Post::where('post_type_id', $productType->id)
            ->published()
            ->whereRaw("JSON_EXTRACT(meta_data, '$.sale_price') IS NOT NULL")
            ->whereRaw("JSON_EXTRACT(meta_data, '$.sale_price') > 0")
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();

        return $this->renderProductsHtml($products, $columns, 'Sale Products');
    }

    /**
     * [add_to_cart id="X" text="Add to Cart" class="btn-primary"]
     */
    public function renderAddToCart(array $attrs): string
    {
        $id = $attrs['id'] ?? null;
        if (!$id) {
            return '<!-- Product ID required -->';
        }

        $text = $attrs['text'] ?? 'Add to Cart';
        $class = $attrs['class'] ?? 'bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700';
        $quantity = (int) ($attrs['quantity'] ?? 1);

        return sprintf(
            '<button type="button" class="add-to-cart-btn %s" data-product-id="%d" data-quantity="%d">%s</button>',
            e($class),
            (int) $id,
            $quantity,
            e($text)
        );
    }

    /**
     * [product_price id="X"]
     */
    public function renderProductPrice(array $attrs): string
    {
        $id = $attrs['id'] ?? null;
        if (!$id) {
            return '<!-- Product ID required -->';
        }

        $product = Post::find($id);
        if (!$product) {
            return '<!-- Product not found -->';
        }

        $meta = $product->meta_data ?? [];
        $price = $meta['price'] ?? 0;
        $salePrice = $meta['sale_price'] ?? null;
        $currency = $meta['currency'] ?? 'USD';

        $currencySymbol = $this->getCurrencySymbol($currency);

        if ($salePrice && $salePrice < $price) {
            return sprintf(
                '<span class="product-price"><del class="text-gray-400">%s%.2f</del> <ins class="text-red-600 font-bold">%s%.2f</ins></span>',
                $currencySymbol,
                $price,
                $currencySymbol,
                $salePrice
            );
        }

        return sprintf(
            '<span class="product-price font-bold">%s%.2f</span>',
            $currencySymbol,
            $price
        );
    }

    /**
     * Render products HTML grid
     */
    protected function renderProductsHtml($products, int $columns = 4, ?string $title = null): string
    {
        if ($products->isEmpty()) {
            return '<p class="text-gray-500">No products found.</p>';
        }

        $gridClass = match ($columns) {
            1 => 'grid-cols-1',
            2 => 'grid-cols-1 sm:grid-cols-2',
            3 => 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            5 => 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
            6 => 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
            default => 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        };

        $html = '';
        if ($title) {
            $html .= "<h3 class=\"text-xl font-bold mb-4\">{$title}</h3>";
        }
        
        $html .= "<div class=\"product-grid grid {$gridClass} gap-6\">";
        foreach ($products as $product) {
            $html .= $this->renderProductCard($product);
        }
        $html .= '</div>';

        return $html;
    }

    /**
     * Render a single product card
     */
    protected function renderProductCard(Post $product): string
    {
        $meta = $product->meta_data ?? [];
        $price = $meta['price'] ?? 0;
        $salePrice = $meta['sale_price'] ?? null;
        $currency = $meta['currency'] ?? 'USD';
        $currencySymbol = $this->getCurrencySymbol($currency);
        $sku = $meta['sku'] ?? '';
        $stock = $meta['stock'] ?? null;
        
        $image = $product->featured_image ?: '/images/placeholder-product.jpg';
        $url = url('/shop/' . $product->slug);

        $priceHtml = '';
        if ($salePrice && $salePrice < $price) {
            $priceHtml = sprintf(
                '<del class="text-gray-400 text-sm">%s%.2f</del> <span class="text-red-600 font-bold">%s%.2f</span>',
                $currencySymbol, $price, $currencySymbol, $salePrice
            );
        } else {
            $priceHtml = sprintf('<span class="font-bold">%s%.2f</span>', $currencySymbol, $price);
        }

        $stockBadge = '';
        if ($stock !== null && $stock <= 0) {
            $stockBadge = '<span class="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Out of Stock</span>';
        } elseif ($salePrice && $salePrice < $price) {
            $discount = round((($price - $salePrice) / $price) * 100);
            $stockBadge = "<span class=\"absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded\">-{$discount}%</span>";
        }

        return <<<HTML
<div class="product-card bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative">
    {$stockBadge}
    <a href="{$url}" class="block">
        <div class="aspect-square overflow-hidden">
            <img src="{$image}" alt="{$product->title}" class="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy">
        </div>
    </a>
    <div class="p-4">
        <a href="{$url}" class="block">
            <h4 class="font-semibold text-gray-800 hover:text-primary-600 mb-2 line-clamp-2">{$product->title}</h4>
        </a>
        <div class="flex items-center justify-between">
            <div class="product-price">{$priceHtml}</div>
        </div>
        <button type="button" class="add-to-cart-btn mt-3 w-full bg-primary-600 text-white py-2 rounded hover:bg-primary-700 transition-colors" data-product-id="{$product->id}">
            Add to Cart
        </button>
    </div>
</div>
HTML;
    }

    /**
     * Render single product detail HTML
     */
    protected function renderSingleProductHtml(Post $product, bool $showPrice = true, bool $showAddToCart = true): string
    {
        $meta = $product->meta_data ?? [];
        $price = $meta['price'] ?? 0;
        $salePrice = $meta['sale_price'] ?? null;
        $currency = $meta['currency'] ?? 'USD';
        $currencySymbol = $this->getCurrencySymbol($currency);
        $sku = $meta['sku'] ?? '';
        $stock = $meta['stock'] ?? null;
        
        $image = $product->featured_image ?: '/images/placeholder-product.jpg';

        $priceHtml = '';
        if ($showPrice) {
            if ($salePrice && $salePrice < $price) {
                $priceHtml = sprintf(
                    '<div class="product-price text-2xl mb-4"><del class="text-gray-400">%s%.2f</del> <span class="text-red-600 font-bold">%s%.2f</span></div>',
                    $currencySymbol, $price, $currencySymbol, $salePrice
                );
            } else {
                $priceHtml = sprintf('<div class="product-price text-2xl font-bold mb-4">%s%.2f</div>', $currencySymbol, $price);
            }
        }

        $addToCartHtml = '';
        if ($showAddToCart && ($stock === null || $stock > 0)) {
            $addToCartHtml = <<<HTML
<div class="add-to-cart-form flex items-center gap-4 mb-4">
    <input type="number" value="1" min="1" max="{$stock}" class="quantity-input w-20 px-3 py-2 border rounded">
    <button type="button" class="add-to-cart-btn bg-primary-600 text-white px-6 py-2 rounded hover:bg-primary-700" data-product-id="{$product->id}">
        Add to Cart
    </button>
</div>
HTML;
        } elseif ($stock !== null && $stock <= 0) {
            $addToCartHtml = '<p class="text-red-600 font-semibold mb-4">Out of Stock</p>';
        }

        $skuHtml = $sku ? "<p class=\"text-sm text-gray-500 mb-2\">SKU: {$sku}</p>" : '';

        return <<<HTML
<div class="product-single flex flex-col md:flex-row gap-8">
    <div class="product-image md:w-1/2">
        <img src="{$image}" alt="{$product->title}" class="w-full rounded-lg shadow-md">
    </div>
    <div class="product-details md:w-1/2">
        <h2 class="text-3xl font-bold mb-4">{$product->title}</h2>
        {$priceHtml}
        {$skuHtml}
        <div class="product-description prose mb-6">{$product->content}</div>
        {$addToCartHtml}
    </div>
</div>
HTML;
    }

    /**
     * Get currency symbol
     */
    protected function getCurrencySymbol(string $currency): string
    {
        return match (strtoupper($currency)) {
            'EUR' => '€',
            'GBP' => '£',
            'JPY' => '¥',
            'CNY' => '¥',
            'INR' => '₹',
            'RUB' => '₽',
            'KRW' => '₩',
            'BRL' => 'R$',
            'CAD' => 'CA$',
            'AUD' => 'A$',
            default => '$',
        };
    }
}
