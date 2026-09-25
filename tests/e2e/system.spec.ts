import { expect, test, type Page } from '@playwright/test';

/**
 * The admin's system screens and the headless API, as a signed-in
 * administrator. Runs after install.spec.ts (files run in name order on one
 * worker), which created this account.
 *
 * Every page is also checked for console errors: with MODULO_CSP=report (the
 * default) a Content-Security-Policy violation shows up there, so this is what
 * keeps the policy and the nonces honest.
 */
const EMAIL = process.env.MODULO_E2E_EMAIL ?? 'e2e-admin@example.test';
const PASSWORD = process.env.MODULO_E2E_PASSWORD ?? 'a-sufficiently-long-password';

function collectConsoleErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (message) => {
        // Resource failures are the network's business (third-party fonts,
        // and the 409 Inertia uses for a full-page redirect); script errors and
        // CSP violations are ours.
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(String(error)));
    return errors;
}

async function signIn(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
}

test.describe('system screens', () => {
    test.describe.configure({ mode: 'serial' });

    test('updates, backups, activity and trash render without errors', async ({ page }) => {
        const errors = collectConsoleErrors(page);
        await signIn(page);

        for (const [path, heading] of [
            ['/dashboard/admin/system/updates', 'Updates'],
            ['/dashboard/admin/system/backups', 'Backups'],
            ['/dashboard/admin/system/activity', 'Activity'],
            ['/dashboard/admin/system/redirects', 'Redirects'],
            ['/dashboard/admin/trash', 'Trash'],
            ['/dashboard/admin/plugins', 'Plugins'],
        ] as const) {
            await page.goto(path);
            await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
        }

        // The sign-in above is in the audit trail.
        await page.goto('/dashboard/admin/system/activity?group=auth');
        await expect(page.getByText('auth.login').first()).toBeVisible();

        expect(errors, errors.join('\n')).toEqual([]);
    });

    test('a redirect added in the admin sends visitors on', async ({ page, request }) => {
        await signIn(page);
        await page.goto('/dashboard/admin/system/redirects');
        await page.getByPlaceholder('/old-page').fill('/e2e-old');
        await page.getByPlaceholder('/new-page or https://…').fill('/e2e-new');
        await page.getByRole('button', { name: 'Add' }).click();
        await expect(page.getByText('/e2e-old')).toBeVisible();

        const response = await request.get('/e2e-old', { maxRedirects: 0 });
        expect(response.status()).toBe(301);
        expect(response.headers()['location']).toMatch(/\/e2e-new$/);
    });

    test('an API token reads the API', async ({ page, request }) => {
        await signIn(page);
        await page.goto('/settings/api-tokens');

        // Opening the page asks for the password again.
        await expect(page.getByRole('heading', { name: /confirm your password/i })).toBeVisible();
        await page.getByLabel('Password').fill(PASSWORD);
        await page.getByRole('button', { name: /confirm password/i }).click();

        await page.getByLabel('Name').fill('e2e');
        await page.getByRole('button', { name: 'Create token' }).click();

        const token = (await page.locator('code', { hasText: /^mod_/ }).first().textContent())?.trim() ?? '';
        expect(token).toMatch(/^mod_/);

        const posts = await request.get('/api/v1/posts?status=any', { headers: { Authorization: `Bearer ${token}` } });
        expect(posts.ok()).toBeTruthy();
        expect(await posts.json()).toHaveProperty('data');

        const wrong = await request.get('/api/v1/posts', { headers: { Authorization: 'Bearer mod_wrong' } });
        expect(wrong.status()).toBe(401);
    });
});
