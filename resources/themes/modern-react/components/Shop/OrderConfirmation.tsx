import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { CheckCircle, Clock, CreditCard, Landmark, Mail, MapPin, Package, ShoppingBag, XCircle } from 'lucide-react';
import { useState } from 'react';
import Layout from '../Layout';
import { configureMoney, formatMoney, type MoneyFormat } from './totals';

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
    shipping_method?: string | null;
    coupon_code?: string | null;
    prices_include_tax?: boolean;
    customer_note?: string;
    items: OrderItem[];
    created_at: string;
}

interface PaymentState {
    method_label: string;
    can_pay: boolean;
    pay_url: string;
    online_methods: { id: string; label: string; description: string }[];
    current_online: boolean;
    instructions: string | null;
    invoice_url?: string;
}

interface OrderConfirmationProps {
    money?: MoneyFormat;
    order?: Order;
    payment?: PaymentState;
    flash?: { success?: string | null; info?: string | null; warning?: string | null; error?: string | null };
    site?: any;
    theme?: any;
    menus?: any;
}

export default function OrderConfirmation({ order, payment, flash, site, theme, menus, money }: OrderConfirmationProps) {
    configureMoney(money);
    const safeSite = site && typeof site === 'object' ? site : { name: 'Shop' };
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeMenus = menus && typeof menus === 'object' ? menus : {};

    const formatPrice = formatMoney;
    const csrf = typeof document !== 'undefined' ? (document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '') : '';
    const [payWith, setPayWith] = useState(
        payment?.online_methods.find((m) => payment.current_online && m.id === order?.payment_method)?.id ?? payment?.online_methods[0]?.id ?? '',
    );
    const paid = order?.payment_status === 'paid';
    const cancelled = order?.status === 'cancelled' || order?.status === 'refunded';
    const flashes = [
        { tone: 'success', text: flash?.success },
        { tone: 'info', text: flash?.info },
        { tone: 'warning', text: flash?.warning },
        { tone: 'error', text: flash?.error },
    ].filter((f) => f.text);

    const formatAddress = (address: Order['billing_address']) => {
        const parts = [
            address.address_1,
            address.address_2,
            `${address.city}${address.state ? `, ${address.state}` : ''} ${address.postcode}`,
            address.country,
        ].filter(Boolean);
        return parts;
    };

    const getPaymentMethodLabel = (method: string) => payment?.method_label ?? method;

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
                    {flashes.map((f) => (
                        <div
                            key={f.tone}
                            role={f.tone === 'error' ? 'alert' : 'status'}
                            className={`mb-4 rounded-xl border p-4 ${
                                f.tone === 'success'
                                    ? 'border-success/30 bg-success/10 text-success'
                                    : f.tone === 'error'
                                      ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                      : 'border-warning/30 bg-warning/10 text-foreground'
                            }`}
                        >
                            {f.text}
                        </div>
                    ))}

                    {/* Status Message */}
                    <div className="mb-8 rounded-xl border bg-card p-8 text-center shadow-xs">
                        <div
                            className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
                                cancelled ? 'bg-destructive/10' : payment?.can_pay ? 'bg-warning/15' : 'bg-success/10'
                            }`}
                        >
                            {cancelled ? (
                                <XCircle className="h-12 w-12 text-destructive" />
                            ) : payment?.can_pay ? (
                                <Clock className="h-12 w-12 text-warning-foreground" />
                            ) : (
                                <CheckCircle className="h-12 w-12 text-success" />
                            )}
                        </div>
                        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
                            {cancelled
                                ? 'This order was cancelled'
                                : payment?.can_pay
                                  ? 'Your order is waiting for payment'
                                  : 'Thank you for your order!'}
                        </h1>
                        <p className="mb-4 text-muted-foreground">
                            {cancelled
                                ? 'Nothing is owed for it. Place a new order if you still want the items.'
                                : paid
                                  ? 'Your payment has been received and your order is being processed.'
                                  : payment?.can_pay
                                    ? 'Complete the payment below and we will start on your order.'
                                    : 'Your order has been received and is being processed.'}
                        </p>
                        <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                            <span className="text-muted-foreground">Order Number:</span>
                            <span className="font-bold text-foreground">{order.order_number}</span>
                        </div>
                    </div>

                    {payment?.instructions && (
                        <div className="mb-8 rounded-xl border bg-card p-6 shadow-xs">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                <Landmark className="h-5 w-5 text-primary" />
                                How to pay
                            </h2>
                            <p className="mb-3 text-sm text-muted-foreground">
                                Transfer {formatPrice(order.total, order.currency)} with{' '}
                                <strong className="text-foreground">{order.order_number}</strong> as the reference. We ship once it arrives.
                            </p>
                            <p className="text-sm whitespace-pre-line text-foreground">{payment.instructions}</p>
                        </div>
                    )}

                    {payment?.can_pay && payment.online_methods.length > 0 && (
                        <form method="POST" action={payment.pay_url} className="mb-8 rounded-xl border bg-card p-6 shadow-xs">
                            <input type="hidden" name="_token" value={csrf} />
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Pay for this order
                            </h2>
                            <div className="space-y-3">
                                {payment.online_methods.map((method) => (
                                    <label
                                        key={method.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
                                    >
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value={method.id}
                                            checked={payWith === method.id}
                                            onChange={() => setPayWith(method.id)}
                                            className="size-4 accent-primary"
                                        />
                                        <div>
                                            <span className="font-medium text-foreground">{method.label}</span>
                                            {method.description && <p className="text-sm text-muted-foreground">{method.description}</p>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <button
                                type="submit"
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary/90"
                            >
                                Pay {formatPrice(order.total, order.currency)}
                            </button>
                        </form>
                    )}

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
                                    <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                                    <span>-{formatPrice(order.discount, order.currency)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-muted-foreground">
                                <span>Shipping{order.shipping_method ? ` (${order.shipping_method})` : ''}</span>
                                <span>{order.shipping > 0 ? formatPrice(order.shipping, order.currency) : 'Free'}</span>
                            </div>
                            {order.tax > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>{order.prices_include_tax ? 'Includes tax' : 'Tax'}</span>
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
                        {payment?.invoice_url && (
                            <a
                                href={payment.invoice_url}
                                target="_blank"
                                rel="noopener"
                                className="inline-flex items-center justify-center gap-2 rounded-md border px-6 py-3 font-semibold text-foreground transition-colors hover:bg-accent"
                            >
                                View invoice
                            </a>
                        )}
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
