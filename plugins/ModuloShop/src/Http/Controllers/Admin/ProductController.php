<?php

namespace Plugins\ModuloShop\src\Http\Controllers\Admin;

use App\Models\Post;
use App\Models\PostType;
use App\Models\TaxonomyTerm;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController
{
    protected ?PostType $productType = null;

    protected function getProductType(): ?PostType
    {
        if ($this->productType === null) {
            $this->productType = PostType::where('name', 'product')->first();
        }

        return $this->productType;
    }

    /**
     * Route model binding resolves any post; the shop permissions must only
     * reach products.
     */
    protected function ensureProduct(Post $post): void
    {
        abort_unless($post->post_type_id === $this->getProductType()?->id, 404);
    }

    public function index(Request $request): JsonResponse|Response
    {
        $this->authorizeView();

        $productType = $this->getProductType();
        if (! $productType) {
            return Inertia::render('Dashboard', [
                'adminSection' => 'shop-products',
                'shopProducts' => ['data' => [], 'total' => 0],
                'error' => 'Product post type not configured. Please activate the shop plugin.',
            ]);
        }

        $query = Post::where('post_type_id', $productType->id)
            ->with(['author', 'taxonomyTerms'])
            ->orderByDesc('id');

        // Search
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $products = $query->paginate(50);

        // Transform products to include meta fields
        $products->through(fn ($p) => $this->transformForAdmin($p));

        if ($request->wantsJson()) {
            return response()->json($products);
        }

        // Get categories for filter
        $categories = TaxonomyTerm::whereHas('taxonomy', fn ($q) => $q->where('slug', 'product-category'))
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        // ?edit={id} opens that product's edit dialog, whichever page it is on.
        $editProduct = $request->integer('edit')
            ? Post::where('post_type_id', $productType->id)->find($request->integer('edit'))
            : null;

        return Inertia::render('Dashboard', [
            'adminSection' => 'shop-products',
            'shopProducts' => $products,
            'productCategories' => $categories,
            'editProduct' => $editProduct ? $this->transformForAdmin($editProduct) : null,
        ]);
    }

    /**
     * Products are created and edited on the list screen (inline form and
     * dialog); these URLs lead there so bookmarks and links keep working.
     */
    public function create(Request $request): RedirectResponse
    {
        $this->authorizeCreate();

        return redirect()->route('dashboard.admin.shop.products.index');
    }

    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $this->authorizeCreate();

        $productType = $this->getProductType();
        if (! $productType) {
            return back()->withErrors(['error' => 'Product post type not configured']);
        }

        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'description' => 'nullable|string',
            'excerpt' => 'nullable|string|max:500',
            'featured_image' => 'nullable|string|max:500',
            'status' => 'nullable|in:draft,published,pending,private',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|max:64',
            'stock' => 'nullable|integer|min:0',
            'currency' => 'nullable|string|max:10',
            'featured' => 'nullable|boolean',
            'gallery' => 'nullable|array',
            'attributes' => 'nullable|array',
            'categories' => 'nullable|array',
            'tags' => 'nullable|array',
        ]);

        // Support both 'name' (frontend) and 'title' (backend) field names
        $title = $data['title'] ?? $data['name'] ?? '';
        if (empty($title)) {
            return back()->withErrors(['name' => 'Product name is required']);
        }

        $slug = ! empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($title);

        // Ensure unique slug
        $baseSlug = $slug;
        $counter = 1;
        while (Post::where('slug', $slug)->where('post_type_id', $productType->id)->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        $product = Post::create([
            'post_type_id' => $productType->id,
            'author_id' => auth()->id(),
            'title' => $title,
            'slug' => $slug,
            'content' => $data['content'] ?? $data['description'] ?? '',
            'excerpt' => $data['excerpt'] ?? '',
            'featured_image' => $data['featured_image'] ?? null,
            'status' => $data['status'] ?? 'draft',
            'published_at' => ($data['status'] ?? 'draft') === 'published' ? now() : null,
            'meta_data' => [
                'price' => (float) $data['price'],
                'sale_price' => isset($data['sale_price']) ? (float) $data['sale_price'] : null,
                'sku' => $data['sku'] ?? null,
                'stock' => isset($data['stock']) ? (int) $data['stock'] : null,
                'currency' => $data['currency'] ?? 'USD',
                'featured' => (bool) ($data['featured'] ?? false),
                'gallery' => $data['gallery'] ?? [],
                'attributes' => $data['attributes'] ?? [],
            ],
        ]);

        // Sync categories and tags
        $termIds = array_merge($data['categories'] ?? [], $data['tags'] ?? []);
        if (! empty($termIds)) {
            $product->taxonomyTerms()->sync($termIds);
        }

        if ($request->wantsJson()) {
            return response()->json($this->transformForAdmin($product), 201);
        }

        return redirect()->route('dashboard.admin.shop.products.index')
            ->with('success', 'Product created successfully');
    }

    public function edit(Request $request, Post $post): RedirectResponse
    {
        $this->authorizeEdit();
        $this->ensureProduct($post);

        return redirect()->route('dashboard.admin.shop.products.index', ['edit' => $post->id]);
    }

    public function update(Request $request, Post $post): JsonResponse|RedirectResponse
    {
        $this->authorizeEdit();
        $this->ensureProduct($post);

        $productType = $this->getProductType();

        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'slug' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'description' => 'nullable|string',
            'excerpt' => 'nullable|string|max:500',
            'featured_image' => 'nullable|string|max:500',
            'status' => 'nullable|in:draft,published,pending,private',
            'is_active' => 'nullable|boolean',
            'price' => 'nullable|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'sku' => 'nullable|string|max:64',
            'stock' => 'nullable|integer|min:0',
            'currency' => 'nullable|string|max:10',
            'featured' => 'nullable|boolean',
            'gallery' => 'nullable|array',
            'attributes' => 'nullable|array',
            'categories' => 'nullable|array',
            'tags' => 'nullable|array',
        ]);

        $title = $data['title'] ?? $data['name'] ?? $post->title;
        $slug = ! empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($title);

        // Ensure unique slug (excluding current post)
        $baseSlug = $slug;
        $counter = 1;
        while (Post::where('slug', $slug)->where('post_type_id', $productType->id)->where('id', '!=', $post->id)->exists()) {
            $slug = $baseSlug.'-'.$counter++;
        }

        // Determine status from is_active or status field
        $status = $post->status;
        if (isset($data['status'])) {
            $status = $data['status'];
        } elseif (isset($data['is_active'])) {
            $status = $data['is_active'] ? 'published' : 'draft';
        }

        // Determine published_at
        $publishedAt = $post->published_at;
        if ($status === 'published' && ! $publishedAt) {
            $publishedAt = now();
        }

        // Get existing meta_data to preserve values not being updated
        $existingMeta = $post->meta_data ?? [];

        $post->update([
            'title' => $title,
            'slug' => $slug,
            'content' => $data['content'] ?? $data['description'] ?? $post->content,
            'excerpt' => $data['excerpt'] ?? $post->excerpt,
            'featured_image' => $data['featured_image'] ?? $post->featured_image,
            'status' => $status,
            'published_at' => $publishedAt,
            // Merged, so keys this form doesn't know about survive an edit.
            'meta_data' => [
                ...$existingMeta,
                'price' => isset($data['price']) ? (float) $data['price'] : ($existingMeta['price'] ?? 0),
                // Sent as null means "clear" (no sale / stock not tracked); omitted keeps it.
                'sale_price' => array_key_exists('sale_price', $data)
                    ? ($data['sale_price'] === null ? null : (float) $data['sale_price'])
                    : ($existingMeta['sale_price'] ?? null),
                'sku' => $data['sku'] ?? $existingMeta['sku'] ?? null,
                'stock' => array_key_exists('stock', $data)
                    ? ($data['stock'] === null ? null : (int) $data['stock'])
                    : ($existingMeta['stock'] ?? null),
                'currency' => $data['currency'] ?? $existingMeta['currency'] ?? 'USD',
                'featured' => isset($data['featured']) ? (bool) $data['featured'] : ($existingMeta['featured'] ?? false),
                'gallery' => $data['gallery'] ?? $existingMeta['gallery'] ?? [],
                'attributes' => $data['attributes'] ?? $existingMeta['attributes'] ?? [],
            ],
        ]);

        // Only when the form sent them: an edit without the fields must not
        // strip the product's categories and tags.
        if ($request->has('categories') || $request->has('tags')) {
            $current = $post->taxonomyTerms()->with('taxonomy')->get();
            $keep = fn (string $taxonomy) => $current
                ->filter(fn ($term) => $term->taxonomy?->slug === $taxonomy)
                ->pluck('id')->all();

            $post->taxonomyTerms()->sync(array_merge(
                $request->has('categories') ? ($data['categories'] ?? []) : $keep('product-category'),
                $request->has('tags') ? ($data['tags'] ?? []) : $keep('product-tag'),
            ));
        }

        if ($request->wantsJson()) {
            return response()->json($this->transformForAdmin($post));
        }

        return redirect()->route('dashboard.admin.shop.products.index')
            ->with('success', 'Product updated successfully');
    }

    public function destroy(Request $request, Post $post): JsonResponse|RedirectResponse
    {
        $this->authorizeDelete();
        $this->ensureProduct($post);

        $post->taxonomyTerms()->detach();
        $post->delete();

        if ($request->wantsJson()) {
            return response()->json(['ok' => true]);
        }

        return redirect()->route('dashboard.admin.shop.products.index')
            ->with('success', 'Product deleted successfully');
    }

    /**
     * Transform product for admin view
     */
    protected function transformForAdmin(Post $product): array
    {
        $meta = $product->meta_data ?? [];

        return [
            'id' => $product->id,
            'title' => $product->title,
            'name' => $product->title,
            'slug' => $product->slug,
            'content' => $product->content,
            'description' => $product->content,
            'excerpt' => $product->excerpt,
            'featured_image' => $product->featured_image,
            'status' => $product->status,
            'is_active' => $product->status === 'published',
            'published_at' => $product->published_at?->toISOString(),
            'price' => (float) ($meta['price'] ?? 0),
            'sale_price' => isset($meta['sale_price']) ? (float) $meta['sale_price'] : null,
            'sku' => $meta['sku'] ?? null,
            'stock' => isset($meta['stock']) ? (int) $meta['stock'] : null,
            'currency' => $meta['currency'] ?? 'USD',
            'featured' => (bool) ($meta['featured'] ?? false),
            'gallery' => $meta['gallery'] ?? [],
            'attributes' => $meta['attributes'] ?? [],
            'categories' => $product->taxonomyTerms
                ->filter(fn ($t) => $t->taxonomy?->slug === 'product-category')
                ->pluck('id')
                ->values()
                ->toArray(),
            'tags' => $product->taxonomyTerms
                ->filter(fn ($t) => $t->taxonomy?->slug === 'product-tag')
                ->pluck('id')
                ->values()
                ->toArray(),
            'author' => $product->author ? [
                'id' => $product->author->id,
                'name' => $product->author->name,
            ] : null,
            'created_at' => $product->created_at?->toISOString(),
            'updated_at' => $product->updated_at?->toISOString(),
        ];
    }

    protected function authorizeView(): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }
        if ($user->can('view shop products') || $user->hasRole(['admin', 'super-admin'])) {
            return;
        }
        abort(403);
    }

    protected function authorizeCreate(): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }
        if ($user->can('create shop products') || $user->hasRole(['admin', 'super-admin'])) {
            return;
        }
        abort(403);
    }

    protected function authorizeEdit(): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }
        if ($user->can('edit shop products') || $user->hasRole(['admin', 'super-admin'])) {
            return;
        }
        abort(403);
    }

    protected function authorizeDelete(): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }
        if ($user->can('delete shop products') || $user->hasRole(['admin', 'super-admin'])) {
            return;
        }
        abort(403);
    }
}
