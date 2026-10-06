import { toast } from 'sonner';

/**
 * Shared storefront cart client for the Modern React theme.
 *
 * Archive / Single / Category use `shopAddToCart` directly, while shortcode
 * HTML (`[add_to_cart]`, product cards rendered with `dangerouslySetInnerHTML`)
 * is handled by a delegated click listener (see `useShortcodeCart`). Both
 * paths toast the result and broadcast the new count so the header badge
 * (desktop MiniCart + mobile nav) updates instantly instead of waiting for
 * the 30s poll in Navigation.
 */

export const SHOP_CART_UPDATED_EVENT = 'shop:cart-updated';

export interface ShopCartData {
    item_count?: number;
    items?: unknown[];
    subtotal?: number;
    currency?: string;
    is_empty?: boolean;
}

export interface ShopCartAddResponse {
    success: boolean;
    message?: string;
    cart?: ShopCartData;
    totals?: Record<string, unknown>;
    /** Top-level count, when the API provides it (no extra /count fetch). */
    item_count?: number;
    added?: {
        product_id: number;
        quantity: number;
        variant_id?: string | null;
        product_name?: string | null;
    } | null;
}

export function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

export async function shopAddToCart(
    productId: number,
    quantity = 1,
    variantId: string | null = null,
): Promise<{ ok: boolean; data: ShopCartAddResponse }> {
    const response = await fetch('/shop/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({ product_id: productId, quantity, variant_id: variantId }),
    });

    let data: ShopCartAddResponse = { success: response.ok };
    try {
        data = (await response.json()) as ShopCartAddResponse;
    } catch {
        // Non-JSON response (e.g. a redirect): keep the ok-derived default.
    }

    return { ok: response.ok, data };
}

export async function fetchCartCount(): Promise<number | null> {
    try {
        const response = await fetch('/shop/cart/count', { headers: { Accept: 'application/json' } });
        const data = (await response.json()) as { count?: unknown };
        return typeof data.count === 'number' ? data.count : null;
    } catch {
        return null;
    }
}

/** Best-effort count from an add-to-cart response (no extra request). */
export function cartCountFromAddResponse(data: ShopCartAddResponse | null | undefined): number | null {
    if (!data) return null;
    if (typeof data.item_count === 'number') return data.item_count;
    if (data.cart && typeof data.cart.item_count === 'number') return data.cart.item_count;
    return null;
}

/** Tell every badge on the page the new cart count. */
export function notifyCartUpdated(count: number): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<{ count: number }>(SHOP_CART_UPDATED_EVENT, { detail: { count } }));
}

/** Subscribe to instant cart-count updates. Returns an unsubscribe function. */
export function subscribeCartUpdated(handler: (count: number) => void): () => void {
    const listener = (event: Event) => {
        const count = (event as CustomEvent<{ count?: unknown }>).detail?.count;
        if (typeof count === 'number') handler(count);
    };
    window.addEventListener(SHOP_CART_UPDATED_EVENT, listener);
    return () => window.removeEventListener(SHOP_CART_UPDATED_EVENT, listener);
}

export function toastAddedToCart(message: string, viewCartLabel: string): void {
    toast.success(message, {
        duration: 4000,
        action: {
            label: viewCartLabel,
            onClick: () => {
                window.location.href = '/shop/cart';
            },
        },
    });
}

export function toastCartError(message: string): void {
    toast.error(message, { duration: 4000 });
}
