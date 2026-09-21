import { expect, test } from '@playwright/test';

/**
 * The install wizard, end to end.
 *
 * Requires a stack whose database has no users. The CI job builds one; running
 * this against a configured site will correctly find the wizard closed.
 */
test.describe('install wizard', () => {
    test('walks a fresh site from nothing to a login', async ({ page }) => {
        await page.goto('/install');

        await expect(page.getByRole('heading', { name: 'Install Modulo CMS' })).toBeVisible();

        // Requirements are reported, not assumed.
        await expect(page.getByText(/PHP 8\.4 or newer/)).toBeVisible();

        const continueButton = page.getByRole('button', { name: 'Continue' });
        if (await continueButton.isVisible()) {
            await continueButton.click();
        }

        await expect(page.getByRole('heading', { name: 'Database' })).toBeVisible();
        await page.getByRole('button', { name: /Create tables/ }).click();

        await expect(page.getByRole('heading', { name: 'Administrator account' })).toBeVisible({ timeout: 90_000 });

        await page.getByLabel('Name').fill('E2E Administrator');
        await page.getByLabel('Email').fill('e2e-admin@example.test');
        await page.getByLabel('Password', { exact: true }).fill('a-sufficiently-long-password');
        await page.getByLabel('Confirm password').fill('a-sufficiently-long-password');
        await page.getByRole('button', { name: 'Create account' }).click();

        await expect(page.getByRole('heading', { name: 'Your site' })).toBeVisible();

        await page.getByLabel('Site name').fill('End To End Site');
        // Demo content is off by default and must stay off: it creates accounts
        // whose passwords are in the README.
        await expect(page.getByLabel(/Add sample content/)).not.toBeChecked();
        await page.getByRole('button', { name: 'Save' }).click();

        await expect(page.getByRole('heading', { name: 'Ready' })).toBeVisible();
        await page.getByRole('button', { name: /Finish/ }).click();

        await expect(page).toHaveURL(/\/login/);
    });

    test('closes itself once the site is installed', async ({ page }) => {
        // Runs after the wizard completed above. The installer creates an
        // administrator without authenticating, so it must be unreachable.
        const response = await page.goto('/install');

        expect(response?.status()).toBe(404);
    });

    test('serves the public site and the health endpoint', async ({ page, request }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await expect(page.locator('#app')).not.toBeEmpty({ timeout: 90_000 });

        const health = await request.get('/health');
        expect(health.ok()).toBeTruthy();

        const body = await health.json();
        expect(body.status).toBe('ok');
        expect(body).toHaveProperty('version');
    });
});
