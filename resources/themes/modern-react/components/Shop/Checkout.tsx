import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { ChevronRight, CreditCard, Loader2, MapPin, ShoppingBag, Truck } from 'lucide-react';
import React, { useState } from 'react';
import Layout from '../Layout';

interface CartItem {
    product_id: number;
    product_name: string;
    product_image?: string;
    price: number;
    quantity: number;
    subtotal: number;
}

interface CheckoutProps {
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
    user?: {
        name: string;
        email: string;
    } | null;
    countries?: Record<string, string>;
    site?: any;
    theme?: any;
    menus?: any;
}

export default function Checkout({ cart, totals, user, countries, site, theme, menus }: CheckoutProps) {
    const safeSite = site && typeof site === 'object' ? site : { name: 'Shop' };
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeMenus = menus && typeof menus === 'object' ? menus : {};
    const countryList = countries ?? { US: 'United States' };

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [shipToDifferent, setShipToDifferent] = useState(false);

    const [form, setForm] = useState({
        customer_name: user?.name ?? '',
        customer_email: user?.email ?? '',
        customer_phone: '',
        billing_address_1: '',
        billing_address_2: '',
        billing_city: '',
        billing_state: '',
        billing_postcode: '',
        billing_country: 'US',
        ship_to_different: false,
        shipping_address_1: '',
        shipping_address_2: '',
        shipping_city: '',
        shipping_state: '',
        shipping_postcode: '',
        shipping_country: 'US',
        customer_note: '',
        payment_method: 'cod',
    });

    const formatPrice = (price: number, currency = 'USD') => {
        const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
        return `${symbols[currency] || '$'}${price.toFixed(2)}`;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (name === 'ship_to_different') {
            setShipToDifferent(checked);
            setForm({ ...form, ship_to_different: checked });
        } else {
            setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const response = await fetch('/shop/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = data.redirect;
            } else if (data.errors) {
                setErrors(data.errors);
            } else {
                setErrors({ general: data.error || 'Failed to process order' });
            }
        } catch (error) {
            setErrors({ general: 'An error occurred. Please try again.' });
        }

        setSubmitting(false);
    };

    if (cart?.is_empty) {
        return (
            <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title="Checkout">
                <div className="min-h-screen bg-gray-50 py-12">
                    <div className="mx-auto max-w-2xl px-4 text-center">
                        <ShoppingBag className="mx-auto mb-6 h-20 w-20 text-gray-200" />
                        <h1 className="mb-4 text-2xl font-bold text-gray-900">Your cart is empty</h1>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title="Checkout">
            <SEOHead title="Checkout" description="Complete your order" />

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
                        <Link href="/shop/cart" className="hover:text-indigo-600">
                            Cart
                        </Link>
                        <span>/</span>
                        <span className="text-gray-900">Checkout</span>
                    </nav>

                    <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

                    {errors.general && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">{errors.general}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-8 lg:grid-cols-3">
                            {/* Checkout Form */}
                            <div className="space-y-8 lg:col-span-2">
                                {/* Contact Information */}
                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
                                        <MapPin className="h-5 w-5 text-indigo-600" />
                                        Contact Information
                                    </h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                                            <input
                                                type="text"
                                                name="customer_name"
                                                value={form.customer_name}
                                                onChange={handleChange}
                                                required
                                                className={`w-full rounded-lg border px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${errors.customer_name ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                            {errors.customer_name && <p className="mt-1 text-sm text-red-500">{errors.customer_name}</p>}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
                                            <input
                                                type="email"
                                                name="customer_email"
                                                value={form.customer_email}
                                                onChange={handleChange}
                                                required
                                                className={`w-full rounded-lg border px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${errors.customer_email ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                            {errors.customer_email && <p className="mt-1 text-sm text-red-500">{errors.customer_email}</p>}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                                            <input
                                                type="tel"
                                                name="customer_phone"
                                                value={form.customer_phone}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Billing Address */}
                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
                                        <MapPin className="h-5 w-5 text-indigo-600" />
                                        Billing Address
                                    </h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-sm font-medium text-gray-700">Address *</label>
                                            <input
                                                type="text"
                                                name="billing_address_1"
                                                value={form.billing_address_1}
                                                onChange={handleChange}
                                                required
                                                placeholder="Street address"
                                                className={`w-full rounded-lg border px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${errors.billing_address_1 ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <input
                                                type="text"
                                                name="billing_address_2"
                                                value={form.billing_address_2}
                                                onChange={handleChange}
                                                placeholder="Apartment, suite, etc. (optional)"
                                                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">City *</label>
                                            <input
                                                type="text"
                                                name="billing_city"
                                                value={form.billing_city}
                                                onChange={handleChange}
                                                required
                                                className={`w-full rounded-lg border px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${errors.billing_city ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">State/Province</label>
                                            <input
                                                type="text"
                                                name="billing_state"
                                                value={form.billing_state}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">Postal Code *</label>
                                            <input
                                                type="text"
                                                name="billing_postcode"
                                                value={form.billing_postcode}
                                                onChange={handleChange}
                                                required
                                                className={`w-full rounded-lg border px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 ${errors.billing_postcode ? 'border-red-500' : 'border-gray-200'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-700">Country *</label>
                                            <select
                                                name="billing_country"
                                                value={form.billing_country}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {Object.entries(countryList).map(([code, name]) => (
                                                    <option key={code} value={code}>
                                                        {name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <label className="flex cursor-pointer items-center gap-3">
                                            <input
                                                type="checkbox"
                                                name="ship_to_different"
                                                checked={shipToDifferent}
                                                onChange={handleChange}
                                                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-gray-700">Ship to a different address?</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Shipping Address (conditional) */}
                                {shipToDifferent && (
                                    <div className="rounded-xl bg-white p-6 shadow-sm">
                                        <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
                                            <Truck className="h-5 w-5 text-indigo-600" />
                                            Shipping Address
                                        </h2>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Address *</label>
                                                <input
                                                    type="text"
                                                    name="shipping_address_1"
                                                    value={form.shipping_address_1}
                                                    onChange={handleChange}
                                                    required={shipToDifferent}
                                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <input
                                                    type="text"
                                                    name="shipping_address_2"
                                                    value={form.shipping_address_2}
                                                    onChange={handleChange}
                                                    placeholder="Apartment, suite, etc. (optional)"
                                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">City *</label>
                                                <input
                                                    type="text"
                                                    name="shipping_city"
                                                    value={form.shipping_city}
                                                    onChange={handleChange}
                                                    required={shipToDifferent}
                                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">State/Province</label>
                                                <input
                                                    type="text"
                                                    name="shipping_state"
                                                    value={form.shipping_state}
                                                    onChange={handleChange}
                                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Postal Code *</label>
                                                <input
                                                    type="text"
                                                    name="shipping_postcode"
                                                    value={form.shipping_postcode}
                                                    onChange={handleChange}
                                                    required={shipToDifferent}
                                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Country *</label>
                                                <select
                                                    name="shipping_country"
                                                    value={form.shipping_country}
                                                    onChange={handleChange}
                                                    required={shipToDifferent}
                                                    className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    {Object.entries(countryList).map(([code, name]) => (
                                                        <option key={code} value={code}>
                                                            {name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payment Method */}
                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900">
                                        <CreditCard className="h-5 w-5 text-indigo-600" />
                                        Payment Method
                                    </h2>
                                    <div className="space-y-3">
                                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value="cod"
                                                checked={form.payment_method === 'cod'}
                                                onChange={handleChange}
                                                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-900">Cash on Delivery</span>
                                                <p className="text-sm text-gray-500">Pay when you receive your order</p>
                                            </div>
                                        </label>
                                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value="bank_transfer"
                                                checked={form.payment_method === 'bank_transfer'}
                                                onChange={handleChange}
                                                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <div>
                                                <span className="font-medium text-gray-900">Bank Transfer</span>
                                                <p className="text-sm text-gray-500">Make payment directly to our bank account</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Order Notes */}
                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <h2 className="mb-4 text-lg font-bold text-gray-900">Order Notes (optional)</h2>
                                    <textarea
                                        name="customer_note"
                                        value={form.customer_note}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Notes about your order, e.g. special delivery instructions"
                                        className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-24 rounded-xl bg-white p-6 shadow-sm">
                                    <h2 className="mb-6 text-lg font-bold text-gray-900">Your Order</h2>

                                    <div className="mb-6 space-y-4">
                                        {cart?.items.map((item) => (
                                            <div key={item.product_id} className="flex gap-4">
                                                {item.product_image ? (
                                                    <img
                                                        src={item.product_image}
                                                        alt={item.product_name}
                                                        className="h-16 w-16 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                                                        <ShoppingBag className="h-6 w-6 text-gray-300" />
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-gray-900">{item.product_name}</p>
                                                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-medium text-gray-900">{formatPrice(item.subtotal, totals?.currency)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3 border-t pt-4">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>{formatPrice(totals?.subtotal ?? 0, totals?.currency)}</span>
                                        </div>
                                        {(totals?.discount ?? 0) > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Discount</span>
                                                <span>-{formatPrice(totals?.discount ?? 0, totals?.currency)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-gray-600">
                                            <span>Shipping</span>
                                            <span>{totals?.shipping ? formatPrice(totals.shipping, totals.currency) : 'Free'}</span>
                                        </div>
                                        {(totals?.tax ?? 0) > 0 && (
                                            <div className="flex justify-between text-gray-600">
                                                <span>Tax</span>
                                                <span>{formatPrice(totals?.tax ?? 0, totals?.currency)}</span>
                                            </div>
                                        )}
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between text-xl font-bold text-gray-900">
                                                <span>Total</span>
                                                <span>{formatPrice(totals?.total ?? 0, totals?.currency)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Place Order
                                                <ChevronRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>

                                    <p className="mt-4 text-center text-xs text-gray-500">
                                        By placing your order, you agree to our Terms of Service and Privacy Policy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
