import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { CheckCircle, CreditCard, Mail, MapPin, Package, ShoppingBag } from 'lucide-react';
import Layout from '../Layout';

interface OrderItem {
    id: number;
    product_id: number;
    product_name: string;
    product_sku?: string;
    price: number;
    quantity: number;
    subtotal: number;
    product_data?: {
        slug?: string;
        image?: string;
    };
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    status_label: string;
    payment_status: string;
    payment_status_label: string;
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
    customer_name: string;
    customer_email: string;
    billing_address: {
        address_1: string;
        address_2?: string;
        city: string;
        state?: string;
        postcode: string;
        country: string;
    };
    shipping_address: {
        address_1: string;
        address_2?: string;
        city: string;
        state?: string;
        postcode: string;
        country: string;
    };
    payment_method: string;
    customer_note?: string;
    items: OrderItem[];
    created_at: string;
}

interface OrderConfirmationProps {
    order?: Order;
    site?: any;
    theme?: any;
    menus?: any;
}

export default function OrderConfirmation({ order, site, theme, menus }: OrderConfirmationProps) {
    const safeSite = site && typeof site === 'object' ? site : { name: 'Shop' };
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeMenus = menus && typeof menus === 'object' ? menus : {};

    const formatPrice = (price: number, currency = 'USD') => {
        const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
        return `${symbols[currency] || '$'}${price.toFixed(2)}`;
    };

    const formatAddress = (address: Order['billing_address']) => {
        const parts = [
            address.address_1,
            address.address_2,
            `${address.city}${address.state ? `, ${address.state}` : ''} ${address.postcode}`,
            address.country,
        ].filter(Boolean);
        return parts;
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            cod: 'Cash on Delivery',
            bank_transfer: 'Bank Transfer',
            stripe: 'Credit Card',
        };
        return labels[method] || method;
    };

    if (!order) {
        return (
            <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title="Order Not Found">
                <div>
                    <div className="mx-auto max-w-2xl py-12 text-center">
                        <Package className="mx-auto mb-6 h-20 w-20 text-muted-foreground/40" />
                        <h1 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">Order not found</h1>
                        <Link href="/shop" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-white hover:bg-primary/90">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title={`Order ${order.order_number}`}>
            <SEOHead title={`Order Confirmed - ${order.order_number}`} description="Thank you for your order" />

            <div>
                <div className="mx-auto max-w-4xl">
                    {/* Success Message */}
                    <div className="mb-8 rounded-xl border bg-card p-8 text-center shadow-xs">
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                            <CheckCircle className="h-12 w-12 text-success" />
                        </div>
                        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">Thank you for your order!</h1>
                        <p className="mb-4 text-muted-foreground">Your order has been received and is being processed.</p>
                        <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                            <span className="text-muted-foreground">Order Number:</span>
                            <span className="font-bold text-foreground">{order.order_number}</span>
                        </div>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Order Details */}
                        <div className="rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                <Package className="h-5 w-5 text-primary" />
                                Order Details
                            </h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Order Number</span>
                                    <span className="font-medium text-foreground">{order.order_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date</span>
                                    <span className="font-medium text-foreground">
                                        {new Date(order.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className="inline-flex items-center rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">
                                        {order.status_label}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment</span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            order.payment_status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/20 text-warning-foreground'
                                        }`}
                                    >
                                        {order.payment_status_label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                <Mail className="h-5 w-5 text-primary" />
                                Customer Information
                            </h2>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-foreground">{order.customer_name}</p>
                                <p className="text-muted-foreground">{order.customer_email}</p>
                            </div>
                        </div>

                        {/* Billing Address */}
                        <div className="rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                <MapPin className="h-5 w-5 text-primary" />
                                Billing Address
                            </h2>
                            <div className="text-sm text-muted-foreground">
                                {formatAddress(order.billing_address).map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Payment Method
                            </h2>
                            <p className="text-sm text-muted-foreground">{getPaymentMethodLabel(order.payment_method)}</p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="mt-8 rounded-xl border bg-card p-6 shadow-xs">
                        <h2 className="mb-6 text-lg font-semibold tracking-tight text-foreground">Order Items</h2>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex gap-4 border-b border-border py-4 last:border-0">
                                    {item.product_data?.image ? (
                                        <img src={item.product_data.image} alt={item.product_name} className="h-16 w-16 rounded-lg object-cover" />
                                    ) : (
                                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                                            <ShoppingBag className="h-6 w-6 text-muted-foreground/60" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-foreground">{item.product_name}</p>
                                        {item.product_sku && <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>}
                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-foreground">{formatPrice(item.subtotal, order.currency)}</p>
                                        <p className="text-sm text-muted-foreground">{formatPrice(item.price, order.currency)} each</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="mt-6 space-y-3 border-t pt-6">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{formatPrice(order.subtotal, order.currency)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-success">
                                    <span>Discount</span>
                                    <span>-{formatPrice(order.discount, order.currency)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-muted-foreground">
                                <span>Shipping</span>
                                <span>{order.shipping > 0 ? formatPrice(order.shipping, order.currency) : 'Free'}</span>
                            </div>
                            {order.tax > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Tax</span>
                                    <span>{formatPrice(order.tax, order.currency)}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-3 text-xl font-semibold tracking-tight text-foreground">
                                <span>Total</span>
                                <span>{formatPrice(order.total, order.currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Note */}
                    {order.customer_note && (
                        <div className="mt-8 rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">Order Notes</h2>
                            <p className="text-muted-foreground">{order.customer_note}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                        <Link
                            href="/shop"
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
