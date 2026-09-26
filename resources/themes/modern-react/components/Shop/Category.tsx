import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { ChevronRight, Grid, List, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
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
    categories?: Array<{ id: number; name: string; slug: string }>;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
}

interface ShopCategoryProps {
    money?: MoneyFormat;
    category?: Category;
    products?: {
        data: Product[];
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

export default function CategoryPage({ category, products, pagination, site, theme, menus, money }: ShopCategoryProps) {
    configureMoney(money);
    const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeMenus = menus && typeof menus === 'object' ? menus : {};

    const list: Product[] = Array.isArray(products?.data) ? products.data : [];
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const formatPrice = formatMoney;

    const getDiscountPercent = (price?: number, salePrice?: number | null) => {
        if (!price || !salePrice || salePrice >= price) return null;
        return Math.round(((price - salePrice) / price) * 100);
    };

    if (!category) {
        return (
            <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title="Category Not Found">
                <div className="py-20 text-center">
                    <ShoppingCart className="mx-auto mb-6 h-20 w-20 text-muted-foreground/40" />
                    <h1 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">Category Not Found</h1>
                    <p className="mb-6 text-muted-foreground">The category you're looking for doesn't exist.</p>
                    <Link href="/shop" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-white hover:bg-primary/90">
                        ← Back to Shop
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title={category.name} description={category.description} site={safeSite} theme={safeTheme} menus={safeMenus}>
            <SEOHead title={`${category.name} | Shop | ${safeSite.name}`} description={category.description} />

            <div className="space-y-8">
                {/* Breadcrumb */}
                <nav>
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
                        <li>
                            <ChevronRight className="h-4 w-4" />
                        </li>
                        <li className="font-medium text-foreground">{category.name}</li>
                    </ol>
                </nav>

                {/* Category Header */}
                <header className="space-y-2 border-b pb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{category.name}</h1>
                    {category.description && <p className="max-w-2xl text-muted-foreground">{category.description}</p>}
                    {pagination && <p className="text-sm text-muted-foreground tabular-nums">{pagination.total} products in this category</p>}
                </header>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-xs">
                    <div className="flex items-center gap-4">
                        <Link href="/shop" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                            ← All Products
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            defaultValue="date"
                            onChange={(e) => {
                                window.location.href = `/product-category/${category.slug}?orderby=${e.target.value}`;
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

                {/* Products */}
                {list.length === 0 ? (
                    <div className="rounded-xl border bg-card py-20 text-center">
                        <ShoppingCart className="mx-auto mb-6 h-20 w-20 text-muted-foreground/40" />
                        <h3 className="mb-2 text-xl font-semibold text-foreground">No products in this category</h3>
                        <p className="mb-6 text-muted-foreground">Check back later or browse other categories</p>
                        <Link href="/shop" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-white hover:bg-primary/90">
                            View all products
                        </Link>
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
                                            <Link href={href} className="block h-full w-full">
                                                <img
                                                    src={p.featured_image}
                                                    alt={p.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            </Link>
                                        ) : (
                                            <Link href={href} className="flex h-full w-full items-center justify-center text-muted-foreground/60">
                                                <ShoppingCart className="h-16 w-16" />
                                            </Link>
                                        )}
                                        {discount && (
                                            <span className="absolute top-3 right-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                                                -{discount}%
                                            </span>
                                        )}
                                        {p.in_stock === false && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                <span className="rounded-lg bg-card px-4 py-2 text-sm font-medium text-foreground">Out of Stock</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5">
                                        <h2 className="mb-3 line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary">
                                            <Link href={href}>{p.title}</Link>
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
                                            className="w-full rounded-md bg-primary py-2.5 font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
                            const href = p.url || `/shop/${p.slug}`;
                            const discount = getDiscountPercent(p.price, p.sale_price);
                            const displayPrice = p.sale_price && p.sale_price < (p.price || 0) ? p.sale_price : p.price;

                            return (
                                <article
                                    key={p.id}
                                    className="flex gap-6 overflow-hidden rounded-xl border bg-card p-5 shadow-xs transition-all hover:shadow-lg"
                                >
                                    <div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-xl bg-muted/50">
                                        {p.featured_image ? (
                                            <Link href={href} className="block h-full w-full">
                                                <img src={p.featured_image} alt={p.title} className="h-full w-full object-cover" />
                                            </Link>
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
                                    <div className="flex flex-1 flex-col justify-between py-2">
                                        <div>
                                            <h2 className="mb-2 text-xl font-semibold text-foreground">
                                                <Link href={href} className="transition-colors hover:text-primary">
                                                    {p.title}
                                                </Link>
                                            </h2>
                                            {p.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>}
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {p.sale_price && p.sale_price < (p.price || 0) && (
                                                    <span className="text-muted-foreground/80 line-through">{formatPrice(p.price, p.currency)}</span>
                                                )}
                                                <span
                                                    className={`text-2xl font-semibold tracking-tight ${p.sale_price && p.sale_price < (p.price || 0) ? 'text-destructive' : 'text-foreground'}`}
                                                >
                                                    {formatPrice(displayPrice, p.currency)}
                                                </span>
                                            </div>
                                            <button
                                                className="rounded-md bg-primary px-6 py-2.5 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
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
                    <div className="mt-12 flex items-center justify-center gap-2">
                        {pagination.current_page > 1 && (
                            <Link
                                href={`/product-category/${category.slug}?page=${pagination.current_page - 1}`}
                                className="rounded-md border bg-card px-5 py-2.5 font-medium transition-colors hover:bg-accent"
                            >
                                ← Previous
                            </Link>
                        )}
                        <span className="px-4 py-2 text-muted-foreground">
                            Page {pagination.current_page} of {pagination.last_page}
                        </span>
                        {pagination.current_page < pagination.last_page && (
                            <Link
                                href={`/product-category/${category.slug}?page=${pagination.current_page + 1}`}
                                className="rounded-md border bg-card px-5 py-2.5 font-medium transition-colors hover:bg-accent"
                            >
                                Next →
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
