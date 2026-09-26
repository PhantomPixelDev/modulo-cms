import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { Check, ChevronRight, Heart, Minus, Plus, RotateCcw, Shield, ShoppingCart, Truck } from 'lucide-react';
import { useState } from 'react';
import Layout from '../Layout';

interface Product {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    url?: string;
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

interface ShopSingleProps {
    product?: Product;
    relatedProducts?: RelatedProduct[];
    site?: any;
    theme?: any;
    menus?: any;
}

export default function Single({ product, relatedProducts, site, theme, menus }: ShopSingleProps) {
    const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeMenus = menus && typeof menus === 'object' ? menus : {};

    // Hooks must run on every render, before any early return
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(product?.featured_image || '');
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    if (!product) {
        return (
            <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title="Product Not Found">
                <div className="py-20 text-center">
                    <ShoppingCart className="mx-auto mb-6 h-20 w-20 text-muted-foreground/40" />
                    <h1 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">Product Not Found</h1>
                    <p className="mb-6 text-muted-foreground">The product you're looking for doesn't exist.</p>
                    <Link href="/shop" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-white hover:bg-primary/90">
                        ← Back to Shop
                    </Link>
                </div>
            </Layout>
        );
    }

    const addToCart = async () => {
        setAddingToCart(true);
        setCartMessage(null);
        try {
            const response = await fetch('/shop/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ product_id: product.id, quantity }),
            });
            const data = await response.json();
            if (data.success) {
                setCartMessage({ type: 'success', text: 'Added to cart!' });
                setTimeout(() => setCartMessage(null), 3000);
            } else {
                setCartMessage({ type: 'error', text: data.message || 'Failed to add to cart' });
            }
        } catch (error) {
            setCartMessage({ type: 'error', text: 'Failed to add to cart' });
        }
        setAddingToCart(false);
    };

    const formatPrice = (price?: number, currency = 'USD') => {
        if (price === undefined || price === null) return '';
        const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
        return `${symbols[currency] || '$'}${price.toFixed(2)}`;
    };

    const getDiscountPercent = () => {
        if (!product.price || !product.sale_price || product.sale_price >= product.price) return null;
        return Math.round(((product.price - product.sale_price) / product.price) * 100);
    };

    const displayPrice = product.sale_price && product.sale_price < (product.price || 0) ? product.sale_price : product.price;
    const discount = getDiscountPercent();
    const allImages = [product.featured_image, ...(product.gallery || [])].filter(Boolean) as string[];
    const inStock = product.in_stock !== false && (product.stock === null || product.stock === undefined || product.stock > 0);
    const maxQuantity = product.stock || 99;

    return (
        <Layout
            title={product.title}
            description={product.excerpt}
            ogImage={product.featured_image}
            site={safeSite}
            theme={safeTheme}
            menus={safeMenus}
        >
            <SEOHead title={`${product.title} | ${safeSite.name}`} description={product.excerpt} />

            <div>
                {/* Breadcrumb */}
                <nav className="mb-8">
                    <ol className="flex items-center gap-2 text-sm text-muted-foreground">
                        <li>
                            <Link href="/" className="transition-colors hover:text-primary">
                                Home
                            </Link>
                        </li>
                        <li>
                            <ChevronRight className="h-4 w-4" />
                        </li>
                        <li>
                            <Link href="/shop" className="transition-colors hover:text-primary">
                                Shop
                            </Link>
                        </li>
                        {product.categories && product.categories.length > 0 && (
                            <>
                                <li>
                                    <ChevronRight className="h-4 w-4" />
                                </li>
                                <li>
                                    <Link href={`/product-category/${product.categories[0].slug}`} className="transition-colors hover:text-primary">
                                        {product.categories[0].name}
                                    </Link>
                                </li>
                            </>
                        )}
                        <li>
                            <ChevronRight className="h-4 w-4" />
                        </li>
                        <li className="max-w-[200px] truncate font-medium text-foreground">{product.title}</li>
                    </ol>
                </nav>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                    {/* Product Images */}
                    <div className="space-y-4">
                        <div className="relative aspect-square overflow-hidden rounded-3xl border bg-muted/50">
                            {selectedImage ? (
                                <img src={selectedImage} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
                                    <ShoppingCart className="h-24 w-24" />
                                </div>
                            )}
                            {discount && (
                                <span className="absolute top-4 left-4 rounded-full bg-destructive px-4 py-2 text-sm font-bold text-white shadow-lg">
                                    -{discount}% OFF
                                </span>
                            )}
                            {!inStock && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                    <span className="rounded-xl bg-card px-8 py-4 text-lg font-semibold text-foreground shadow-xl">Out of Stock</span>
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
                                        className={`h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                                            selectedImage === img ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-input'
                                        }`}
                                    >
                                        <img src={img} alt={`${product.title} ${i + 1}`} className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div className="space-y-6">
                        {/* Categories */}
                        {product.categories && product.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {product.categories.map((cat) => (
                                    <Link
                                        key={cat.id}
                                        href={`/product-category/${cat.slug}`}
                                        className="text-sm font-medium text-primary transition-colors hover:text-primary"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        <h1 className="text-3xl leading-tight font-bold text-foreground md:text-4xl">{product.title}</h1>

                        {/* Price */}
                        <div className="flex items-center gap-4 border-y border-border py-4">
                            {product.sale_price && product.sale_price < (product.price || 0) && (
                                <span className="text-2xl text-muted-foreground/80 line-through">{formatPrice(product.price, product.currency)}</span>
                            )}
                            <span
                                className={`text-4xl font-semibold tracking-tight ${product.sale_price && product.sale_price < (product.price || 0) ? 'text-destructive' : 'text-foreground'}`}
                            >
                                {formatPrice(displayPrice, product.currency)}
                            </span>
                            {discount && (
                                <span className="rounded-full bg-destructive/10 px-4 py-1.5 text-sm font-semibold text-destructive">
                                    Save {discount}%
                                </span>
                            )}
                        </div>

                        {/* Stock Status */}
                        <div className="flex items-center gap-3">
                            {inStock ? (
                                <>
                                    <div className="h-3 w-3 animate-pulse rounded-full bg-success"></div>
                                    <span className="font-medium text-success">
                                        {product.stock ? `In Stock (${product.stock} available)` : 'In Stock'}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="h-3 w-3 rounded-full bg-destructive"></div>
                                    <span className="font-medium text-destructive">Out of Stock</span>
                                </>
                            )}
                        </div>

                        {/* Short Description */}
                        {product.excerpt && <p className="text-lg leading-relaxed text-muted-foreground">{product.excerpt}</p>}

                        {/* Attributes */}
                        {product.attributes && Object.keys(product.attributes).length > 0 && (
                            <div className="space-y-3 rounded-xl bg-muted/50 p-4">
                                {Object.entries(product.attributes).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <span className="min-w-[100px] text-muted-foreground capitalize">{key}:</span>
                                        <span className="font-medium text-foreground">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Cart Message */}
                        {cartMessage && (
                            <div
                                className={`flex items-center gap-3 rounded-xl p-4 ${cartMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}
                            >
                                {cartMessage.type === 'success' ? <Check className="h-5 w-5" /> : null}
                                {cartMessage.text}
                                {cartMessage.type === 'success' && (
                                    <Link href="/shop/cart" className="ml-auto text-sm font-medium underline">
                                        View Cart
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Quantity & Add to Cart */}
                        {inStock && (
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center rounded-xl border bg-card">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="rounded-l-xl p-4 transition-colors hover:bg-accent"
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                                        className="w-16 border-x border-border py-3 text-center font-medium focus:outline-none"
                                        min="1"
                                        max={maxQuantity}
                                    />
                                    <button
                                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                                        className="rounded-r-xl p-4 transition-colors hover:bg-accent"
                                        disabled={quantity >= maxQuantity}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <button
                                    onClick={addToCart}
                                    disabled={addingToCart}
                                    className="flex flex-1 items-center justify-center gap-3 rounded-md bg-primary px-8 py-4 font-semibold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                                </button>
                                <button
                                    onClick={() => setIsWishlisted(!isWishlisted)}
                                    className={`rounded-xl border-2 p-4 transition-all ${
                                        isWishlisted
                                            ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                            : 'border-border text-muted-foreground/80 hover:border-input hover:text-foreground'
                                    }`}
                                >
                                    <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                        )}

                        {/* SKU */}
                        {product.sku && (
                            <p className="text-sm text-muted-foreground">
                                SKU: <span className="font-mono font-medium text-foreground/80">{product.sku}</span>
                            </p>
                        )}

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-muted-foreground">Tags:</span>
                                {product.tags.map((tag) => (
                                    <Link
                                        key={tag.id}
                                        href={`/shop?tag=${tag.slug}`}
                                        className="rounded-full bg-muted px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-accent"
                                    >
                                        {tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Trust Badges */}
                        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-6">
                            <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/50 p-4 text-center">
                                <Truck className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Free Shipping</p>
                                    <p className="text-xs text-muted-foreground">On orders over $50</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/50 p-4 text-center">
                                <Shield className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Secure Payment</p>
                                    <p className="text-xs text-muted-foreground">100% protected</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-3 rounded-xl bg-muted/50 p-4 text-center">
                                <RotateCcw className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="text-sm font-medium text-foreground">Easy Returns</p>
                                    <p className="text-xs text-muted-foreground">30 day returns</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Description */}
                {product.content && (
                    <div className="mt-16 rounded-3xl border bg-card p-8 md:p-12">
                        <h2 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">Product Description</h2>
                        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: product.content }} />
                    </div>
                )}

                {/* Related Products */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="mt-16">
                        <div className="mb-8 flex items-center justify-between">
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground">You May Also Like</h2>
                            <Link href="/shop" className="font-medium text-primary hover:text-primary">
                                View all →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            {relatedProducts.map((p) => {
                                const relatedDiscount =
                                    p.sale_price && p.price && p.sale_price < p.price ? Math.round(((p.price - p.sale_price) / p.price) * 100) : null;

                                return (
                                    <Link
                                        key={p.id}
                                        href={p.url || `/shop/${p.slug}`}
                                        className="group overflow-hidden rounded-xl border bg-card shadow-xs transition-all hover:border-primary/30 hover:shadow-xl"
                                    >
                                        <div className="relative aspect-square overflow-hidden bg-muted/50">
                                            {p.featured_image ? (
                                                <img
                                                    src={p.featured_image}
                                                    alt={p.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
                                                    <ShoppingCart className="h-10 w-10" />
                                                </div>
                                            )}
                                            {relatedDiscount && (
                                                <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-1 text-xs font-bold text-white">
                                                    -{relatedDiscount}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="mb-2 line-clamp-2 font-medium text-foreground transition-colors group-hover:text-primary">
                                                {p.title}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                {p.sale_price && p.sale_price < (p.price || 0) && (
                                                    <span className="text-sm text-muted-foreground/80 line-through">
                                                        {formatPrice(p.price, p.currency)}
                                                    </span>
                                                )}
                                                <span className="font-bold text-foreground">{formatPrice(p.sale_price || p.price, p.currency)}</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
