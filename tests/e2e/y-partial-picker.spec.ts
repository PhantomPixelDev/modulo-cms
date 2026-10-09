import { expect, test } from '@playwright/test';

for (const section of ['posts', 'pages']) {
    test(`partial picker preserves ${section} content through editing, preview and reload`, async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('/login');
        await page.getByLabel('Email').fill(process.env.MODULO_E2E_EMAIL ?? 'e2e-admin@example.test');
        await page.getByLabel('Password').fill(process.env.MODULO_E2E_PASSWORD ?? 'a-sufficiently-long-password');
        await page.getByRole('button', { name: /log in|sign in/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
        await page.goto('/dashboard/admin/themes');
        const noTheme = page.getByText('No active theme', { exact: true });
        if (await noTheme.isVisible()) {
            const activate = page.getByRole('button', { name: 'Activate', exact: true });
            if (!(await activate.count())) await page.getByRole('button', { name: 'Discover & Install All', exact: true }).click();
            await activate.first().click();
            await expect(noTheme).toHaveCount(0);
        }
        await page.goto(`/dashboard/admin/${section}/create`);
        await expect(page.getByRole('textbox', { name: 'Content', exact: true })).toBeVisible();
        const discard = page.getByRole('button', { name: 'Discard', exact: true });
        if (await discard.isVisible()) await discard.click();
        const slug = `picker-${section}-${Date.now()}`;
        await page.locator('#title').fill(slug);
        const content = page.getByRole('textbox', { name: 'Content', exact: true });
        await content.fill('Before & after');
        await content.press('End');
        await page.getByRole('button', { name: 'Insert partial', exact: true }).click();
        let dialog = page.getByRole('dialog');
        await dialog.getByRole('button', { name: 'Callout', exact: true }).click();
        const title = 'He said "hello" & <goodbye>';
        await dialog.getByLabel('Title', { exact: true }).fill(title);
        await dialog.getByLabel('Tone').selectOption('success');
        await dialog.getByRole('textbox', { name: 'Content', exact: true }).fill('Module body');

        // A preview failure must leave the form intact and allow retrying.
        await page.route('**/dashboard/admin/partials/preview', (route) =>
            route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
        );
        await dialog.getByRole('button', { name: 'Preview module', exact: true }).click();
        await expect(dialog.getByRole('alert')).toBeVisible();
        await expect(dialog.getByLabel('Title', { exact: true })).toHaveValue(title);
        await page.unroute('**/dashboard/admin/partials/preview');
        await dialog.getByRole('button', { name: 'Preview module', exact: true }).click();
        const preview = dialog.frameLocator('iframe');
        await expect(preview.getByRole('heading', { name: title, exact: true })).toBeVisible();
        await dialog.getByRole('button', { name: 'Insert partial', exact: true }).click();
        const block = page.locator('[data-partial-name="callout"]');
        await expect(block).toHaveCount(1);
        await expect(content).toContainText('Before & after');
        await content.press('ControlOrMeta+z');
        await expect(block).toHaveCount(0);
        await content.press('ControlOrMeta+Shift+z');
        await expect(block).toHaveCount(1);
        await page.locator('button[name="editor_action"][value="publish"]').click();
        await expect(page).toHaveURL(new RegExp(`/${section}/\\d+/edit`));
        await page.reload();
        await expect(block).toHaveCount(1);
        await block.getByRole('button', { name: 'Edit partial', exact: true }).click();
        dialog = page.getByRole('dialog');
        await expect(dialog.getByLabel('Title', { exact: true })).toHaveValue(title);
        await expect(dialog.getByLabel('Tone')).toHaveValue('success');
        await expect(dialog.getByRole('textbox', { name: 'Content', exact: true })).toContainText('Module body');
        await dialog.getByLabel('Title', { exact: true }).fill('Updated module');
        await dialog.getByRole('button', { name: 'Apply changes', exact: true }).click();
        // Source-mode round trips retain the editable module and surrounding text.
        await page.getByRole('button', { name: 'Show HTML', exact: true }).click();
        await page.locator('textarea').first().click();
        await page.getByRole('button', { name: 'Editor', exact: true }).click();
        await expect(block).toHaveCount(1);
        await page.getByRole('button', { name: 'Show Markdown', exact: true }).click();
        await page.locator('textarea').first().click();
        await page.getByRole('button', { name: 'Editor', exact: true }).click();
        await expect(block).toHaveCount(1);
        const saved = page.waitForResponse(
            (response) =>
                response.url().match(new RegExp(`/admin/${section}/\\d+$`)) !== null &&
                ['POST', 'PUT', 'PATCH'].includes(response.request().method()),
        );
        await page.locator('button[name="editor_action"][value="update"]').click();
        expect((await saved).status()).toBeLessThan(400);
        await expect(page.locator('button[name="editor_action"][value="update"]')).toBeEnabled();
        await page.goto(`${section === 'posts' ? '/posts' : ''}/${slug}`);
        await expect(page.getByRole('heading', { name: 'Updated module', exact: true })).toBeVisible();
        await expect(page.getByText('Module body', { exact: true }).last()).toBeVisible();
        await expect(page.getByText('Before & after', { exact: true })).toBeVisible();
        expect(errors).toEqual([]);
    });
}

test('partial catalog previews fit mobile and expose typed boolean controls', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.MODULO_E2E_EMAIL ?? 'e2e-admin@example.test');
    await page.getByLabel('Password').fill(process.env.MODULO_E2E_PASSWORD ?? 'a-sufficiently-long-password');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard/admin/partials');
    await page.getByRole('button', { name: 'Configure and preview', exact: true }).last().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByLabel('Start expanded')).toBeVisible();
    await dialog.getByLabel('Start expanded').check();
    await dialog.getByRole('button', { name: 'Preview module', exact: true }).click();
    await expect(dialog.frameLocator('iframe').locator('details')).toHaveAttribute('open', '');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
