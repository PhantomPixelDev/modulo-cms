import { expect, test } from '@playwright/test';

test.skip(process.env.MODULO_E2E_DEMO !== '1', 'Requires a disposable demo');

test('theme colors save to public pages, validation preserves input and reset restores defaults', async ({ page }) => {
    await page.goto('/login?lang=en');
    await page.getByLabel('Email address').fill('admin@example.com');
    await page.getByLabel('Password', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/dashboard/admin/theme-settings?lang=en');
    await expect(page.locator('#theme-primary_color')).toBeVisible();
    const url = new URL(page.url());
    const endpoint = `${url.origin}${url.pathname}`;
    const initial = await page.locator('#theme-primary_color').inputValue();
    const adminPrimary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary'));
    try {
        await page.locator('#theme-primary_color').fill('#7c3aed');
        await expect(page.getByTestId('theme-settings-preview')).toHaveCSS('--primary', '#7c3aed');
        await page.getByRole('button', { name: 'Save settings', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Save settings', exact: true })).toBeDisabled();
        await page.reload();
        await expect(page.locator('#theme-primary_color')).toHaveValue('#7c3aed');
        expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary'))).toBe(adminPrimary);
        const publicPage = await page.context().newPage();
        await publicPage.goto('/?lang=en');
        await expect(publicPage.locator('.theme-frontend').first()).toHaveCSS('--primary', '#7c3aed');
        await publicPage.close();

        await page.locator('#theme-primary_color').fill('#zzzzzz');
        await page.getByRole('button', { name: 'Save settings', exact: true }).click();
        await expect(page.getByRole('alert').first()).toBeVisible();
        await expect(page.locator('#theme-primary_color')).toHaveValue('#zzzzzz');
        await expect(page.getByRole('button', { name: 'Save settings', exact: true })).toBeEnabled();
        await page.setViewportSize({ width: 390, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    } finally {
        const cookie = (await page.context().cookies()).find((entry) => entry.name === 'XSRF-TOKEN');
        expect(cookie).toBeDefined();
        const reset = await page.request.delete(endpoint, {
            maxRedirects: 0,
            headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(cookie!.value) },
        });
        expect(reset.status()).toBe(302);
    }
    await page.reload();
    await expect(page.locator('#theme-primary_color')).toHaveValue(initial);
});
