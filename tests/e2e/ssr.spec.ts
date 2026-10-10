import { expect, test } from '@playwright/test';

test.skip(process.env.MODULO_E2E_SSR !== '1', 'Requires the isolated SSR-enabled server');

test('server-rendered pages remain readable without JavaScript and hydrate without errors', async ({ browser, page }) => {
    const staticContext = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await staticContext.newPage();
    await staticPage.goto('/login');
    await expect(staticPage.locator('#app')).toContainText('Log in');
    await expect(staticPage.getByLabel('Email address')).toBeVisible();
    await staticContext.close();

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto('/login');
    await page.getByLabel('Email address').fill('ssr@example.test');
    await expect(page.getByLabel('Email address')).toHaveValue('ssr@example.test');
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
    expect(errors).toEqual([]);
});
