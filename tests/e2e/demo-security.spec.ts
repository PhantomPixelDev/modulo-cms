import { expect, test } from '@playwright/test';

test.skip(process.env.MODULO_E2E_DEMO !== '1', 'Requires a disposable public demo');

test('public demo credentials cannot administer the server through direct requests', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('admin@example.com');
    await page.getByLabel('Password', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    for (const path of ['/dashboard/admin/system/backups', '/dashboard/admin/users', '/dashboard/admin/roles', '/settings/api-tokens']) {
        expect((await page.request.get(path, { headers: { Accept: 'application/json' } })).status(), path).toBe(403);
    }
    const cookie = (await page.context().cookies()).find((entry) => entry.name === 'XSRF-TOKEN');
    expect(cookie).toBeDefined();
    const headers = { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(cookie!.value) };
    for (const path of ['/dashboard/admin/system/backups/upload', '/dashboard/admin/plugins/install', '/settings/api-tokens']) {
        expect((await page.request.post(path, { headers, data: {} })).status(), path).toBe(403);
    }
    expect((await page.request.put('/settings/password', { headers, data: {} })).status()).toBe(403);
    expect((await page.request.get('/dashboard/admin/posts', { headers })).status()).toBe(200);
    expect((await page.request.get('/dashboard/admin/media', { headers })).status()).toBe(200);
});
