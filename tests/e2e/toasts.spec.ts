import { expect, test } from '@playwright/test';

for (const width of [1280, 390]) {
    test(`cart feedback appears once in one position at ${width}px`, async ({ page, request }) => {
        await page.setViewportSize({ width, height: 900 });
        const homepage = await request.get('/');
        const html = await homepage.text();
        // Use the real app shell and theme, with a storefront response fixture so
        // this regression runs even on installations without the shop plugin.
        const fixtureHtml = await page.evaluate((html) => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const app = doc.querySelector('#app');
            if (!app) throw new Error('Application shell is missing');
            const pageData = doc.querySelector('script[data-page="app"][type="application/json"]');
            const data = JSON.parse(pageData?.textContent || app.getAttribute('data-page') || '{}');
            data.component = 'Themes/ModernReact/Shop/Archive';
            data.url = '/shop';
            data.props.products = {
                data: [
                    { id: 1, title: 'First product', slug: 'first-product', price: 10, in_stock: true },
                    { id: 2, title: 'Second product', slug: 'second-product', price: 20, in_stock: true },
                ],
            };
            if (pageData) pageData.textContent = JSON.stringify(data);
            else app.setAttribute('data-page', JSON.stringify(data));
            return '<!DOCTYPE html>' + doc.documentElement.outerHTML;
        }, html);
        await page.route('**/shop', (route) => route.fulfill({ contentType: 'text/html', body: fixtureHtml }));
        await page.route('**/shop/cart/count', (route) => route.fulfill({ json: { count: 0 } }));
        let fail = false;
        await page.route('**/shop/cart/add', (route) =>
            route.fulfill({ json: fail ? { success: false, message: 'Could not add this product' } : { success: true, item_count: 1 } }),
        );
        await page.goto('/shop');
        const toast = page.locator('[data-sonner-toast]');
        const containers = page.locator('[data-sonner-toaster]');
        await page.getByRole('button', { name: 'Add to Cart', exact: true }).first().click();
        await expect(toast).toHaveCount(1);
        await expect(toast).toContainText('Added to cart: First product');
        await expect(containers).toHaveCount(1);
        await expect(containers).toHaveAttribute('data-x-position', 'right');
        await expect(containers).toHaveAttribute('data-y-position', 'top');
        await expect(toast.getByRole('button', { name: 'View cart', exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Add to Cart', exact: true }).nth(1).click();
        await expect(toast).toHaveCount(1);
        await expect(toast).toContainText('Added to cart: Second product');
        fail = true;
        await page.getByRole('button', { name: 'Add to Cart', exact: true }).first().click();
        await expect(toast).toHaveCount(1);
        await expect(toast).toContainText('Could not add this product');
        await expect(toast.getByRole('button', { name: 'View cart', exact: true })).toHaveCount(0);
        await expect(containers).toHaveCount(1);
    });
}
