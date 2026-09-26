import { Link } from '@inertiajs/react';
import { ArrowRight, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import Layout from '../Layout';
import { configureMoney, formatMoney, type MoneyFormat, shopRequest, type ShopTotals, TotalsRows } from './totals';

interface CartItem {
    key?: string;
    product_id: number;
    variant_id?: string | null;
    variant_name?: string | null;
    product_name: string;
    product_slug: string;
    product_image?: string;
    product_url: string;
    sku?: string;
    price: number;
    original_price: number;
    quantity: number;
    subtotal: number;
    stock?: number | null;
    in_stock: boolean;
}

interface CartProps {
    money?: MoneyFormat;
    cart?: {
        items: CartItem[];
        item_count: number;
        subtotal: number;
        currency: string;
        is_empty: boolean;
    };
    totals?: ShopTotals;
    site?: any;
    theme?: any;
    menus?: any;
}

export default function Cart({ cart, totals, site, theme, menus, money }: CartProps) {
    configureMoney(money);
    const safeSite = site && typeof site === 'object' ? site : { name: 'Shop' };
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeMenus = menus && typeof menus === 'object' ? menus : {};

    const [items, setItems] = useState<CartItem[]>(cart?.items ?? []);
    const [loading, setLoading] = useState<string | null>(null);
    const [cartTotals, setCartTotals] = useState<ShopTotals | undefined>(totals);
    const [couponCode, setCouponCode] = useState('');
    const [couponMessage, setCouponMessage] = useState<string | null>(totals?.coupon_error ?? null);
    const [couponBusy, setCouponBusy] = useState(false);

    const formatPrice = formatMoney;

    const applyCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (couponCode.trim() === '') return;
        setCouponBusy(true);
        try {
            const { data } = await shopRequest<{ success: boolean; message?: string; totals?: ShopTotals }>('/shop/cart/coupon', 'POST', {
                code: couponCode,
            });
            if (data.totals) setCartTotals(data.totals);
            setCouponMessage(data.success ? null : (data.message ?? 'That coupon code is not valid.'));
            if (data.success) setCouponCode('');
        } catch {
            setCouponMessage('Could not apply the coupon. Please try again.');
        }
        setCouponBusy(false);
    };

    const removeCoupon = async () => {
        setCouponBusy(true);
        try {
            const { data } = await shopRequest<{ totals?: ShopTotals }>('/shop/cart/coupon', 'DELETE');
            if (data.totals) setCartTotals(data.totals);
            setCouponMessage(null);
        } catch {
            setCouponMessage('Could not remove the coupon. Please try again.');
        }
        setCouponBusy(false);
    };

    const lineKey = (item: CartItem) => item.key ?? String(item.product_id);

    const updateQuantity = async (item: CartItem, newQuantity: number) => {
        const productId = item.product_id;
        setLoading(lineKey(item));
        try {
            const response = await fetch('/shop/cart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ product_id: productId, variant_id: item.variant_id ?? null, quantity: newQuantity }),
            });
            const data = await response.json();
            if (data.success) {
                setItems(data.cart.items);
                setCartTotals(data.totals ?? cartTotals);
            }
        } catch (error) {
            console.error('Failed to update cart', error);
        }
        setLoading(null);
    };

    const removeItem = async (item: CartItem) => {
        const productId = item.product_id;
        setLoading(lineKey(item));
        try {
            const response = await fetch('/shop/cart/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ product_id: productId, variant_id: item.variant_id ?? null }),
            });
            const data = await response.json();
            if (data.success) {
                setItems(data.cart.items);
                setCartTotals(data.totals ?? cartTotals);
            }
        } catch (error) {
            console.error('Failed to remove item', error);
        }
        setLoading(null);
    };

    const isEmpty = items.length === 0;

    return (
        <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title="Shopping Cart" noindex>
            <div>
                <div>
                    {/* Breadcrumb */}
                    <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/" className="hover:text-primary">
                            Home
                        </Link>
                        <span>/</span>
                        <Link href="/shop" className="hover:text-primary">
                            Shop
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">Cart</span>
                    </nav>

                    <h1 className="mb-8 flex items-center gap-3 text-3xl font-semibold tracking-tight text-foreground">
                        <ShoppingCart className="h-8 w-8" />
                        Shopping Cart
                    </h1>

                    {isEmpty ? (
                        <div className="rounded-xl border bg-card p-12 text-center shadow-xs">
                            <ShoppingBag className="mx-auto mb-6 h-20 w-20 text-muted-foreground/40" />
                            <h2 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">Your cart is empty</h2>
                            <p className="mb-8 text-muted-foreground">Looks like you haven't added any products yet.</p>
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-white transition-colors hover:bg-primary/90"
                            >
                                <ShoppingBag className="h-5 w-5" />
                                Continue Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-8 lg:grid-cols-3">
                            {/* Cart Items */}
                            <div className="space-y-4 lg:col-span-2">
                                {items.map((item) => (
                                    <div
                                        key={lineKey(item)}
                                        className={`flex gap-6 rounded-xl border bg-card p-6 shadow-xs ${loading === lineKey(item) ? 'opacity-50' : ''}`}
                                    >
                                        {/* Product Image */}
                                        <Link href={item.product_url} className="shrink-0">
                                            {item.product_image ? (
                                                <img src={item.product_image} alt={item.product_name} className="h-24 w-24 rounded-lg object-cover" />
                                            ) : (
                                                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-muted">
                                                    <ShoppingBag className="h-8 w-8 text-muted-foreground/60" />
                                                </div>
                                            )}
                                        </Link>

                                        {/* Product Details */}
                                        <div className="min-w-0 flex-1">
                                            <Link href={item.product_url}>
                                                <h3 className="font-semibold text-foreground transition-colors hover:text-primary">
                                                    {item.product_name}
                                                </h3>
                                            </Link>
                                            {item.variant_name && <p className="mt-1 text-sm text-foreground/80">{item.variant_name}</p>}
                                            {item.sku && <p className="mt-1 text-sm text-muted-foreground">SKU: {item.sku}</p>}
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-lg font-semibold tracking-tight text-foreground">
                                                    {formatPrice(item.price, cartTotals?.currency)}
                                                </span>
                                                {item.original_price > item.price && (
                                                    <span className="text-sm text-muted-foreground/80 line-through">
                                                        {formatPrice(item.original_price, cartTotals?.currency)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex flex-col items-end gap-4">
                                            <div className="flex items-center rounded-lg border">
                                                <button
                                                    onClick={() => updateQuantity(item, item.quantity - 1)}
                                                    disabled={loading === lineKey(item) || item.quantity <= 1}
                                                    className="p-2 hover:bg-accent disabled:opacity-50"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item, item.quantity + 1)}
                                                    disabled={loading === lineKey(item) || (item.stock != null && item.quantity >= item.stock)}
                                                    className="p-2 hover:bg-accent disabled:opacity-50"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-lg font-semibold tracking-tight text-foreground">
                                                    {formatPrice(item.subtotal, cartTotals?.currency)}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => removeItem(item)}
                                                disabled={loading === lineKey(item)}
                                                className="p-2 text-destructive hover:text-destructive/80"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-xs">
                                    <h2 className="mb-6 text-lg font-semibold tracking-tight text-foreground">Order Summary</h2>

                                    <div className="space-y-4">
                                        <TotalsRows totals={cartTotals} />

                                        <div className="border-t pt-4">
                                            <div className="flex justify-between text-xl font-semibold tracking-tight text-foreground">
                                                <span>Total</span>
                                                <span>{formatPrice(cartTotals?.total ?? 0, cartTotals?.currency)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coupon */}
                                    <div className="mt-6 border-t pt-4">
                                        {cartTotals?.coupon ? (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-foreground">
                                                    Coupon <span className="font-mono font-medium">{cartTotals.coupon.code}</span> applied
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={removeCoupon}
                                                    disabled={couponBusy}
                                                    className="text-muted-foreground underline hover:text-foreground"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={applyCoupon} className="flex gap-2">
                                                <label htmlFor="coupon-code" className="sr-only">
                                                    Coupon code
                                                </label>
                                                <input
                                                    id="coupon-code"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value)}
                                                    placeholder="Coupon code"
                                                    className="h-10 min-w-0 flex-1 rounded-md border border-input bg-input-bg px-3 text-sm text-foreground uppercase shadow-xs outline-none placeholder:text-muted-foreground placeholder:normal-case focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={couponBusy || couponCode.trim() === ''}
                                                    className="rounded-md border px-4 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent disabled:opacity-50"
                                                >
                                                    Apply
                                                </button>
                                            </form>
                                        )}
                                        {couponMessage && (
                                            <p role="alert" className="mt-2 text-sm text-destructive">
                                                {couponMessage}
                                            </p>
                                        )}
                                    </div>

                                    <Link
                                        href="/shop/checkout"
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-4 font-semibold text-white transition-colors hover:bg-primary/90"
                                    >
                                        Proceed to Checkout
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>

                                    <Link
                                        href="/shop"
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border px-6 py-3 font-medium text-foreground/80 transition-colors hover:bg-accent"
                                    >
                                        Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
