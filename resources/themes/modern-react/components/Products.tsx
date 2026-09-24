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
                {/* Header */}
                <header className="space-y-2 border-b pb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{pageTitle}</h1>
                    {pageDescription && <p className="max-w-2xl text-muted-foreground">{pageDescription}</p>}
                    {pagination && <p className="text-sm text-muted-foreground tabular-nums">{pagination.total} products</p>}
                </header>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-xs">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 transition-colors hover:bg-accent"
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>
                        {filters?.category && (
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                                {filters.category}
                                <a href="/shop" className="ml-2 hover:text-primary/80">
                                    ×
                                </a>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            defaultValue={filters?.orderby || 'date'}
                            onChange={(e) => (window.location.href = `/shop?orderby=${e.target.value}`)}
                            className="h-9 rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                        >
                            <option value="date">Latest</option>
                            <option value="price">Price: Low to High</option>
                            <option value="title">Name</option>
                            <option value="popularity">Popularity</option>
                        </select>
                        <div className="flex overflow-hidden rounded-lg border">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
                            >
                                <Grid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
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
                            <div className="sticky top-4 rounded-xl border bg-card p-6 shadow-xs">
                                <h3 className="mb-4 font-semibold text-foreground">Categories</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <a
                                            href="/shop"
                                            className={`block py-1 ${!filters?.category ? 'font-medium text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            All Products
                                        </a>
                                    </li>
                                    {categories.map((cat) => (
                                        <li key={cat.id}>
                                            <a
                                                href={`/shop?category=${cat.slug}`}
                                                className={`block py-1 ${filters?.category === cat.slug ? 'font-medium text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                {cat.name}
                                                {cat.posts_count !== undefined && (
                                                    <span className="ml-2 text-sm text-muted-foreground/80">({cat.posts_count})</span>
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
                            <div className="rounded-xl border bg-card py-16 text-center">
                                <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-muted-foreground/60" />
                                <p className="text-lg text-muted-foreground">No products found.</p>
                                {filters?.category && (
                                    <a href="/shop" className="mt-4 inline-block text-primary hover:text-primary">
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
                                            className="group overflow-hidden rounded-xl border bg-card shadow-xs transition-all duration-300 hover:shadow-xl"
                                        >
                                            <div className="relative aspect-square overflow-hidden bg-muted">
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
                                                        className="flex h-full w-full items-center justify-center text-muted-foreground/80"
                                                    >
                                                        <ShoppingCart className="h-12 w-12" />
                                                    </a>
                                                )}
                                                {discount && (
                                                    <span className="absolute top-3 right-3 rounded-full bg-destructive px-2 py-1 text-xs font-bold text-white">
                                                        -{discount}%
                                                    </span>
                                                )}
                                                {p.in_stock === false && (
                                                    <span className="absolute top-3 left-3 rounded-full bg-foreground px-2 py-1 text-xs text-white">
                                                        Out of Stock
                                                    </span>
                                                )}
                                                {p.featured && (
                                                    <span className="absolute top-3 left-3 rounded-full bg-warning px-2 py-1 text-xs font-bold text-warning-foreground">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                {p.categories && p.categories.length > 0 && (
                                                    <p className="mb-1 text-xs text-muted-foreground">{p.categories.map((c) => c.name).join(', ')}</p>
                                                )}
                                                <h2 className="mb-2 line-clamp-2 font-semibold text-foreground">
                                                    <a href={href} className="transition-colors hover:text-primary">
                                                        {p.title || '(untitled)'}
                                                    </a>
                                                </h2>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {p.sale_price && p.sale_price < (p.price || 0) && (
                                                            <span className="text-sm text-muted-foreground/80 line-through">
                                                                {formatPrice(p.price, p.currency)}
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`font-bold ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-destructive' : 'text-foreground'}`}
                                                        >
                                                            {formatPrice(displayPrice, p.currency)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="mt-3 w-full rounded-md bg-primary py-2 font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
                                            className="flex gap-6 overflow-hidden rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-lg"
                                        >
                                            <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                                                {p.featured_image ? (
                                                    <a href={href} className="block h-full w-full">
                                                        <img src={p.featured_image} alt={p.title} className="h-full w-full object-cover" />
                                                    </a>
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/80">
                                                        <ShoppingCart className="h-12 w-12" />
                                                    </div>
                                                )}
                                                {discount && (
                                                    <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-1 text-xs font-bold text-white">
                                                        -{discount}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-1 flex-col justify-between">
                                                <div>
                                                    {p.categories && p.categories.length > 0 && (
                                                        <p className="mb-1 text-xs text-muted-foreground">
                                                            {p.categories.map((c) => c.name).join(', ')}
                                                        </p>
                                                    )}
                                                    <h2 className="mb-2 text-xl font-semibold text-foreground">
                                                        <a href={href} className="transition-colors hover:text-primary">
                                                            {p.title}
                                                        </a>
                                                    </h2>
                                                    {p.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>}
                                                </div>
                                                <div className="mt-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {p.sale_price && p.sale_price < (p.price || 0) && (
                                                            <span className="text-muted-foreground/80 line-through">
                                                                {formatPrice(p.price, p.currency)}
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`text-xl font-semibold tracking-tight ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-destructive' : 'text-foreground'}`}
                                                        >
                                                            {formatPrice(displayPrice, p.currency)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        className="rounded-md bg-primary px-6 py-2 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
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
                                        className="rounded-md border bg-card px-4 py-2 transition-colors hover:bg-accent"
                                    >
                                        ← Previous
                                    </a>
                                )}
                                <span className="px-4 py-2 text-muted-foreground">
                                    Page {pagination.current_page} of {pagination.last_page}
                                </span>
                                {pagination.next_page_url && (
                                    <a
                                        href={pagination.next_page_url}
                                        className="rounded-md border bg-card px-4 py-2 transition-colors hover:bg-accent"
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
