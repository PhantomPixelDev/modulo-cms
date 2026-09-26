import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { ChevronRight, CreditCard, Loader2, MapPin, ShoppingBag, Truck } from 'lucide-react';
import React, { useState } from 'react';
import Layout from '../Layout';
import { formatMoney, shopRequest, TotalsRows, type ShopTotals } from './totals';

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
    totals?: ShopTotals;
    user?: {
        name: string;
        email: string;
    } | null;
    countries?: Record<string, string>;
    payment_methods?: { id: string; label: string; description: string; online: boolean }[];
    /** A returning customer's details from their last order */
    saved_address?: Record<string, string | boolean | null> | null;
    terms_url?: string | null;
    site?: any;
    theme?: any;
    menus?: any;
}

export default function Checkout({ cart, totals, user, countries, payment_methods, saved_address, terms_url, site, theme, menus }: CheckoutProps) {
    const safeSite = site && typeof site === 'object' ? site : { name: 'Shop' };
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeMenus = menus && typeof menus === 'object' ? menus : {};
    const countryList = countries ?? { US: 'United States' };

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const saved = saved_address ?? {};
    const pick = (key: string, fallback = '') => (typeof saved[key] === 'string' ? (saved[key] as string) : fallback);
    const [shipToDifferent, setShipToDifferent] = useState(saved.ship_to_different === true);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const methods = payment_methods ?? [];
    const [liveTotals, setLiveTotals] = useState<ShopTotals | undefined>(totals);
    const [shippingBusy, setShippingBusy] = useState(false);
    const shippingMethods = liveTotals?.shipping_methods ?? [];

    const chooseShipping = async (methodId: string) => {
        setShippingBusy(true);
        try {
            const { data } = await shopRequest<{ totals?: ShopTotals }>('/shop/cart/shipping', 'POST', { shipping_method: methodId });
            if (data.totals) setLiveTotals(data.totals);
        } catch {
            setErrors({ general: 'Could not update shipping. Please try again.' });
        }
        setShippingBusy(false);
    };

    const [form, setForm] = useState({
        customer_name: user?.name ?? '',
        customer_email: user?.email ?? '',
        customer_phone: pick('customer_phone'),
        billing_address_1: pick('billing_address_1'),
        billing_address_2: pick('billing_address_2'),
        billing_city: pick('billing_city'),
        billing_state: pick('billing_state'),
        billing_postcode: pick('billing_postcode'),
        billing_country: pick('billing_country', 'US'),
        ship_to_different: saved.ship_to_different === true,
        shipping_address_1: pick('shipping_address_1'),
        shipping_address_2: pick('shipping_address_2'),
        shipping_city: pick('shipping_city'),
        shipping_state: pick('shipping_state'),
        shipping_postcode: pick('shipping_postcode'),
        shipping_country: pick('shipping_country', 'US'),
        customer_note: '',
        payment_method: payment_methods?.[0]?.id ?? '',
    });

    const formatPrice = formatMoney;

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
                body: JSON.stringify({ ...form, shipping_method: liveTotals?.shipping_method ?? null, accept_terms: acceptTerms }),
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = data.redirect;
            } else if (data.errors) {
                // Laravel sends each field's messages as an array; stock and cart
                // problems arrive under "cart", which has no field of its own.
                const flat: Record<string, string> = {};
                for (const [key, value] of Object.entries(data.errors as Record<string, string | string[]>)) {
                    flat[key] = Array.isArray(value) ? value[0] : value;
                }
                if (flat.cart && !flat.general) {
                    flat.general = flat.cart;
                }
                if (flat.coupon && !flat.general) {
                    flat.general = flat.coupon;
                }
                setErrors(flat);
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
                <div>
                    <div className="mx-auto max-w-2xl py-12 text-center">
                        <ShoppingBag className="mx-auto mb-6 h-20 w-20 text-muted-foreground/40" />
                        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">Your cart is empty</h1>
                        <Link href="/shop" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-white hover:bg-primary/90">
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
                        <Link href="/shop/cart" className="hover:text-primary">
                            Cart
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">Checkout</span>
                    </nav>

                    <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">Checkout</h1>

                    {errors.general && (
                        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">{errors.general}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-8 lg:grid-cols-3">
                            {/* Checkout Form */}
                            <div className="space-y-8 lg:col-span-2">
                                {/* Contact Information */}
                                <div className="rounded-xl border bg-card p-6 shadow-xs">
                                    <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        Contact Information
                                    </h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-sm font-medium text-foreground/80">Full Name *</label>
                                            <input
                                                type="text"
                                                name="customer_name"
                                                value={form.customer_name}
                                                onChange={handleChange}
                                                required
                                                className={`h-10 w-full rounded-md border bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 ${errors.customer_name ? 'border-destructive' : 'border-input'}`}
                                            />
                                            {errors.customer_name && <p className="mt-1 text-sm text-destructive">{errors.customer_name}</p>}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-foreground/80">Email *</label>
                                            <input
                                                type="email"
                                                name="customer_email"
                                                value={form.customer_email}
                                                onChange={handleChange}
                                                required
                                                className={`h-10 w-full rounded-md border bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 ${errors.customer_email ? 'border-destructive' : 'border-input'}`}
                                            />
                                            {errors.customer_email && <p className="mt-1 text-sm text-destructive">{errors.customer_email}</p>}
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-foreground/80">Phone</label>
                                            <input
                                                type="tel"
                                                name="customer_phone"
                                                value={form.customer_phone}
                                                onChange={handleChange}
                                                className="h-10 w-full rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Billing Address */}
                                <div className="rounded-xl border bg-card p-6 shadow-xs">
                                    <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        Billing Address
                                    </h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <label className="mb-1 block text-sm font-medium text-foreground/80">Address *</label>
                                            <input
                                                type="text"
                                                name="billing_address_1"
                                                value={form.billing_address_1}
                                                onChange={handleChange}
                                                required
                                                placeholder="Street address"
                                                className={`h-10 w-full rounded-md border bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 ${errors.billing_address_1 ? 'border-destructive' : 'border-input'}`}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <input
                                                type="text"
                                                name="billing_address_2"
                                                value={form.billing_address_2}
                                                onChange={handleChange}
                                                placeholder="Apartment, suite, etc. (optional)"
                                                className="h-10 w-full rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-foreground/80">City *</label>
                                            <input
                                                type="text"
                                                name="billing_city"
                                                value={form.billing_city}
                                                onChange={handleChange}
                                                required
                                                className={`h-10 w-full rounded-md border bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 ${errors.billing_city ? 'border-destructive' : 'border-input'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-foreground/80">State/Province</label>
                                            <input
                                                type="text"
                                                name="billing_state"
                                                value={form.billing_state}
                                                onChange={handleChange}
                                                className="h-10 w-full rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-foreground/80">Postal Code *</label>
                                            <input
                                                type="text"
                                                name="billing_postcode"
                                                value={form.billing_postcode}
                                                onChange={handleChange}
                                                required
                                                className={`h-10 w-full rounded-md border bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 ${errors.billing_postcode ? 'border-destructive' : 'border-input'}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-foreground/80">Country *</label>
                                            <select
                                                name="billing_country"
                                                value={form.billing_country}
                                                onChange={handleChange}
                                                required
                                                className="h-10 w-full rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
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
                                                className="size-4 rounded accent-primary"
                                            />
                                            <span className="text-foreground/80">Ship to a different address?</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Shipping Address (conditional) */}
                                {shipToDifferent && (
                                    <div className="rounded-xl border bg-card p-6 shadow-xs">
                                        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                            <Truck className="h-5 w-5 text-primary" />
                                            Shipping Address
                                        </h2>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label className="mb-1 block text-sm font-medium text-foreground/80">Address *</label>
                                                <input
                                                    type="text"
                                                    name="shipping_address_1"
                                                    value={form.shipping_address_1}
                                                    onChange={handleChange}
                                                    required={shipToDifferent}
                                                    className="h-10 w-full rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <input
                                                    type="text"
                                                    name="shipping_address_2"
                                                    value={form.shipping_address_2}
                                                    onChange={handleChange}
                                                    placeholder="Apartment, suite, etc. (optional)"
                                                    className="h-10 w-full rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-foreground/80">City *</label>
                                                <input
                                                    type="text"
                                                    name="shipping_city"
                                                    value={form.shipping_city}
                                                    onChange={handleChange}
                                                    required={shipToDifferent}
                                                    className="h-10 w-full rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-foreground/80">State/Province</label>
                                                <input
                                                    type="text"
                                                    name="shipping_state"
                                                    value={form.shipping_state}
                                                    onChange={handleChange}
                                                    className="h-10 w-full rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-foreground/80">Postal Code *</label>
                                                <input
                                                    type="text"
                                                    name="shipping_postcode"
                                                    value={form.shipping_postcode}
                                                    onChange={handleChange}
                                                    required={shipToDifferent}
                                                    className="h-10 w-full rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-foreground/80">Country *</label>
                                                <select
                                                    name="shipping_country"
                                                    value={form.shipping_country}
                                                    onChange={handleChange}
                                                    required={shipToDifferent}
                                                    className="h-10 w-full rounded-md border border-input bg-input-bg px-3 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
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

                                {/* Shipping Method */}
                                {shippingMethods.length > 0 && (
                                    <div className="rounded-xl border bg-card p-6 shadow-xs">
                                        <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                            <Truck className="h-5 w-5 text-primary" />
                                            Shipping Method
                                        </h2>
                                        <div className="space-y-3">
                                            {shippingMethods.map((method) => (
                                                <label
                                                    key={method.id}
                                                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="shipping_method"
                                                        value={method.id}
                                                        checked={liveTotals?.shipping_method === method.id}
                                                        onChange={() => chooseShipping(method.id)}
                                                        disabled={shippingBusy}
                                                        className="size-4 accent-primary"
                                                    />
                                                    <div className="flex flex-1 items-center justify-between gap-4">
                                                        <div>
                                                            <span className="font-medium text-foreground">{method.name}</span>
                                                            {method.free_over !== null && method.cost > 0 && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    Free over {formatPrice(method.free_over, liveTotals?.currency)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="font-medium text-foreground">
                                                            {method.cost === 0 ? 'Free' : formatPrice(method.cost, liveTotals?.currency)}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Payment Method */}
                                <div className="rounded-xl border bg-card p-6 shadow-xs">
                                    <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                        Payment Method
                                    </h2>
                                    <div className="space-y-3">
                                        {methods.length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                No payment methods are available right now. Please contact us.
                                            </p>
                                        )}
                                        {methods.map((method) => (
                                            <label
                                                key={method.id}
                                                className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
                                            >
                                                <input
                                                    type="radio"
                                                    name="payment_method"
                                                    value={method.id}
                                                    checked={form.payment_method === method.id}
                                                    onChange={handleChange}
                                                    className="size-4 accent-primary"
                                                />
                                                <div>
                                                    <span className="font-medium text-foreground">{method.label}</span>
                                                    {method.description && <p className="text-sm text-muted-foreground">{method.description}</p>}
                                                </div>
                                            </label>
                                        ))}
                                        {errors.payment_method && <p className="text-sm text-destructive">{errors.payment_method}</p>}
                                    </div>
                                </div>

                                {/* Order Notes */}
                                <div className="rounded-xl border bg-card p-6 shadow-xs">
                                    <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Order Notes (optional)</h2>
                                    <textarea
                                        name="customer_note"
                                        value={form.customer_note}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Notes about your order, e.g. special delivery instructions"
                                        className="min-h-24 w-full rounded-md border border-input bg-input-bg px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                                    />
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-24 rounded-xl border bg-card p-6 shadow-xs">
                                    <h2 className="mb-6 text-lg font-semibold tracking-tight text-foreground">Your Order</h2>

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
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                                                        <ShoppingBag className="h-6 w-6 text-muted-foreground/60" />
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium text-foreground">{item.product_name}</p>
                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="font-medium text-foreground">{formatPrice(item.subtotal, liveTotals?.currency)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3 border-t pt-4">
                                        <TotalsRows totals={liveTotals} />
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between text-xl font-semibold tracking-tight text-foreground">
                                                <span>Total</span>
                                                <span>{formatPrice(liveTotals?.total ?? 0, liveTotals?.currency)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || methods.length === 0}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-4 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {methods.find((m) => m.id === form.payment_method)?.online ? 'Continue to payment' : 'Place Order'}
                                                <ChevronRight className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>

                                    {terms_url ? (
                                        <div className="mt-4">
                                            <label className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <input
                                                    type="checkbox"
                                                    checked={acceptTerms}
                                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                                    className="mt-0.5 size-4 accent-primary"
                                                />
                                                <span>
                                                    I have read and accept the{' '}
                                                    <a href={terms_url} target="_blank" rel="noopener" className="underline hover:text-foreground">
                                                        terms and conditions
                                                    </a>
                                                    .
                                                </span>
                                            </label>
                                            {errors.accept_terms && <p className="mt-1 text-sm text-destructive">{errors.accept_terms}</p>}
                                        </div>
                                    ) : (
                                        <p className="mt-4 text-center text-xs text-muted-foreground">
                                            By placing your order, you agree to our Terms of Service and Privacy Policy.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
