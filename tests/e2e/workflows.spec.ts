import { expect, test, type Page } from '@playwright/test';

/**
 * Core content-management screens, as a signed-in administrator. Runs after
 * install.spec.ts and system.spec.ts (files run in name order on one worker),
 * which created this account.
 *
 * Like system.spec.ts, every page is checked for console errors: with
 * MODULO_CSP=report (the default) a Content-Security-Policy violation shows
 * up there, so this keeps the policy and the nonces honest on the screens
 * editors use every day. Only read-only navigation is exercised here; form
 * submissions are covered by the Pest feature suite.
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

test.describe('content workflows', () => {
    test.describe.configure({ mode: 'serial' });

    test('posts, media, users and taxonomies render without errors', async ({ page }) => {
        const errors = collectConsoleErrors(page);
        await signIn(page);

        for (const [path, heading] of [
            ['/dashboard/admin/posts', 'Posts'],
            ['/dashboard/admin/media', 'Media Library'],
            ['/dashboard/admin/users', 'Users'],
            ['/dashboard/admin/taxonomies', 'Taxonomies'],
        ] as const) {
            await page.goto(path);
            await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible();
        }

        expect(errors, errors.join('\n')).toEqual([]);
    });

    test('the new post and new user forms open', async ({ page }) => {
        const errors = collectConsoleErrors(page);
        await signIn(page);

        await page.goto('/dashboard/admin/posts');
        await page.getByRole('button', { name: '+ New Post' }).click();
        await expect(page.getByRole('heading', { name: 'Create Post', exact: true }).first()).toBeVisible();

        await page.goto('/dashboard/admin/users');
        await page.getByRole('button', { name: '+ New User' }).click();
        await expect(page.getByRole('heading', { name: 'Create New User', exact: true }).first()).toBeVisible();

        expect(errors, errors.join('\n')).toEqual([]);
    });
});
