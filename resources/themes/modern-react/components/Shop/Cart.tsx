import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { ArrowRight, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Layout from '../Layout';

interface CartItem {
    product_id: number;
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
    cart?: {
        items: CartItem[];
        item_count: number;
        subtotal: number;
        currency: string;
        is_empty: boolean;
    };
    totals?: {
        subtotal: number;
        discount: number;
        shipping: number;
        tax: number;
        total: number;
        currency: string;
    };
    site?: any;
    theme?: any;
    menus?: any;
}

export default function Cart({ cart, totals, site, theme, menus }: CartProps) {
    const safeSite = site && typeof site === 'object' ? site : { name: 'Shop' };
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeMenus = menus && typeof menus === 'object' ? menus : {};

    const [items, setItems] = useState<CartItem[]>(cart?.items ?? []);
    const [loading, setLoading] = useState<number | null>(null);
    const [cartTotals, setCartTotals] = useState(totals);

    const formatPrice = (price: number, currency = 'USD') => {
        const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
        return `${symbols[currency] || '$'}${price.toFixed(2)}`;
    };

    const updateQuantity = async (productId: number, newQuantity: number) => {
        setLoading(productId);
        try {
            const response = await fetch('/shop/cart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ product_id: productId, quantity: newQuantity }),
            });
            const data = await response.json();
            if (data.success) {
                setItems(data.cart.items);
                setCartTotals({
                    ...cartTotals!,
                    subtotal: data.cart.subtotal,
                    total: data.cart.subtotal,
                });
            }
        } catch (error) {
            console.error('Failed to update cart', error);
        }
        setLoading(null);
    };

    const removeItem = async (productId: number) => {
        setLoading(productId);
        try {
            const response = await fetch('/shop/cart/remove', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ product_id: productId }),
            });
            const data = await response.json();
            if (data.success) {
                setItems(data.cart.items);
                setCartTotals({
                    ...cartTotals!,
                    subtotal: data.cart.subtotal,
                    total: data.cart.subtotal,
                });
            }
        } catch (error) {
            console.error('Failed to remove item', error);
        }
        setLoading(null);
    };

    const isEmpty = items.length === 0;

    return (
        <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title="Shopping Cart">
            <SEOHead title="Shopping Cart" description="Review your shopping cart" />

            <div className="min-h-screen bg-gray-50 py-12">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500">
                        <Link href="/" className="hover:text-indigo-600">
                            Home
                        </Link>
                        <span>/</span>
                        <Link href="/shop" className="hover:text-indigo-600">
                            Shop
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900">Cart</span>
                    </nav>

                    <h1 className="mb-8 flex items-center gap-3 text-3xl font-bold text-gray-900">
                        <ShoppingCart className="h-8 w-8" />
                        Shopping Cart
                    </h1>

                    {isEmpty ? (
                        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                            <ShoppingBag className="mx-auto mb-6 h-20 w-20 text-gray-200" />
                            <h2 className="mb-4 text-2xl font-bold text-gray-900">Your cart is empty</h2>
                            <p className="mb-8 text-gray-500">Looks like you haven't added any products yet.</p>
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700"
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
                                        key={item.product_id}
                                        className={`flex gap-6 rounded-xl bg-white p-6 shadow-sm ${loading === item.product_id ? 'opacity-50' : ''}`}
                                    >
                                        {/* Product Image */}
                                        <Link href={item.product_url} className="shrink-0">
                                            {item.product_image ? (
                                                <img src={item.product_image} alt={item.product_name} className="h-24 w-24 rounded-lg object-cover" />
                                            ) : (
                                                <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100">
                                                    <ShoppingBag className="h-8 w-8 text-gray-300" />
                                                </div>
                                            )}
                                        </Link>

                                        {/* Product Details */}
                                        <div className="min-w-0 flex-1">
                                            <Link href={item.product_url}>
                                                <h3 className="font-semibold text-gray-900 transition-colors hover:text-indigo-600">
                                                    {item.product_name}
                                                </h3>
                                            </Link>
                                            {item.sku && <p className="mt-1 text-sm text-gray-500">SKU: {item.sku}</p>}
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-lg font-bold text-gray-900">
                                                    {formatPrice(item.price, cartTotals?.currency)}
                                                </span>
                                                {item.original_price > item.price && (
                                                    <span className="text-sm text-gray-400 line-through">
                                                        {formatPrice(item.original_price, cartTotals?.currency)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex flex-col items-end gap-4">
                                            <div className="flex items-center rounded-lg border border-gray-200">
                                                <button
                                                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                                                    disabled={loading === item.product_id || item.quantity <= 1}
                                                    className="p-2 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                                                    disabled={loading === item.product_id || (item.stock != null && item.quantity >= item.stock)}
                                                    className="p-2 hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">{formatPrice(item.subtotal, cartTotals?.currency)}</p>
                                            </div>

                                            <button
                                                onClick={() => removeItem(item.product_id)}
                                                disabled={loading === item.product_id}
                                                className="p-2 text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-24 rounded-xl bg-white p-6 shadow-sm">
                                    <h2 className="mb-6 text-lg font-bold text-gray-900">Order Summary</h2>

                                    <div className="space-y-4">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>{formatPrice(cartTotals?.subtotal ?? 0, cartTotals?.currency)}</span>
                                        </div>
                                        {(cartTotals?.discount ?? 0) > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Discount</span>
                                                <span>-{formatPrice(cartTotals?.discount ?? 0, cartTotals?.currency)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-gray-600">
                                            <span>Shipping</span>
                                            <span>
                                                {cartTotals?.shipping
                                                    ? formatPrice(cartTotals.shipping, cartTotals.currency)
                                                    : 'Calculated at checkout'}
                                            </span>
                                        </div>
                                        {(cartTotals?.tax ?? 0) > 0 && (
                                            <div className="flex justify-between text-gray-600">
                                                <span>Tax</span>
                                                <span>{formatPrice(cartTotals?.tax ?? 0, cartTotals?.currency)}</span>
                                            </div>
                                        )}

                                        <div className="border-t pt-4">
                                            <div className="flex justify-between text-xl font-bold text-gray-900">
                                                <span>Total</span>
                                                <span>{formatPrice(cartTotals?.total ?? 0, cartTotals?.currency)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Link
                                        href="/shop/checkout"
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white transition-colors hover:bg-indigo-700"
                                    >
                                        Proceed to Checkout
                                        <ArrowRight className="h-5 w-5" />
                                    </Link>

                                    <Link
                                        href="/shop"
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
