import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sonner', () => ({
    toast: { success: vi.fn(), error: vi.fn() },
    Toaster: () => null,
}));

import { toast } from 'sonner';
import {
    cartCountFromAddResponse,
    fetchCartCount,
    getCsrfToken,
    notifyCartUpdated,
    SHOP_CART_UPDATED_EVENT,
    shopAddToCart,
    subscribeCartUpdated,
    toastAddedToCart,
    toastCartError,
} from './shopCart';

describe('shopCart', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        document.head.innerHTML = '';
        vi.clearAllMocks();
    });

    it('reads the CSRF token from the meta tag', () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'csrf-token');
        meta.setAttribute('content', 'token-123');
        document.head.appendChild(meta);

        expect(getCsrfToken()).toBe('token-123');
    });

    it('returns an empty token when the meta tag is missing', () => {
        expect(getCsrfToken()).toBe('');
    });

    it('prefers the top-level item_count from add responses', () => {
        expect(cartCountFromAddResponse({ success: true, item_count: 3, cart: { item_count: 2 } })).toBe(3);
        expect(cartCountFromAddResponse({ success: true, cart: { item_count: 2 } })).toBe(2);
        expect(cartCountFromAddResponse({ success: true })).toBeNull();
        expect(cartCountFromAddResponse(null)).toBeNull();
    });

    it('broadcasts cart counts to subscribers', () => {
        const received: number[] = [];
        const unsubscribe = subscribeCartUpdated((count) => received.push(count));

        notifyCartUpdated(2);
        // Other events on window must not trigger the handler.
        window.dispatchEvent(new Event('shop:other'));

        expect(received).toEqual([2]);

        unsubscribe();
        notifyCartUpdated(5);
        expect(received).toEqual([2]);
    });

    it('posts add-to-cart with CSRF token and JSON headers', async () => {
        const meta = document.createElement('meta');
        meta.setAttribute('name', 'csrf-token');
        meta.setAttribute('content', 'csrf-abc');
        document.head.appendChild(meta);

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, cart: { item_count: 4 } }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const { ok, data } = await shopAddToCart(7, 2, null);

        expect(ok).toBe(true);
        expect(data.cart?.item_count).toBe(4);
        expect(fetchMock).toHaveBeenCalledWith(
            '/shop/cart/add',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ product_id: 7, quantity: 2, variant_id: null }),
            }),
        );
        expect(fetchMock.mock.calls[0][1].headers['X-CSRF-TOKEN']).toBe('csrf-abc');
    });

    it('reads the cart count endpoint', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ count: 6 }) }));

        await expect(fetchCartCount()).resolves.toBe(6);
    });

    it('returns null when the count endpoint fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

        await expect(fetchCartCount()).resolves.toBeNull();
    });

    it('does not parse redirected or unavailable cart counts', async () => {
        const json = vi.fn();
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 0, type: 'opaqueredirect', json }));
        await expect(fetchCartCount()).resolves.toBeNull();
        expect(json).not.toHaveBeenCalled();
    });

    it('toasts success with a View cart action and errors plainly', () => {
        toastAddedToCart('Added to cart: Demo', 'View cart');
        expect(toast.success).toHaveBeenCalledWith(
            'Added to cart: Demo',
            expect.objectContaining({
                id: 'shop-cart-feedback',
                duration: 4000,
                action: expect.objectContaining({ label: 'View cart' }),
            }),
        );

        toastCartError('Failed to add to cart');
        expect(toast.error).toHaveBeenCalledWith(
            'Failed to add to cart',
            expect.objectContaining({ id: 'shop-cart-feedback', duration: 4000, action: null }),
        );
    });

    it('uses the documented event name', () => {
        expect(SHOP_CART_UPDATED_EVENT).toBe('shop:cart-updated');
    });
});
