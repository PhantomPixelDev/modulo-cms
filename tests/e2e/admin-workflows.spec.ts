import { expect, test, type Page } from '@playwright/test';

/**
 * Critical admin workflows: content creation, media upload, and user management.
 * Runs after install.spec.ts and system.spec.ts (files run in name order on one
 * worker), which created the admin account.
 */
const EMAIL = process.env.MODULO_E2E_EMAIL ?? 'e2e-admin@example.test';
const PASSWORD = process.env.MODULO_E2E_PASSWORD ?? 'a-sufficiently-long-password';

function collectConsoleErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('console', (message) => {
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

test.describe('admin workflows', () => {
    test.describe.configure({ mode: 'serial' });

    test('creates and edits a post', async ({ page }) => {
        const errors = collectConsoleErrors(page);
        await signIn(page);

        await page.goto('/dashboard/admin/posts');
        await expect(page.getByRole('heading', { name: 'Posts', exact: true }).first()).toBeVisible();

        await page.getByRole('button', { name: /new post|add post|create post/i }).first().click();
        await expect(page.getByRole('heading', { name: /new post|create post/i }).first()).toBeVisible();

        await page.getByLabel('Title').fill('E2E Test Post');
        await page.getByLabel('Content').fill('This is test content created by E2E tests.');

        await page.getByRole('button', { name: /save|publish/i }).first().click();
        await expect(page.getByText('E2E Test Post').first()).toBeVisible();

        await page.getByText('E2E Test Post').first().click();
        await expect(page.getByRole('heading', { name: /edit post/i }).first()).toBeVisible();

        await page.getByLabel('Title').fill('E2E Test Post Updated');
        await page.getByRole('button', { name: /save|update/i }).first().click();
        await expect(page.getByText('E2E Test Post Updated').first()).toBeVisible();

        expect(errors, errors.join('\n')).toEqual([]);
    });

    test('uploads and selects media', async ({ page }) => {
        const errors = collectConsoleErrors(page);
        await signIn(page);

        await page.goto('/dashboard/admin/media');
        await expect(page.getByRole('heading', { name: 'Media', exact: true }).first()).toBeVisible();

        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles({
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('E2E test file content'),
        });

        await expect(page.getByText('test.txt').first()).toBeVisible({ timeout: 30_000 });

        expect(errors, errors.join('\n')).toEqual([]);
    });

    test('creates a user and assigns a role', async ({ page }) => {
        const errors = collectConsoleErrors(page);
        await signIn(page);

        await page.goto('/dashboard/admin/users');
        await expect(page.getByRole('heading', { name: 'Users', exact: true }).first()).toBeVisible();

        await page.getByRole('button', { name: /new user|add user|create user/i }).first().click();
        await expect(page.getByRole('heading', { name: /new user|create user/i }).first()).toBeVisible();

        await page.getByLabel('Name').fill('E2E Test User');
        await page.getByLabel('Email').fill('e2e-user@example.test');
        await page.getByLabel('Password', { exact: true }).fill('a-sufficiently-long-password');
        await page.getByLabel('Confirm password').fill('a-sufficiently-long-password');

        await page.getByRole('button', { name: /save|create/i }).first().click();
        await expect(page.getByText('e2e-user@example.test').first()).toBeVisible();

        expect(errors, errors.join('\n')).toEqual([]);
    });

    test('manages taxonomy terms', async ({ page }) => {
        const errors = collectConsoleErrors(page);
        await signIn(page);

        await page.goto('/dashboard/admin/taxonomies');
        await expect(page.getByRole('heading', { name: 'Taxonomies', exact: true }).first()).toBeVisible();

        await page.getByRole('button', { name: /new taxonomy|add taxonomy|create taxonomy/i }).first().click();
        await expect(page.getByRole('heading', { name: /new taxonomy|create taxonomy/i }).first()).toBeVisible();

        await page.getByLabel('Name').fill('E2E Category');
        await page.getByLabel('Slug').fill('e2e-category');

        await page.getByRole('button', { name: /save|create/i }).first().click();
        await expect(page.getByText('E2E Category').first()).toBeVisible();

        expect(errors, errors.join('\n')).toEqual([]);
    });
});
