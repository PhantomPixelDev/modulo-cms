import SEOHead from '@/components/SEOHead';
import { Filter, Grid, List, Search, ShoppingCart, X } from 'lucide-react';
import React, { useState } from 'react';
import Layout from '../Layout';

interface Product {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    featured_image?: string;
    url?: string;
    price?: number;
    sale_price?: number | null;
    currency?: string;
    in_stock?: boolean;
    featured?: boolean;
    categories?: Array<{ id: number; name: string; slug: string }>;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    posts_count?: number;
}

interface ShopArchiveProps {
    products?: {
        data: Product[];
    };
    categories?: Category[];
    filters?: {
        category?: string;
        tag?: string;
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
    };
    site?: any;
    theme?: any;
    menus?: any;
}

export default function Archive({ products, categories, filters, pagination, site, theme, menus }: ShopArchiveProps) {
    const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeMenus = menus && typeof menus === 'object' ? menus : {};

    const list: Product[] = Array.isArray(products?.data) ? products.data : [];

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [addingId, setAddingId] = useState<number | null>(null);
    const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const formatPrice = (price?: number, currency = 'USD') => {
        if (price === undefined || price === null) return '';
        const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
        return `${symbols[currency] || '$'}${price.toFixed(2)}`;
    };

    const getDiscountPercent = (price?: number, salePrice?: number | null) => {
        if (!price || !salePrice || salePrice >= price) return null;
        return Math.round(((price - salePrice) / price) * 100);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
    };

    const addToCart = async (productId: number) => {
        setAddingId(productId);
        setCartMessage(null);
        try {
            const response = await fetch('/shop/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ product_id: productId, quantity: 1 }),
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
        setAddingId(null);
    };

    return (
        <Layout theme={safeTheme} site={safeSite} menus={safeMenus} title="Shop" description="Browse our products">
            <SEOHead title={`Shop | ${safeSite.name}`} description="Browse our products and find what you need." />

            <div className="space-y-8">
                {/* Hero Header */}
                <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-16 text-white">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative px-4 text-center">
                        <h1 className="mb-4 text-4xl font-bold md:text-6xl">Shop</h1>
                        <p className="mx-auto mb-8 max-w-2xl text-xl opacity-90">Discover our amazing collection of products</p>
                        {pagination && <p className="text-sm opacity-75">{pagination.total} products available</p>}

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full rounded-full px-6 py-4 pr-12 text-gray-900 placeholder-gray-500 focus:ring-4 focus:ring-white/30 focus:outline-none"
                                />
                                <button type="submit" className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                                    <Search className="h-5 w-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </header>

                {/* Cart Message */}
                {cartMessage && (
                    <div
                        className={`flex items-center gap-3 rounded-2xl p-4 ${cartMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                    >
                        {cartMessage.text}
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                                showFilters ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>
                        {filters?.category && (
                            <span className="flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                                {filters.category}
                                <a href="/shop" className="hover:text-indigo-900">
                                    <X className="h-3 w-3" />
                                </a>
                            </span>
                        )}
                        {filters?.search && (
                            <span className="flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700">
                                "{filters.search}"
                                <a href="/shop" className="hover:text-purple-900">
                                    <X className="h-3 w-3" />
                                </a>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            defaultValue={filters?.orderby || 'date'}
                            onChange={(e) => {
                                const params = new URLSearchParams(window.location.search);
                                params.set('orderby', e.target.value);
                                window.location.href = `/shop?${params.toString()}`;
                            }}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="date">Latest</option>
                            <option value="price">Price: Low to High</option>
                            <option value="title">Name A-Z</option>
                            <option value="popularity">Most Popular</option>
                        </select>
                        <div className="flex overflow-hidden rounded-xl border border-gray-200">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Grid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Sidebar Filters */}
                    {showFilters && (
                        <aside className="w-72 flex-shrink-0">
                            <div className="sticky top-4 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                {/* Categories */}
                                {categories && categories.length > 0 && (
                                    <div>
                                        <h3 className="mb-4 font-semibold text-gray-900">Categories</h3>
                                        <ul className="space-y-2">
                                            <li>
                                                <a
                                                    href="/shop"
                                                    className={`block rounded-lg px-3 py-2 transition-colors ${
                                                        !filters?.category
                                                            ? 'bg-indigo-50 font-medium text-indigo-700'
                                                            : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    All Products
                                                </a>
                                            </li>
                                            {categories.map((cat) => (
                                                <li key={cat.id}>
                                                    <a
                                                        href={`/shop?category=${cat.slug}`}
                                                        className={`flex justify-between rounded-lg px-3 py-2 transition-colors ${
                                                            filters?.category === cat.slug
                                                                ? 'bg-indigo-50 font-medium text-indigo-700'
                                                                : 'text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <span>{cat.name}</span>
                                                        {cat.posts_count !== undefined && (
                                                            <span className="text-sm text-gray-400">({cat.posts_count})</span>
                                                        )}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Price Range */}
                                <div>
                                    <h3 className="mb-4 font-semibold text-gray-900">Price Range</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            defaultValue={filters?.min_price}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                            onBlur={(e) => {
                                                const params = new URLSearchParams(window.location.search);
                                                if (e.target.value) params.set('min_price', e.target.value);
                                                else params.delete('min_price');
                                                window.location.href = `/shop?${params.toString()}`;
                                            }}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            defaultValue={filters?.max_price}
                                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                            onBlur={(e) => {
                                                const params = new URLSearchParams(window.location.search);
                                                if (e.target.value) params.set('max_price', e.target.value);
                                                else params.delete('max_price');
                                                window.location.href = `/shop?${params.toString()}`;
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </aside>
                    )}

                    {/* Product Grid/List */}
                    <div className="flex-1">
                        {list.length === 0 ? (
                            <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center">
                                <ShoppingCart className="mx-auto mb-6 h-20 w-20 text-gray-200" />
                                <h3 className="mb-2 text-xl font-semibold text-gray-900">No products found</h3>
                                <p className="mb-6 text-gray-500">Try adjusting your filters or search terms</p>
                                <a
                                    href="/shop"
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700"
                                >
                                    View all products
                                </a>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {list.map((p) => {
                                    const href = p.url || `/shop/${p.slug}`;
                                    const discount = getDiscountPercent(p.price, p.sale_price);
                                    const displayPrice = p.sale_price && p.sale_price < (p.price || 0) ? p.sale_price : p.price;

                                    return (
                                        <article
                                            key={p.id}
                                            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:border-indigo-100 hover:shadow-xl"
                                        >
                                            <div className="relative aspect-square overflow-hidden bg-gray-50">
                                                {p.featured_image ? (
                                                    <a href={href} className="block h-full w-full">
                                                        <img
                                                            src={p.featured_image}
                                                            alt={p.title}
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                    </a>
                                                ) : (
                                                    <a href={href} className="flex h-full w-full items-center justify-center text-gray-300">
                                                        <ShoppingCart className="h-16 w-16" />
                                                    </a>
                                                )}
                                                {discount && (
                                                    <span className="absolute top-3 right-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                                                        -{discount}%
                                                    </span>
                                                )}
                                                {p.in_stock === false && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                        <span className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900">
                                                            Out of Stock
                                                        </span>
                                                    </div>
                                                )}
                                                {p.featured && !discount && (
                                                    <span className="absolute top-3 left-3 rounded-full bg-yellow-400 px-2.5 py-1 text-xs font-bold text-yellow-900">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-5">
                                                {p.categories && p.categories.length > 0 && (
                                                    <p className="mb-2 text-xs font-medium text-indigo-600">
                                                        {p.categories.map((c) => c.name).join(' • ')}
                                                    </p>
                                                )}
                                                <h2 className="mb-3 line-clamp-2 font-semibold text-gray-900 transition-colors group-hover:text-indigo-600">
                                                    <a href={href}>{p.title}</a>
                                                </h2>
                                                <div className="mb-4 flex items-center gap-2">
                                                    {p.sale_price && p.sale_price < (p.price || 0) && (
                                                        <span className="text-sm text-gray-400 line-through">{formatPrice(p.price, p.currency)}</span>
                                                    )}
                                                    <span
                                                        className={`text-lg font-bold ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-red-600' : 'text-gray-900'}`}
                                                    >
                                                        {formatPrice(displayPrice, p.currency)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => addToCart(p.id)}
                                                    className={`w-full rounded-xl py-2.5 font-medium transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 ${
                                                        p.in_stock === false || addingId === p.id
                                                            ? 'bg-gray-100 text-gray-400'
                                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                    }`}
                                                    disabled={p.in_stock === false || addingId === p.id}
                                                >
                                                    {p.in_stock === false ? 'Out of Stock' : addingId === p.id ? 'Adding...' : 'Add to Cart'}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {list.map((p) => {
                                    const href = p.url || `/shop/${p.slug}`;
                                    const discount = getDiscountPercent(p.price, p.sale_price);
                                    const displayPrice = p.sale_price && p.sale_price < (p.price || 0) ? p.sale_price : p.price;

                                    return (
                                        <article
                                            key={p.id}
                                            className="flex flex-col gap-6 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-lg sm:flex-row"
                                        >
                                            <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 sm:w-48">
                                                {p.featured_image ? (
                                                    <a href={href} className="block h-full w-full">
                                                        <img src={p.featured_image} alt={p.title} className="h-full w-full object-cover" />
                                                    </a>
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                                                        <ShoppingCart className="h-12 w-12" />
                                                    </div>
                                                )}
                                                {discount && (
                                                    <span className="absolute top-2 right-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                                                        -{discount}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-1 flex-col justify-between gap-4">
                                                <div>
                                                    {p.categories && p.categories.length > 0 && (
                                                        <p className="mb-1 text-xs font-medium text-indigo-600">
                                                            {p.categories.map((c) => c.name).join(' • ')}
                                                        </p>
                                                    )}
                                                    <h2 className="mb-2 text-xl font-semibold text-gray-900">
                                                        <a href={href} className="transition-colors hover:text-indigo-600">
                                                            {p.title}
                                                        </a>
                                                    </h2>
                                                    {p.excerpt && <p className="line-clamp-2 text-sm text-gray-500">{p.excerpt}</p>}
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                        {p.sale_price && p.sale_price < (p.price || 0) && (
                                                            <span className="text-sm text-gray-400 line-through">
                                                                {formatPrice(p.price, p.currency)}
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`text-lg font-bold ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-red-600' : 'text-gray-900'}`}
                                                        >
                                                            {formatPrice(displayPrice, p.currency)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => addToCart(p.id)}
                                                        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                                            p.in_stock === false || addingId === p.id
                                                                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                        }`}
                                                        disabled={p.in_stock === false || addingId === p.id}
                                                    >
                                                        <ShoppingCart className="h-4 w-4" />
                                                        {p.in_stock === false ? 'Out of Stock' : addingId === p.id ? 'Adding...' : 'Add to Cart'}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
