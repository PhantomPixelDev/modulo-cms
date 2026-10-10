import { expect, test } from '@playwright/test';

test.skip(process.env.MODULO_E2E_SHOP !== '1', 'Requires the active shop and compact demo products');

test('demo shop search, sale price, sold out state, cart toast and checkout work together', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/search?q=Field%20Notebook&lang=en');
    await page.locator('main').getByRole('link', { name: 'Field Notebook A5', exact: true }).click();
    await expect(page).toHaveURL(/\/shop\/field-notebook-a5$/);
    await expect(page.getByRole('heading', { name: 'Field Notebook A5', exact: true })).toBeVisible();
    await page.goto('/shop');
    await expect(page.locator('main article')).toHaveCount(3);
    const scarf = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Merino Wool Scarf' }) });
    await expect(scarf.getByRole('button', { name: 'Out of Stock', exact: true })).toBeDisabled();
    const mug = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Ceramic Mug — Sand' }) });
    await expect(mug).toContainText('18.00');
    const added = page.waitForResponse((response) => response.url().endsWith('/shop/cart/add') && response.request().method() === 'POST');
    await mug.getByRole('button', { name: 'Add to Cart', exact: true }).click();
    expect((await added).status()).toBe(200);
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(1);
    await expect(page.locator('[data-sonner-toaster]')).toHaveCount(1);
    await page.goto('/shop/cart');
    await expect(page.locator('main')).toContainText('Ceramic Mug — Sand');
    await expect(page.locator('main')).toContainText('18.00');
    await page.getByRole('link', { name: 'Proceed to Checkout', exact: true }).click();
    for (const [name, value] of [
        ['customer_name', 'Demo Test'],
        ['customer_email', 'demo-checkout@example.test'],
        ['billing_address_1', '1 Test Street'],
        ['billing_city', 'Test City'],
        ['billing_postcode', '12345'],
    ]) {
        await page.locator(`[name="${name}"]`).fill(value);
    }
    await page.locator('[name="billing_country"]').selectOption('US');
    await page.locator('[name="payment_method"][value="cod"]').check();
    await page.getByRole('button', { name: 'Place Order', exact: true }).click();
    await expect(page).toHaveURL(/\/shop\/order\//);
    await expect(page.locator('main')).toContainText('Ceramic Mug — Sand');
    await expect(page.locator('main')).not.toContainText('Order not found');
    expect(errors).toEqual([]);
});
