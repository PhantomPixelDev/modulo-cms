import { Link } from '@inertiajs/react';
import { Check, Heart, Minus, Plus, RotateCcw, Shield, ShoppingCart, Truck } from 'lucide-react';
import { useState } from 'react';
import Layout from './Layout';

interface Product {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    url?: string;
    published_at?: string;
    updated_at?: string;
    meta_title?: string;
    meta_description?: string;
    price?: number;
    sale_price?: number | null;
    currency?: string;
    sku?: string;
    stock?: number | null;
    in_stock?: boolean;
    featured?: boolean;
    gallery?: string[];
    attributes?: Record<string, string>;
    categories?: Array<{ id: number; name: string; slug: string }>;
    tags?: Array<{ id: number; name: string; slug: string }>;
    author?: {
        id: number;
        name: string;
        email?: string;
        avatar?: string;
    };
    post_type?: {
        name: string;
        label: string;
        route_prefix?: string;
    };
    terms?: Array<{
        id: number;
        name: string;
        slug: string;
        taxonomy?: {
            name: string;
            label: string;
        };
    }>;
}

interface RelatedProduct {
    id: number;
    title: string;
    slug: string;
    featured_image?: string;
    url?: string;
    price?: number;
    sale_price?: number | null;
    currency?: string;
}

interface ProductsSingleProps {
    post?: Product;
    product?: Product;
    relatedProducts?: RelatedProduct[];
    site?: any;
    theme?: any;
    menus?: any;
}

export default function ProductsSingle({ post, product, relatedProducts, site, theme, menus }: ProductsSingleProps) {
    // Support both post and product props
    const item = product || post;

    // Hooks must run on every render, before any early return
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(item?.featured_image || '');
    const [isWishlisted, setIsWishlisted] = useState(false);

    if (!item) {
        return (
            <Layout site={site} theme={theme} menus={menus} title="Product Not Found">
                <div className="py-16 text-center">
                    <p className="text-muted-foreground">Product not found.</p>
                    <Link href="/shop" className="mt-4 inline-block text-primary hover:text-primary">
                        ← Back to Shop
                    </Link>
                </div>
            </Layout>
        );
    }

    const prefix = item.post_type?.route_prefix || 'shop';
    const backUrl = `/${prefix}`;

    const formatPrice = (price?: number, currency = 'USD') => {
        if (price === undefined || price === null) return '';
        const symbols: Record<string, string> = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            JPY: '¥',
            CNY: '¥',
        };
        return `${symbols[currency] || '$'}${price.toFixed(2)}`;
    };

    const getDiscountPercent = () => {
        if (!item.price || !item.sale_price || item.sale_price >= item.price) return null;
        return Math.round(((item.price - item.sale_price) / item.price) * 100);
    };

    const displayPrice = item.sale_price && item.sale_price < (item.price || 0) ? item.sale_price : item.price;
    const discount = getDiscountPercent();
    const allImages = [item.featured_image, ...(item.gallery || [])].filter(Boolean) as string[];
    const inStock = item.in_stock !== false && (item.stock === null || item.stock === undefined || item.stock > 0);
    const maxQuantity = item.stock || 99;

    return (
        <Layout
            title={item.meta_title || item.title}
            description={item.meta_description || item.excerpt}
            ogImage={item.featured_image}
            site={site}
            theme={theme}
            menus={menus}
            post={item as any}
        >
            <div>
                {/* Breadcrumb */}
                <nav className="mb-8">
                    <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                        <li>
                            <Link href="/" className="hover:text-foreground">
                                Home
                            </Link>
                        </li>
                        <li>/</li>
                        <li>
                            <Link href={backUrl} className="hover:text-foreground">
                                Shop
                            </Link>
                        </li>
                        {item.categories && item.categories.length > 0 && (
                            <>
                                <li>/</li>
                                <li>
                                    <Link href={`/product-category/${item.categories[0].slug}`} className="hover:text-foreground">
                                        {item.categories[0].name}
                                    </Link>
                                </li>
                            </>
                        )}
                        <li>/</li>
                        <li className="max-w-[200px] truncate font-medium text-foreground">{item.title}</li>
                    </ol>
                </nav>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                    {/* Product Images */}
                    <div className="space-y-4">
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                            {selectedImage ? (
                                <img src={selectedImage} alt={item.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground/80">
                                    <ShoppingCart className="h-20 w-20" />
                                </div>
                            )}
                            {discount && (
                                <span className="absolute top-4 left-4 rounded-full bg-destructive px-3 py-1 text-sm font-bold text-white">
                                    -{discount}% OFF
                                </span>
                            )}
                            {!inStock && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <span className="rounded-lg bg-card px-6 py-3 font-semibold text-foreground">Out of Stock</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Gallery */}
                        {allImages.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {allImages.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                                            selectedImage === img ? 'border-primary' : 'border-transparent hover:border-input'
                                        }`}
                                    >
                                        <img src={img} alt={`${item.title} ${i + 1}`} className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="space-y-6">
                        {/* Categories */}
                        {item.categories && item.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {item.categories.map((cat) => (
                                    <Link key={cat.id} href={`/product-category/${cat.slug}`} className="text-sm text-primary hover:text-primary">
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{item.title}</h1>

                        {/* Price */}
                        <div className="flex items-center gap-4">
                            {item.sale_price && item.sale_price < (item.price || 0) && (
                                <span className="text-2xl text-muted-foreground/80 line-through">{formatPrice(item.price, item.currency)}</span>
                            )}
                            <span
                                className={`text-3xl font-semibold tracking-tight ${item.sale_price && item.sale_price < (item.price || 0) ? 'text-destructive' : 'text-foreground'}`}
                            >
                                {formatPrice(displayPrice, item.currency)}
                            </span>
                            {discount && (
                                <span className="rounded-full bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive">
                                    Save {discount}%
                                </span>
                            )}
                        </div>

                        {/* Stock Status */}
                        <div className="flex items-center gap-2">
                            {inStock ? (
                                <>
                                    <Check className="h-5 w-5 text-success" />
                                    <span className="font-medium text-success">{item.stock ? `In Stock (${item.stock} available)` : 'In Stock'}</span>
                                </>
                            ) : (
                                <span className="font-medium text-destructive">Out of Stock</span>
                            )}
                        </div>

                        {/* Short Description */}
                        {item.excerpt && <p className="text-lg leading-relaxed text-muted-foreground">{item.excerpt}</p>}

                        {/* Attributes */}
                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                            <div className="space-y-3 border-y border-border py-4">
                                {Object.entries(item.attributes).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <span className="text-muted-foreground capitalize">{key}:</span>
                                        <span className="font-medium text-foreground">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quantity & Add to Cart */}
                        {inStock && (
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center rounded-lg border border-input">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-3 transition-colors hover:bg-accent"
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                                        className="w-16 border-x border-input py-2 text-center focus:outline-none"
                                        min="1"
                                        max={maxQuantity}
                                    />
                                    <button
                                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                                        className="p-3 transition-colors hover:bg-accent"
                                        disabled={quantity >= maxQuantity}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <button
                                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                                    data-product-id={item.id}
                                    data-quantity={quantity}
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    Add to Cart
                                </button>
                                <button
                                    onClick={() => setIsWishlisted(!isWishlisted)}
                                    className={`rounded-lg border p-3 transition-colors ${
                                        isWishlisted
                                            ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                            : 'border-input text-muted-foreground hover:bg-accent'
                                    }`}
                                >
                                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                        )}

                        {/* SKU */}
                        {item.sku && (
                            <p className="text-sm text-muted-foreground">
                                SKU: <span className="font-medium">{item.sku}</span>
                            </p>
                        )}

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-muted-foreground">Tags:</span>
                                {item.tags.map((tag) => (
                                    <Link
                                        key={tag.id}
                                        href={`/shop?tag=${tag.slug}`}
                                        className="rounded-full bg-muted px-3 py-1 text-sm text-foreground/80 transition-colors hover:bg-accent"
                                    >
                                        {tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-4 border-t border-border pt-6">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <Truck className="h-6 w-6 text-primary" />
                                <span className="text-sm text-muted-foreground">Free Shipping</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <Shield className="h-6 w-6 text-primary" />
                                <span className="text-sm text-muted-foreground">Secure Payment</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <RotateCcw className="h-6 w-6 text-primary" />
                                <span className="text-sm text-muted-foreground">Easy Returns</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Full Description */}
                {item.content && (
                    <div className="mt-16">
                        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">Product Description</h2>
                        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
                    </div>
                )}

                {/* Related Products */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="mt-16">
                        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">Related Products</h2>
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            {relatedProducts.map((p) => (
                                <Link
                                    key={p.id}
                                    href={p.url || `/shop/${p.slug}`}
                                    className="group overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-lg"
                                >
                                    <div className="aspect-square overflow-hidden bg-muted">
                                        {p.featured_image ? (
                                            <img
                                                src={p.featured_image}
                                                alt={p.title}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-muted-foreground/80">
                                                <ShoppingCart className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="line-clamp-2 font-medium text-foreground transition-colors group-hover:text-primary">
                                            {p.title}
                                        </h3>
                                        <p className="mt-1 font-bold text-foreground">{formatPrice(p.sale_price || p.price, p.currency)}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
