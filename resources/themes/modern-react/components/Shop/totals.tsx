/**
 * Order totals as the server calculates them (PriceCalculator), shared by the
 * cart and checkout pages so both show the same breakdown.
 */

export interface ShippingOption {
    id: string;
    name: string;
    price: number;
    free_over: number | null;
    cost: number;
}

export interface ShopTotals {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    currency: string;
    tax_rate?: number;
    prices_include_tax?: boolean;
    shipping_method?: string | null;
    shipping_method_name?: string | null;
    shipping_methods?: ShippingOption[];
    coupon?: { code: string; type: string; amount: number } | null;
    coupon_error?: string | null;
}

export function formatMoney(amount: number, currency = 'USD'): string {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
    return `${symbols[currency] ?? currency + ' '}${amount.toFixed(2)}`;
}

/** JSON request with the CSRF token; returns the parsed body and the status. */
export async function shopRequest<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: T }> {
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    return { ok: response.ok, data: (await response.json()) as T };
}

export function TotalsRows({ totals }: { totals?: ShopTotals }) {
    const currency = totals?.currency ?? 'USD';
    const hasMethods = (totals?.shipping_methods?.length ?? 0) > 0;
    const taxLabel = totals?.prices_include_tax
        ? `Includes tax${totals?.tax_rate ? ` (${totals.tax_rate}%)` : ''}`
        : `Tax${totals?.tax_rate ? ` (${totals.tax_rate}%)` : ''}`;

    return (
        <>
            <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatMoney(totals?.subtotal ?? 0, currency)}</span>
            </div>
            {(totals?.discount ?? 0) > 0 && (
                <div className="flex justify-between text-success">
                    <span>Discount{totals?.coupon ? ` (${totals.coupon.code})` : ''}</span>
                    <span>-{formatMoney(totals?.discount ?? 0, currency)}</span>
                </div>
            )}
            <div className="flex justify-between text-muted-foreground">
                <span>Shipping{totals?.shipping_method_name ? ` (${totals.shipping_method_name})` : ''}</span>
                <span>{!hasMethods || (totals?.shipping ?? 0) === 0 ? 'Free' : formatMoney(totals?.shipping ?? 0, currency)}</span>
            </div>
            {(totals?.tax ?? 0) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                    <span>{taxLabel}</span>
                    <span>{formatMoney(totals?.tax ?? 0, currency)}</span>
                </div>
            )}
        </>
    );
}
