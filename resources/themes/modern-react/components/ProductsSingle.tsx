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
                    <p className="text-gray-600">Product not found.</p>
                    <Link href="/shop" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700">
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
            <div className="py-8">
                {/* Breadcrumb */}
                <nav className="mb-8">
                    <ol className="flex items-center gap-2 text-sm text-gray-500">
                        <li>
                            <Link href="/" className="hover:text-gray-700">
                                Home
                            </Link>
                        </li>
                        <li>/</li>
                        <li>
                            <Link href={backUrl} className="hover:text-gray-700">
                                Shop
                            </Link>
                        </li>
                        {item.categories && item.categories.length > 0 && (
                            <>
                                <li>/</li>
                                <li>
                                    <Link href={`/product-category/${item.categories[0].slug}`} className="hover:text-gray-700">
                                        {item.categories[0].name}
                                    </Link>
                                </li>
                            </>
                        )}
                        <li>/</li>
                        <li className="max-w-[200px] truncate font-medium text-gray-900">{item.title}</li>
                    </ol>
                </nav>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                    {/* Product Images */}
                    <div className="space-y-4">
                        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
                            {selectedImage ? (
                                <img src={selectedImage} alt={item.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                    <ShoppingCart className="h-20 w-20" />
                                </div>
                            )}
                            {discount && (
                                <span className="absolute top-4 left-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white">
                                    -{discount}% OFF
                                </span>
                            )}
                            {!inStock && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <span className="rounded-lg bg-white px-6 py-3 font-semibold text-gray-900">Out of Stock</span>
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
                                            selectedImage === img ? 'border-indigo-600' : 'border-transparent hover:border-gray-300'
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
                                    <Link
                                        key={cat.id}
                                        href={`/product-category/${cat.slug}`}
                                        className="text-sm text-indigo-600 hover:text-indigo-700"
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{item.title}</h1>

                        {/* Price */}
                        <div className="flex items-center gap-4">
                            {item.sale_price && item.sale_price < (item.price || 0) && (
                                <span className="text-2xl text-gray-400 line-through">{formatPrice(item.price, item.currency)}</span>
                            )}
                            <span
                                className={`text-3xl font-bold ${item.sale_price && item.sale_price < (item.price || 0) ? 'text-red-600' : 'text-gray-900'}`}
                            >
                                {formatPrice(displayPrice, item.currency)}
                            </span>
                            {discount && (
                                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">Save {discount}%</span>
                            )}
                        </div>

                        {/* Stock Status */}
                        <div className="flex items-center gap-2">
                            {inStock ? (
                                <>
                                    <Check className="h-5 w-5 text-green-600" />
                                    <span className="font-medium text-green-600">
                                        {item.stock ? `In Stock (${item.stock} available)` : 'In Stock'}
                                    </span>
                                </>
                            ) : (
                                <span className="font-medium text-red-600">Out of Stock</span>
                            )}
                        </div>

                        {/* Short Description */}
                        {item.excerpt && <p className="text-lg leading-relaxed text-gray-600">{item.excerpt}</p>}

                        {/* Attributes */}
                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                            <div className="space-y-3 border-y border-gray-200 py-4">
                                {Object.entries(item.attributes).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <span className="text-gray-500 capitalize">{key}:</span>
                                        <span className="font-medium text-gray-900">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Quantity & Add to Cart */}
                        {inStock && (
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center rounded-lg border border-gray-300">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-3 transition-colors hover:bg-gray-100"
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                                        className="w-16 border-x border-gray-300 py-2 text-center focus:outline-none"
                                        min="1"
                                        max={maxQuantity}
                                    />
                                    <button
                                        onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                                        className="p-3 transition-colors hover:bg-gray-100"
                                        disabled={quantity >= maxQuantity}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                                <button
                                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
                                    data-product-id={item.id}
                                    data-quantity={quantity}
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    Add to Cart
                                </button>
                                <button
                                    onClick={() => setIsWishlisted(!isWishlisted)}
                                    className={`rounded-lg border p-3 transition-colors ${
                                        isWishlisted ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                        )}

                        {/* SKU */}
                        {item.sku && (
                            <p className="text-sm text-gray-500">
                                SKU: <span className="font-medium">{item.sku}</span>
                            </p>
                        )}

                        {/* Tags */}
                        {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm text-gray-500">Tags:</span>
                                {item.tags.map((tag) => (
                                    <Link
                                        key={tag.id}
                                        href={`/shop?tag=${tag.slug}`}
                                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                                    >
                                        {tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-6">
                            <div className="flex flex-col items-center gap-2 text-center">
                                <Truck className="h-6 w-6 text-indigo-600" />
                                <span className="text-sm text-gray-600">Free Shipping</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <Shield className="h-6 w-6 text-indigo-600" />
                                <span className="text-sm text-gray-600">Secure Payment</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <RotateCcw className="h-6 w-6 text-indigo-600" />
                                <span className="text-sm text-gray-600">Easy Returns</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Full Description */}
                {item.content && (
                    <div className="mt-16">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900">Product Description</h2>
                        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: item.content }} />
                    </div>
                )}

                {/* Related Products */}
                {relatedProducts && relatedProducts.length > 0 && (
                    <div className="mt-16">
                        <h2 className="mb-6 text-2xl font-bold text-gray-900">Related Products</h2>
                        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                            {relatedProducts.map((p) => (
                                <Link
                                    key={p.id}
                                    href={p.url || `/shop/${p.slug}`}
                                    className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
                                >
                                    <div className="aspect-square overflow-hidden bg-gray-100">
                                        {p.featured_image ? (
                                            <img
                                                src={p.featured_image}
                                                alt={p.title}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                <ShoppingCart className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="line-clamp-2 font-medium text-gray-900 transition-colors group-hover:text-indigo-600">
                                            {p.title}
                                        </h3>
                                        <p className="mt-1 font-bold text-gray-900">{formatPrice(p.sale_price || p.price, p.currency)}</p>
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
