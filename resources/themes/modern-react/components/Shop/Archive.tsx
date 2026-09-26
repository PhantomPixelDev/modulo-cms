import { Filter, Grid, List, Search, ShoppingCart, X } from 'lucide-react';
import React, { useState } from 'react';
import Layout from '../Layout';
import { configureMoney, formatMoney, type MoneyFormat } from './totals';

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
    money?: MoneyFormat;
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

export default function Archive({ products, categories, filters, pagination, site, theme, menus, money }: ShopArchiveProps) {
    configureMoney(money);
    const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeMenus = menus && typeof menus === 'object' ? menus : {};

    const list: Product[] = Array.isArray(products?.data) ? products.data : [];

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [addingId, setAddingId] = useState<number | null>(null);
    const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const formatPrice = formatMoney;

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
        <Layout theme={safeTheme} site={safeSite} menus={safeMenus} title="Shop" description="Browse our products and find what you need.">
            <div className="space-y-8">
                {/* Header */}
                <header className="flex flex-col gap-6 border-b pb-8 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Shop</h1>
                        <p className="text-muted-foreground">Discover our collection of products</p>
                        {pagination && <p className="text-sm text-muted-foreground tabular-nums">{pagination.total} products available</p>}
                    </div>

                    <form onSubmit={handleSearch} role="search" className="relative w-full md:w-80">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search products…"
                            aria-label="Search products"
                            className="h-10 w-full rounded-md border border-input bg-input-bg pr-3 pl-9 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                        />
                    </form>
                </header>

                {/* Cart Message */}
                {cartMessage && (
                    <div
                        className={`flex items-center gap-3 rounded-xl p-4 ${cartMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}
                    >
                        {cartMessage.text}
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-xs">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-colors ${
                                showFilters ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
                            }`}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>
                        {filters?.category && (
                            <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                                {filters.category}
                                <a href="/shop" className="hover:text-primary/80">
                                    <X className="h-3 w-3" />
                                </a>
                            </span>
                        )}
                        {filters?.search && (
                            <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                                "{filters.search}"
                                <a href="/shop" className="hover:text-primary/80">
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
                            className="h-9 rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                        >
                            <option value="date">Latest</option>
                            <option value="price">Price: Low to High</option>
                            <option value="title">Name A-Z</option>
                            <option value="popularity">Most Popular</option>
                        </select>
                        <div className="flex overflow-hidden rounded-xl border">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
                            >
                                <Grid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
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
                            <div className="sticky top-4 space-y-6 rounded-xl border bg-card p-6 shadow-xs">
                                {/* Categories */}
                                {categories && categories.length > 0 && (
                                    <div>
                                        <h3 className="mb-4 font-semibold text-foreground">Categories</h3>
                                        <ul className="space-y-2">
                                            <li>
                                                <a
                                                    href="/shop"
                                                    className={`block rounded-lg px-3 py-2 transition-colors ${
                                                        !filters?.category
                                                            ? 'bg-primary/10 font-medium text-primary'
                                                            : 'text-muted-foreground hover:bg-accent'
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
                                                                ? 'bg-primary/10 font-medium text-primary'
                                                                : 'text-muted-foreground hover:bg-accent'
                                                        }`}
                                                    >
                                                        <span>{cat.name}</span>
                                                        {cat.posts_count !== undefined && (
                                                            <span className="text-sm text-muted-foreground/80">({cat.posts_count})</span>
                                                        )}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Price Range */}
                                <div>
                                    <h3 className="mb-4 font-semibold text-foreground">Price Range</h3>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            defaultValue={filters?.min_price}
                                            className="w-full rounded-md border px-3 py-2 text-sm"
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
                                            className="w-full rounded-md border px-3 py-2 text-sm"
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
                            <div className="rounded-xl border bg-card py-20 text-center">
                                <ShoppingCart className="mx-auto mb-6 h-20 w-20 text-muted-foreground/40" />
                                <h3 className="mb-2 text-xl font-semibold text-foreground">No products found</h3>
                                <p className="mb-6 text-muted-foreground">Try adjusting your filters or search terms</p>
                                <a
                                    href="/shop"
                                    className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-white transition-colors hover:bg-primary/90"
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
                                            className="group overflow-hidden rounded-xl border bg-card shadow-xs transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
                                        >
                                            <div className="relative aspect-square overflow-hidden bg-muted/50">
                                                {p.featured_image ? (
                                                    <a href={href} className="block h-full w-full">
                                                        <img
                                                            src={p.featured_image}
                                                            alt={p.title}
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        />
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={href}
                                                        className="flex h-full w-full items-center justify-center text-muted-foreground/60"
                                                    >
                                                        <ShoppingCart className="h-16 w-16" />
                                                    </a>
                                                )}
                                                {discount && (
                                                    <span className="absolute top-3 right-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                                                        -{discount}%
                                                    </span>
                                                )}
                                                {p.in_stock === false && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                        <span className="rounded-lg bg-card px-4 py-2 text-sm font-medium text-foreground">
                                                            Out of Stock
                                                        </span>
                                                    </div>
                                                )}
                                                {p.featured && !discount && (
                                                    <span className="absolute top-3 left-3 rounded-full bg-warning px-2.5 py-1 text-xs font-bold text-warning-foreground">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-5">
                                                {p.categories && p.categories.length > 0 && (
                                                    <p className="mb-2 text-xs font-medium text-primary">
                                                        {p.categories.map((c) => c.name).join(' • ')}
                                                    </p>
                                                )}
                                                <h2 className="mb-3 line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary">
                                                    <a href={href}>{p.title}</a>
                                                </h2>
                                                <div className="mb-4 flex items-center gap-2">
                                                    {p.sale_price && p.sale_price < (p.price || 0) && (
                                                        <span className="text-sm text-muted-foreground/80 line-through">
                                                            {formatPrice(p.price, p.currency)}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`text-lg font-semibold tracking-tight ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-destructive' : 'text-foreground'}`}
                                                    >
                                                        {formatPrice(displayPrice, p.currency)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => addToCart(p.id)}
                                                    className={`w-full rounded-xl py-2.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                                        p.in_stock === false || addingId === p.id
                                                            ? 'bg-muted text-muted-foreground/80'
                                                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
                                            className="flex flex-col gap-6 overflow-hidden rounded-xl border bg-card p-5 shadow-xs transition-all hover:shadow-lg sm:flex-row"
                                        >
                                            <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-xl bg-muted/50 sm:w-48">
                                                {p.featured_image ? (
                                                    <a href={href} className="block h-full w-full">
                                                        <img src={p.featured_image} alt={p.title} className="h-full w-full object-cover" />
                                                    </a>
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
                                                        <ShoppingCart className="h-12 w-12" />
                                                    </div>
                                                )}
                                                {discount && (
                                                    <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-1 text-xs font-bold text-white">
                                                        -{discount}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-1 flex-col justify-between gap-4">
                                                <div>
                                                    {p.categories && p.categories.length > 0 && (
                                                        <p className="mb-1 text-xs font-medium text-primary">
                                                            {p.categories.map((c) => c.name).join(' • ')}
                                                        </p>
                                                    )}
                                                    <h2 className="mb-2 text-xl font-semibold text-foreground">
                                                        <a href={href} className="transition-colors hover:text-primary">
                                                            {p.title}
                                                        </a>
                                                    </h2>
                                                    {p.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>}
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                        {p.sale_price && p.sale_price < (p.price || 0) && (
                                                            <span className="text-sm text-muted-foreground/80 line-through">
                                                                {formatPrice(p.price, p.currency)}
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`text-lg font-semibold tracking-tight ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-destructive' : 'text-foreground'}`}
                                                        >
                                                            {formatPrice(displayPrice, p.currency)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => addToCart(p.id)}
                                                        className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                                                            p.in_stock === false || addingId === p.id
                                                                ? 'cursor-not-allowed bg-muted text-muted-foreground/80'
                                                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
