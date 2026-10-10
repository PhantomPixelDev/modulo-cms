import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const EMAIL = process.env.MODULO_E2E_EMAIL ?? 'e2e-admin@example.test';
const PASSWORD = process.env.MODULO_E2E_PASSWORD ?? 'a-sufficiently-long-password';
const hasFixtures = Boolean(process.env.MODULO_E2E_CONTAINER) || process.env.MODULO_E2E_FIXTURES === 'true';

async function login(page: Page, email = EMAIL) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
}

async function newPost(page: Page, title: string, locale?: string) {
    const loaded = page.waitForResponse(
        (response) => response.url().includes('/dashboard/admin/editor-drafts') && response.request().method() === 'GET',
    );
    await page.goto(`/dashboard/admin/posts/create${locale ? `?locale=${locale}` : ''}`);
    await loaded;
    const discard = page.getByRole('button', { name: 'Discard', exact: true });
    if (await discard.isVisible()) {
        await discard.click();
        await expect(discard).toHaveCount(0);
    }
    await page.locator('#title').fill(title);
    await page.getByRole('textbox', { name: 'Content', exact: true }).fill('Browser submission body');
}

test.describe('editor submissions and recovery', () => {
    test.beforeAll(() => {
        const container = process.env.MODULO_E2E_CONTAINER;
        if (container) {
            execFileSync(
                process.env.MODULO_CONTAINER_RUNTIME ?? 'docker',
                ['exec', '-e', 'MODULO_E2E_FIXTURES=true', container, 'php', 'tests/e2e/editor-fixtures.php'],
                {
                    env: { ...process.env, MODULO_E2E_FIXTURES: 'true' },
                },
            );
        } else if (hasFixtures) {
            execFileSync('php', ['tests/e2e/editor-fixtures.php'], { env: process.env });
        }
    });

    test('writers can save drafts without publication controls and cannot read another user recovery', async ({ page, browser }) => {
        test.skip(!hasFixtures, 'Requires the isolated writer fixture.');
        await login(page);
        await newPost(page, `Private administrator recovery ${Date.now()}`);
        await expect(page.getByRole('status').filter({ hasText: /saved at/i })).toBeVisible();
        const drafts = await page.context().request.get('/dashboard/admin/editor-drafts');
        const { drafts: records } = await drafts.json();
        const writerContext = await browser.newContext();
        const writer = await writerContext.newPage();
        await login(writer, 'e2e-writer@example.test');
        await newPost(writer, `Writer draft ${Date.now()}`);
        await expect(writer.getByRole('button', { name: 'Publish Post', exact: true })).toHaveCount(0);
        await expect(writer.getByRole('button', { name: 'Schedule', exact: true })).toHaveCount(0);
        const forbidden = await writerContext.request.get(`/dashboard/admin/editor-drafts/${records[0].id}`);
        expect(forbidden.status()).toBe(404);
        await writer.getByRole('button', { name: 'Save Draft', exact: true }).click();
        await expect(writer).toHaveURL(/\/posts\/\d+\/edit/);
        await writerContext.close();
    });

    test('concurrent tabs show a recoverable revision conflict', async ({ page, context }) => {
        test.skip(!hasFixtures, 'Requires the isolated multi-tab fixture.');
        await login(page);
        await newPost(page, `Concurrent work ${Date.now()}`);
        await expect(page.getByRole('status').filter({ hasText: /saved at/i })).toBeVisible();
        const other = await context.newPage();
        await other.goto('/dashboard/admin/posts/create');
        await other.getByRole('button', { name: 'Restore changes', exact: true }).click();
        await page.locator('#title').fill(`First tab update ${Date.now()}`);
        await expect(page.getByRole('status').filter({ hasText: /saved at/i })).toBeVisible();
        // Wait for the changed revision, not the previous saved-status label.
        await expect
            .poll(async () => {
                const response = await context.request.get('/dashboard/admin/editor-drafts');
                return (await response.json()).drafts.some((entry: { payload: { title: string } }) =>
                    entry.payload.title.startsWith('First tab update'),
                );
            })
            .toBe(true);
        await other.locator('#title').fill('Second tab text');
        await expect(other.getByRole('alert').filter({ hasText: /another tab/i })).toBeVisible();
        await other.getByRole('button', { name: 'Restore changes', exact: true }).click();
        await expect(other.locator('#title')).toHaveValue(/First tab update/);
        await other.close();
    });

    test('translation recovery is separate and the editor works on mobile', async ({ page }) => {
        test.skip(!hasFixtures, 'Requires the isolated translation fixture.');
        await page.setViewportSize({ width: 390, height: 844 });
        await login(page);
        const englishTitle = `English recovery ${Date.now()}`;
        await newPost(page, englishTitle);
        // A previous recovery's status can still be visible while the new text is saving.
        await expect
            .poll(async () => {
                const response = await page.context().request.get('/dashboard/admin/editor-drafts');
                return (await response.json()).drafts.some((entry: { payload: { title: string } }) => entry.payload.title === englishTitle);
            })
            .toBe(true);
        const title = `Spanish recovery ${Date.now()}`;
        await newPost(page, title, 'es');
        await expect(page.getByRole('status').filter({ hasText: /saved at/i })).toBeVisible();
        await page.reload();
        await page.getByRole('button', { name: 'Restore changes', exact: true }).click();
        await expect(page.locator('#title')).toHaveValue(title);
        await expect(page.getByRole('button', { name: 'Save Draft', exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
    test('validation errors preserve input and re-enable save controls', async ({ page }) => {
        await login(page);
        const title = `Duplicate browser slug ${Date.now()}`;
        await newPost(page, title);
        await page.getByRole('button', { name: 'Save Draft', exact: true }).click();
        await expect(page).toHaveURL(/\/posts\/\d+\/edit/);
        await newPost(page, title);
        await page.getByRole('button', { name: 'Save Draft', exact: true }).click();
        await expect(page.getByRole('alert').filter({ hasText: /slug/i })).toBeVisible();
        await expect(page.locator('#title')).toHaveValue(title);
        await expect(page.getByRole('button', { name: 'Save Draft', exact: true })).toBeEnabled();
        await expect(page).toHaveURL(/\/posts\/create/);
    });

    test('scheduling uses an explicit date and keeps the item open', async ({ page }) => {
        await login(page);
        await newPost(page, `Browser schedule ${Date.now()}`);
        await page.getByRole('tab', { name: 'Advanced', exact: true }).click();
        await page.locator('#publishedAt').fill('2030-07-10T15:30');
        await page.getByRole('button', { name: 'Schedule', exact: true }).click();
        await expect(page).toHaveURL(/\/posts\/\d+\/edit/);
        await expect(page.getByRole('button', { name: 'Unpublish and save draft', exact: true })).toBeVisible();
        await page.reload();
        await page.getByRole('tab', { name: 'Advanced', exact: true }).click();
        const publishingLabel = page.locator('label[for="publishedAt"]');
        await expect(publishingLabel).toHaveText(/Publishing Date \(.+\)/);
        await expect(page.locator('#publishedAt')).toHaveValue('2030-07-10T15:30');
    });

    test('draft publish and unpublish stay open and serialize slow submissions', async ({ page }) => {
        await login(page);
        await newPost(page, `Browser workflow ${Date.now()}`);
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        let started!: () => void;
        const requestStarted = new Promise<void>((resolve) => {
            started = resolve;
        });
        let submissions = 0;
        await page.route('**/dashboard/admin/posts', async (request) => {
            if (request.request().method() === 'POST') {
                submissions++;
                started();
                await gate;
            }
            await request.continue();
        });
        const save = page.getByRole('button', { name: 'Save Draft', exact: true });
        const click = save.click();
        await requestStarted;
        await expect(save).toBeDisabled();
        await save.evaluate((button: HTMLButtonElement) => {
            button.click();
            button.click();
        });
        expect(submissions).toBe(1);
        release();
        await click;
        await expect(page).toHaveURL(/\/posts\/\d+\/edit/);
        await expect(page.getByRole('button', { name: 'Update Post', exact: true })).toBeEnabled();
        await page.getByRole('button', { name: 'Publish Post', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Unpublish and save draft', exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Unpublish and save draft', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Save Draft', exact: true })).toBeEnabled();
        const editUrl = page.url();
        await page.reload();
        await expect(page).toHaveURL(editUrl);
        await expect(page.getByRole('button', { name: 'Save Draft', exact: true })).toBeVisible();
    });

    test('new content recovers after reload and a new browser context', async ({ page, browser }) => {
        await login(page);
        const title = `Recovered browser work ${Date.now()}`;
        await newPost(page, title);
        await expect(page.getByRole('status').filter({ hasText: /saved at/i })).toBeVisible({ timeout: 15000 });
        await page.reload();
        await page.getByRole('button', { name: 'Restore changes', exact: true }).click();
        await expect(page.locator('#title')).toHaveValue(title);
        const state = await page.context().storageState();
        const restarted = await browser.newContext({ storageState: { cookies: state.cookies, origins: [] } });
        const other = await restarted.newPage();
        await other.goto('/dashboard/admin/posts/create');
        await other.getByRole('button', { name: 'Restore changes', exact: true }).click();
        await expect(other.locator('#title')).toHaveValue(title);
        const stored = await other.evaluate(() => Object.entries(localStorage).filter(([key]) => key.startsWith('modulo:editor:')));
        expect(stored.every(([, value]) => /^[0-9a-f-]{36}$/.test(value))).toBe(true);
        await restarted.close();
    });

    test('failed autosaves prevent previewing stale text', async ({ page }) => {
        await login(page);
        await newPost(page, `Preview failure ${Date.now()}`);
        await page.getByRole('button', { name: 'Save Draft', exact: true }).click();
        await expect(page).toHaveURL(/\/posts\/\d+\/edit/);
        await page.route('**/dashboard/admin/editor-drafts', async (request) => {
            if (request.request().method() === 'POST')
                await request.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Recovery temporarily unavailable' }),
                });
            else await request.continue();
        });
        await page.locator('#title').fill('Unsaved preview text');
        let previewRequests = 0;
        page.on('request', (request) => {
            if (request.url().includes('/preview-link')) previewRequests++;
        });
        page.once('dialog', (dialog) => dialog.accept());
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await expect(page.getByRole('alert').filter({ hasText: 'Recovery temporarily unavailable' })).toBeVisible();
        expect(previewRequests).toBe(0);
    });
});
