<?php

namespace Plugins\ModuloShop\src\Http\Controllers;

use App\Models\Post;
use App\Models\PostType;
use App\Models\TaxonomyTerm;
use App\Services\ReactTemplateRenderer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class ShopController
{
    protected ?PostType $productType = null;
    protected ReactTemplateRenderer $reactRenderer;

    public function __construct(ReactTemplateRenderer $reactRenderer)
    {
        $this->reactRenderer = $reactRenderer;
    }

    protected function getProductType(): ?PostType
    {
        if ($this->productType === null) {
            $this->productType = PostType::where('slug', 'product')->first();
        }
        return $this->productType;
    }

    /**
     * Shop archive page - /shop
     */
    public function index(Request $request): JsonResponse|Response
    {
        $productType = $this->getProductType();
        
        if (!$productType) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Shop not configured'], 404);
            }
            abort(404, 'Shop not configured');
        }

        $query = Post::where('post_type_id', $productType->id)
            ->published()
            ->with(['author', 'taxonomyTerms']);

        // Filter by category
        if ($category = $request->get('category')) {
            $query->whereHas('taxonomyTerms', fn($q) => $q->where('slug', $category));
        }

        // Filter by tag
        if ($tag = $request->get('tag')) {
            $query->whereHas('taxonomyTerms', fn($q) => $q->where('slug', $tag));
        }

        // Search
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%")
                  ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        // Price filter
        if ($minPrice = $request->get('min_price')) {
            $query->whereRaw("CAST(JSON_EXTRACT(meta_data, '$.price') AS DECIMAL(10,2)) >= ?", [$minPrice]);
        }
        if ($maxPrice = $request->get('max_price')) {
            $query->whereRaw("CAST(JSON_EXTRACT(meta_data, '$.price') AS DECIMAL(10,2)) <= ?", [$maxPrice]);
        }

        // Sorting
        $orderBy = $request->get('orderby', 'date');
        $order = $request->get('order', 'desc');
        
        switch ($orderBy) {
            case 'price':
                $query->orderByRaw("CAST(JSON_EXTRACT(meta_data, '$.price') AS DECIMAL(10,2)) {$order}");
                break;
            case 'title':
                $query->orderBy('title', $order);
                break;
            case 'popularity':
                $query->orderBy('view_count', $order);
                break;
            default:
                $query->orderBy('published_at', $order);
        }

        $products = $query->paginate($request->get('per_page', 12));

        // Get categories for sidebar
        $categories = TaxonomyTerm::whereHas('taxonomy', fn($q) => $q->where('slug', 'product-category'))
            ->withCount(['posts' => fn($q) => $q->where('post_type_id', $productType->id)->published()])
            ->orderBy('name')
            ->get();

        if ($request->wantsJson()) {
            return response()->json([
                'products' => $products,
                'categories' => $categories,
            ]);
        }

        // Render with React theme
        return $this->reactRenderer->render('Shop/Archive', [
            'products' => $products->through(fn($p) => $this->transformProduct($p)),
            'categories' => $categories,
            'filters' => [
                'category' => $request->get('category'),
                'tag' => $request->get('tag'),
                'search' => $request->get('search'),
                'min_price' => $request->get('min_price'),
                'max_price' => $request->get('max_price'),
                'orderby' => $orderBy,
                'order' => $order,
            ],
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Single product page - /shop/{slug}
     */
    public function show(Request $request, string $slug): JsonResponse|Response
    {
        $productType = $this->getProductType();
        
        if (!$productType) {
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Shop not configured'], 404);
            }
            abort(404, 'Shop not configured');
        }

        $product = Post::where('post_type_id', $productType->id)
            ->where('slug', $slug)
            ->published()
            ->with(['author', 'taxonomyTerms'])
            ->firstOrFail();

        // Increment view count
        $product->increment('view_count');

        // Get related products
        $relatedProducts = Post::where('post_type_id', $productType->id)
            ->where('id', '!=', $product->id)
            ->published()
            ->whereHas('taxonomyTerms', function ($q) use ($product) {
                $q->whereIn('taxonomy_term_id', $product->taxonomyTerms->pluck('id'));
            })
            ->limit(4)
            ->get();

        if ($request->wantsJson()) {
            return response()->json([
                'product' => $this->transformProduct($product),
                'related' => $relatedProducts->map(fn($p) => $this->transformProduct($p)),
            ]);
        }

        return $this->reactRenderer->render('Shop/Single', [
            'product' => $this->transformProduct($product),
            'relatedProducts' => $relatedProducts->map(fn($p) => $this->transformProduct($p)),
        ]);
    }

    /**
     * Product category archive - /product-category/{slug}
     */
    public function category(Request $request, string $slug): JsonResponse|Response
    {
        $category = TaxonomyTerm::whereHas('taxonomy', fn($q) => $q->where('slug', 'product-category'))
            ->where('slug', $slug)
            ->firstOrFail();

        $productType = $this->getProductType();
        
        $products = Post::where('post_type_id', $productType->id)
            ->published()
            ->whereHas('taxonomyTerms', fn($q) => $q->where('id', $category->id))
            ->with(['author', 'taxonomyTerms'])
            ->orderBy('published_at', 'desc')
            ->paginate(12);

        if ($request->wantsJson()) {
            return response()->json([
                'category' => $category,
                'products' => $products,
            ]);
        }

        return $this->reactRenderer->render('Shop/Category', [
            'category' => $category,
            'products' => $products->through(fn($p) => $this->transformProduct($p)),
        ]);
    }

    /**
     * Transform product post to frontend-friendly format
     */
    protected function transformProduct(Post $product): array
    {
        $meta = $product->meta_data ?? [];
        
        return [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'excerpt' => $product->excerpt,
            'content' => $product->content,
            'featured_image' => $product->featured_image,
            'url' => url('/shop/' . $product->slug),
            'price' => (float) ($meta['price'] ?? 0),
            'sale_price' => isset($meta['sale_price']) ? (float) $meta['sale_price'] : null,
            'currency' => $meta['currency'] ?? 'USD',
            'sku' => $meta['sku'] ?? null,
            'stock' => isset($meta['stock']) ? (int) $meta['stock'] : null,
            'in_stock' => !isset($meta['stock']) || $meta['stock'] > 0,
            'featured' => (bool) ($meta['featured'] ?? false),
            'gallery' => $meta['gallery'] ?? [],
            'attributes' => $meta['attributes'] ?? [],
            'categories' => $product->taxonomyTerms
                ->filter(fn($t) => $t->taxonomy?->slug === 'product-category')
                ->values()
                ->map(fn($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug]),
            'tags' => $product->taxonomyTerms
                ->filter(fn($t) => $t->taxonomy?->slug === 'product-tag')
                ->values()
                ->map(fn($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug]),
            'author' => $product->author ? [
                'id' => $product->author->id,
                'name' => $product->author->name,
            ] : null,
            'published_at' => $product->published_at?->toISOString(),
            'view_count' => $product->view_count,
        ];
    }
}
