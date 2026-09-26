import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { configureMoney, formatMoney, type MoneyFormat } from '../Shop/totals';
import { buttonClass, useThemeT } from './ui';

interface MiniItem {
    key?: string;
    product_id: number;
    product_name: string;
    variant_name?: string | null;
    product_image?: string | null;
    quantity: number;
    subtotal: number;
}

interface MiniCartData {
    items: MiniItem[];
    item_count: number;
    subtotal: number;
    currency: string;
    is_empty: boolean;
    money?: MoneyFormat;
}

/**
 * The header cart button: shows the count, and on click a short summary of
 * the cart (loaded when opened) with the way to the cart and checkout.
 */
export function MiniCart({ count }: { count: number }) {
    const tt = useThemeT();
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<MiniCartData | null>(null);
    const [loading, setLoading] = useState(false);
    const root = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        let alive = true;
        setLoading(true);
        fetch('/shop/cart/mini', { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then((d: MiniCartData) => {
                if (!alive) return;
                configureMoney(d.money);
                setData(d);
            })
            .catch(() => alive && setData(null))
            .finally(() => alive && setLoading(false));

        const close = (e: MouseEvent | KeyboardEvent) => {
            if (e instanceof KeyboardEvent ? e.key === 'Escape' : !root.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', close);

        return () => {
            alive = false;
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', close);
        };
    }, [open]);

    return (
        <div ref={root} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(buttonClass('ghost', 'sm'), 'relative')}
                aria-label={tt('nav.cart', 'Cart')}
                aria-expanded={open}
                aria-haspopup="dialog"
            >
                <ShoppingCart />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                        {count}
                    </span>
                )}
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label={tt('nav.cart', 'Cart')}
                    className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-card p-4 text-card-foreground shadow-lg"
                >
                    {loading && !data ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">…</p>
                    ) : !data || data.is_empty ? (
                        <div className="py-6 text-center">
                            <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                        </div>
                    ) : (
                        <>
                            <ul className="max-h-72 space-y-3 overflow-y-auto">
                                {data.items.map((item) => (
                                    <li key={item.key ?? item.product_id} className="flex items-center gap-3">
                                        {item.product_image ? (
                                            <img src={item.product_image} alt="" className="h-12 w-12 rounded-md object-cover" />
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                                                <ShoppingBag className="h-4 w-4 text-muted-foreground/60" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1 text-sm">
                                            <p className="truncate font-medium">{item.product_name}</p>
                                            <p className="text-muted-foreground">
                                                {item.variant_name ? `${item.variant_name} · ` : ''}× {item.quantity}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium tabular-nums">{formatMoney(item.subtotal, data.currency)}</span>
                                    </li>
                                ))}
                            </ul>
                            {data.item_count > data.items.length && (
                                <p className="mt-2 text-xs text-muted-foreground">and {data.item_count - data.items.length} more…</p>
                            )}
                            <div className="mt-4 flex justify-between border-t pt-3 text-sm font-semibold">
                                <span>Subtotal</span>
                                <span className="tabular-nums">{formatMoney(data.subtotal, data.currency)}</span>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <Link href="/shop/cart" className={buttonClass('outline', 'sm')} onClick={() => setOpen(false)}>
                                    View cart
                                </Link>
                                <Link href="/shop/checkout" className={buttonClass('primary', 'sm')} onClick={() => setOpen(false)}>
                                    Checkout
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
