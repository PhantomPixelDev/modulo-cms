import SEOHead from '@/components/SEOHead';
import { Link } from '@inertiajs/react';
import { Package, ShoppingBag } from 'lucide-react';
import type { ComponentProps } from 'react';
import Layout from '../Layout';
import { configureMoney, formatMoney, type MoneyFormat } from './totals';

interface AccountOrder {
    order_number: string;
    created_at: string | null;
    status: string;
    status_label: string;
    payment_status: string;
    payment_status_label: string;
    total: number;
    currency: string;
    item_count: number;
    url: string;
}

interface AccountProps {
    money?: MoneyFormat;
    orders?: {
        data: AccountOrder[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    customer?: { name: string; email: string };
    site?: LayoutProps['site'];
    theme?: LayoutProps['theme'];
    menus?: LayoutProps['menus'];
}

type LayoutProps = ComponentProps<typeof Layout>;

const badge = (tone: 'ok' | 'wait' | 'off') =>
    `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        tone === 'ok' ? 'bg-success/10 text-success' : tone === 'off' ? 'bg-muted text-muted-foreground' : 'bg-warning/20 text-warning-foreground'
    }`;

export default function Account({ orders, customer, site, theme, menus, money }: AccountProps) {
    configureMoney(money);
    const safeSite = site ?? { name: 'Shop' };
    const safeTheme = theme ?? {};
    const safeMenus = menus ?? {};
    const rows = orders?.data ?? [];

    return (
        <Layout site={safeSite} theme={safeTheme} menus={safeMenus} title="My orders">
            <SEOHead title="My orders" description="Your orders" noindex />

            <div className="mx-auto max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">My orders</h1>
                    {customer && (
                        <p className="mt-1 text-muted-foreground">
                            Signed in as {customer.name} ({customer.email})
                        </p>
                    )}
                </div>

                {rows.length === 0 ? (
                    <div className="rounded-xl border bg-card p-10 text-center shadow-xs">
                        <Package className="mx-auto mb-4 h-14 w-14 text-muted-foreground/40" />
                        <p className="mb-6 text-muted-foreground">You have not ordered anything yet.</p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            Start shopping
                        </Link>
                    </div>
                ) : (
                    <ul className="divide-y rounded-xl border bg-card shadow-xs">
                        {rows.map((order) => (
                            <li key={order.order_number}>
                                <a
                                    href={order.url}
                                    className="flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:bg-accent"
                                >
                                    <div>
                                        <div className="font-medium text-foreground">{order.order_number}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''} · {order.item_count}{' '}
                                            {order.item_count === 1 ? 'item' : 'items'}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={badge(['cancelled', 'refunded'].includes(order.status) ? 'off' : 'ok')}>
                                            {order.status_label}
                                        </span>
                                        <span
                                            className={badge(
                                                order.payment_status === 'paid' ? 'ok' : order.payment_status === 'pending' ? 'wait' : 'off',
                                            )}
                                        >
                                            {order.payment_status_label}
                                        </span>
                                        <span className="ml-2 font-semibold text-foreground">{formatMoney(order.total, order.currency)}</span>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                )}

                {orders && orders.last_page > 1 && (
                    <nav className="mt-6 flex justify-between" aria-label="Pages">
                        {orders.prev_page_url ? (
                            <Link href={orders.prev_page_url} className="text-sm underline">
                                Newer orders
                            </Link>
                        ) : (
                            <span />
                        )}
                        {orders.next_page_url && (
                            <Link href={orders.next_page_url} className="text-sm underline">
                                Older orders
                            </Link>
                        )}
                    </nav>
                )}
            </div>
        </Layout>
    );
}
