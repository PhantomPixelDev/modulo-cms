import { useEffect } from 'react';
import { useThemeT } from '../partials/ui';
import { cartCountFromAddResponse, fetchCartCount, notifyCartUpdated, shopAddToCart, toastAddedToCart, toastCartError } from './shopCart';

/**
 * Makes shortcode-rendered buttons work anywhere (`[add_to_cart]`, product
 * cards/grids embedded in pages via `dangerouslySetInnerHTML`).
 *
 * The plugin renders `<button class="add-to-cart-btn" data-product-id="…">`
 * with no JS of its own, so one delegated listener in the theme Layout covers
 * every page. React-managed shop buttons (Archive/Single/Category) do NOT use
 * that class, so this never double-fires with their onClick handlers.
 */
export function useShortcodeCart() {
    const tt = useThemeT();

    useEffect(() => {
        const onClick = async (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            const button = target?.closest?.('.add-to-cart-btn') as HTMLButtonElement | null;
            if (!button || button.disabled || button.dataset.busy === '1') return;

            const productId = Number.parseInt(button.dataset.productId || '', 10);
            if (Number.isNaN(productId)) return;

            event.preventDefault();

            // `[product]` detail markup pairs the button with a quantity input.
            const scope = button.closest('.add-to-cart-form, .product-single, .product-card') || document;
            const quantityInput = scope.querySelector?.('.quantity-input') as HTMLInputElement | null;
            const quantity = Math.min(99, Math.max(1, Number.parseInt(quantityInput?.value || button.dataset.quantity || '1', 10) || 1));
            const variantId = button.dataset.variantId || null;
            const productTitle = button.dataset.productTitle || button.getAttribute('aria-label') || button.textContent?.trim() || '';

            button.disabled = true;
            button.dataset.busy = '1';

            try {
                const { data } = await shopAddToCart(productId, quantity, variantId);
                if (data.success) {
                    const count = cartCountFromAddResponse(data) ?? (await fetchCartCount());
                    if (typeof count === 'number') notifyCartUpdated(count);
                    toastAddedToCart(
                        productTitle
                            ? tt('shop.added_to_cart', 'Added to cart: :title', { title: productTitle })
                            : tt('shop.added_to_cart_generic', 'Added to cart!'),
                        tt('shop.view_cart', 'View cart'),
                    );
                } else {
                    toastCartError(data.message || tt('shop.add_failed', 'Failed to add to cart'));
                }
            } catch {
                toastCartError(tt('shop.add_failed', 'Failed to add to cart'));
            } finally {
                button.disabled = false;
                delete button.dataset.busy;
            }
        };

        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, [tt]);
}
