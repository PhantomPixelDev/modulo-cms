import { expect, test } from '@playwright/test';

test.skip(process.env.MODULO_E2E_SHOP !== '1', 'Requires the active shop');

test('cart navigation stops a redirect and recovers on the next poll', async ({ page }) => {
    await page.clock.install();
    await page.addInitScript(() => {
        const nativeFetch = window.fetch.bind(window);
        const responseTypes: string[] = [];
        (window as Window & { cartResponseTypes?: string[] }).cartResponseTypes = responseTypes;
        window.fetch = async (...args: Parameters<typeof fetch>) => {
            const response = await nativeFetch(...args);
            if (typeof args[0] === 'string' && args[0].endsWith('/shop/cart/count')) responseTypes.push(response.type);
            return response;
        };
    });
    let requests = 0;
    let healthy = false;
    const failures: string[] = [];
    page.on('requestfailed', (request) => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
    await page.route('**/shop/cart/count', async (route) => {
        requests++;
        await route.fulfill(
            healthy
                ? { status: 200, contentType: 'application/json', body: JSON.stringify({ count: 2 }) }
                : { status: 301, headers: { Location: '/shop/cart/count', 'Cache-Control': 'public, max-age=3600' } },
        );
    });
    const first = page.waitForResponse((response) => response.url().endsWith('/shop/cart/count'));
    await page.goto('/shop?lang=en');
    expect((await first).status()).toBe(301);
    await expect(page.getByRole('button', { name: 'Cart', exact: true })).toBeVisible();
    // Observe the native fetch result before recovering: a followed redirect
    // chain must not accidentally pass by reaching the later healthy response.
    await expect.poll(() => page.evaluate(() => (window as Window & { cartResponseTypes?: string[] }).cartResponseTypes)).toEqual(['opaqueredirect']);
    healthy = true;
    await page.clock.fastForward('00:31');
    await expect(page.getByRole('button', { name: 'Cart', exact: true })).toContainText('2');
    expect(requests).toBe(2);
    expect(failures).toEqual([]);
});

test('normal navigation has no failed cart requests or unsupported policy warnings', async ({ page }) => {
    const failures: string[] = [];
    page.on('requestfailed', (request) => failures.push(`${request.url()}: ${request.failure()?.errorText}`));
    page.on('console', (message) => {
        if (message.type() === 'error' || message.text().includes('Permissions-Policy')) failures.push(message.text());
    });
    for (const path of ['/shop', '/shop/field-notebook-a5', '/about']) {
        const cart = page.waitForResponse((response) => response.url().endsWith('/shop/cart/count'));
        await page.goto(`${path}?lang=en`);
        const response = await cart;
        expect(response.status()).toBe(200);
        expect(response.request().redirectedFrom()).toBeNull();
        expect(typeof (await response.json()).count).toBe('number');
        await expect(page.locator('main h1').first()).toBeVisible();
    }
    expect(failures).toEqual([]);
});
