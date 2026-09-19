import SEOHead from '@/components/SEOHead';
import { Filter, Grid, List, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import Layout from './Layout';

interface Product {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    featured_image?: string;
    url?: string;
    published_at?: string;
    price?: number;
    sale_price?: number | null;
    currency?: string;
    sku?: string;
    stock?: number | null;
    in_stock?: boolean;
    featured?: boolean;
    categories?: Array<{ id: number; name: string; slug: string }>;
    tags?: Array<{ id: number; name: string; slug: string }>;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    posts_count?: number;
}

interface ProductsProps {
    products?: {
        data: Product[];
    };
    posts?: {
        data: Product[];
    };
    categories?: Category[];
    filters?: {
        category?: string;
        search?: string;
        min_price?: string;
        max_price?: string;
        orderby?: string;
        order?: string;
    };
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        prev_page_url?: string;
        next_page_url?: string;
    };
    site?: any;
    theme?: any;
    menus?: any;
    postType?: {
        plural_label?: string;
        description?: string;
        route_prefix?: string;
    };
}

export default function Products({ products, posts, categories, filters, pagination, site, theme, menus, postType }: ProductsProps) {
    const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeMenus = menus && typeof menus === 'object' ? menus : {};

    // Support both products and posts props
    const list: Product[] = Array.isArray(products?.data) ? products.data : Array.isArray(posts?.data) ? posts.data : [];

    const prefix = postType?.route_prefix || 'shop';
    const pageTitle = postType?.plural_label || 'Shop';
    const pageDescription = postType?.description || 'Browse our products.';

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);

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

    const getDiscountPercent = (price?: number, salePrice?: number | null) => {
        if (!price || !salePrice || salePrice >= price) return null;
        return Math.round(((price - salePrice) / price) * 100);
    };

    return (
        <Layout theme={safeTheme} site={safeSite} menus={safeMenus} title={pageTitle} description={pageDescription}>
            <SEOHead title={`${pageTitle} | ${safeSite.name}`} description={pageDescription} />

            <div className="space-y-8">
                {/* Hero Header */}
                <header className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-12 text-center text-white">
                    <h1 className="mb-4 text-4xl font-bold md:text-5xl">{pageTitle}</h1>
                    <p className="mx-auto max-w-2xl text-xl opacity-90">{pageDescription}</p>
                    {pagination && <p className="mt-4 text-sm opacity-75">{pagination.total} products</p>}
                </header>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 transition-colors hover:bg-gray-200"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>
                        {filters?.category && (
                            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                                {filters.category}
                                <a href="/shop" className="ml-2 hover:text-indigo-900">
                                    ×
                                </a>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            defaultValue={filters?.orderby || 'date'}
                            onChange={(e) => (window.location.href = `/shop?orderby=${e.target.value}`)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="date">Latest</option>
                            <option value="price">Price: Low to High</option>
                            <option value="title">Name</option>
                            <option value="popularity">Popularity</option>
                        </select>
                        <div className="flex overflow-hidden rounded-lg border border-gray-200">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Grid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar Filters */}
                    {showFilters && categories && categories.length > 0 && (
                        <aside className="w-64 flex-shrink-0">
                            <div className="sticky top-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 font-semibold text-gray-900">Categories</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <a
                                            href="/shop"
                                            className={`block py-1 ${!filters?.category ? 'font-medium text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                                        >
                                            All Products
                                        </a>
                                    </li>
                                    {categories.map((cat) => (
                                        <li key={cat.id}>
                                            <a
                                                href={`/shop?category=${cat.slug}`}
                                                className={`block py-1 ${filters?.category === cat.slug ? 'font-medium text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                                            >
                                                {cat.name}
                                                {cat.posts_count !== undefined && (
                                                    <span className="ml-2 text-sm text-gray-400">({cat.posts_count})</span>
                                                )}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </aside>
                    )}

                    {/* Product Grid/List */}
                    <div className="flex-1">
                        {list.length === 0 ? (
                            <div className="rounded-xl border border-gray-100 bg-white py-16 text-center">
                                <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                                <p className="text-lg text-gray-600">No products found.</p>
                                {filters?.category && (
                                    <a href="/shop" className="mt-4 inline-block text-indigo-600 hover:text-indigo-700">
                                        View all products →
                                    </a>
                                )}
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {list.map((p) => {
                                    if (!p || typeof p !== 'object' || !p.id) return null;
                                    const href = p.url || `/${prefix}/${p.slug || ''}`;
                                    const discount = getDiscountPercent(p.price, p.sale_price);
                                    const displayPrice = p.sale_price && p.sale_price < (p.price || 0) ? p.sale_price : p.price;

                                    return (
                                        <article
                                            key={p.id}
                                            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl"
                                        >
                                            <div className="relative aspect-square overflow-hidden bg-gray-100">
                                                {p.featured_image ? (
                                                    <a href={href} className="block h-full w-full">
                                                        <img
                                                            src={p.featured_image}
                                                            alt={p.title}
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                    </a>
                                                ) : (
                                                    <a href={href} className="flex h-full w-full items-center justify-center text-gray-400">
                                                        <ShoppingCart className="h-12 w-12" />
                                                    </a>
                                                )}
                                                {discount && (
                                                    <span className="absolute top-3 right-3 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                                                        -{discount}%
                                                    </span>
                                                )}
                                                {p.in_stock === false && (
                                                    <span className="absolute top-3 left-3 rounded-full bg-gray-800 px-2 py-1 text-xs text-white">
                                                        Out of Stock
                                                    </span>
                                                )}
                                                {p.featured && (
                                                    <span className="absolute top-3 left-3 rounded-full bg-yellow-400 px-2 py-1 text-xs font-bold text-yellow-900">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                {p.categories && p.categories.length > 0 && (
                                                    <p className="mb-1 text-xs text-gray-500">{p.categories.map((c) => c.name).join(', ')}</p>
                                                )}
                                                <h2 className="mb-2 line-clamp-2 font-semibold text-gray-900">
                                                    <a href={href} className="transition-colors hover:text-indigo-600">
                                                        {p.title || '(untitled)'}
                                                    </a>
                                                </h2>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {p.sale_price && p.sale_price < (p.price || 0) && (
                                                            <span className="text-sm text-gray-400 line-through">
                                                                {formatPrice(p.price, p.currency)}
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`font-bold ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-red-600' : 'text-gray-900'}`}
                                                        >
                                                            {formatPrice(displayPrice, p.currency)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="mt-3 w-full rounded-lg bg-indigo-600 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                                                    disabled={p.in_stock === false}
                                                    data-product-id={p.id}
                                                >
                                                    {p.in_stock === false ? 'Out of Stock' : 'Add to Cart'}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {list.map((p) => {
                                    if (!p || typeof p !== 'object' || !p.id) return null;
                                    const href = p.url || `/${prefix}/${p.slug || ''}`;
                                    const discount = getDiscountPercent(p.price, p.sale_price);
                                    const displayPrice = p.sale_price && p.sale_price < (p.price || 0) ? p.sale_price : p.price;

                                    return (
                                        <article
                                            key={p.id}
                                            className="flex gap-6 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-lg"
                                        >
                                            <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                                {p.featured_image ? (
                                                    <a href={href} className="block h-full w-full">
                                                        <img src={p.featured_image} alt={p.title} className="h-full w-full object-cover" />
                                                    </a>
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                                                        <ShoppingCart className="h-12 w-12" />
                                                    </div>
                                                )}
                                                {discount && (
                                                    <span className="absolute top-2 right-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                                                        -{discount}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-1 flex-col justify-between">
                                                <div>
                                                    {p.categories && p.categories.length > 0 && (
                                                        <p className="mb-1 text-xs text-gray-500">{p.categories.map((c) => c.name).join(', ')}</p>
                                                    )}
                                                    <h2 className="mb-2 text-xl font-semibold text-gray-900">
                                                        <a href={href} className="transition-colors hover:text-indigo-600">
                                                            {p.title}
                                                        </a>
                                                    </h2>
                                                    {p.excerpt && <p className="line-clamp-2 text-sm text-gray-600">{p.excerpt}</p>}
                                                </div>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {p.sale_price && p.sale_price < (p.price || 0) && (
                                                            <span className="text-gray-400 line-through">{formatPrice(p.price, p.currency)}</span>
                                                        )}
                                                        <span
                                                            className={`text-xl font-bold ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-red-600' : 'text-gray-900'}`}
                                                        >
                                                            {formatPrice(displayPrice, p.currency)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        className="rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-gray-300"
                                                        disabled={p.in_stock === false}
                                                        data-product-id={p.id}
                                                    >
                                                        {p.in_stock === false ? 'Out of Stock' : 'Add to Cart'}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.last_page > 1 && (
                            <div className="mt-10 flex items-center justify-center gap-2">
                                {pagination.prev_page_url && (
                                    <a
                                        href={pagination.prev_page_url}
                                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 transition-colors hover:bg-gray-50"
                                    >
                                        ← Previous
                                    </a>
                                )}
                                <span className="px-4 py-2 text-gray-600">
                                    Page {pagination.current_page} of {pagination.last_page}
                                </span>
                                {pagination.next_page_url && (
                                    <a
                                        href={pagination.next_page_url}
                                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 transition-colors hover:bg-gray-50"
                                    >
                                        Next →
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
