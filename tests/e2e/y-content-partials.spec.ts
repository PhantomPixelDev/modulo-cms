import { expect, test } from '@playwright/test';

for (const section of ['posts', 'pages']) {
    test(`theme modules publish from the ${section} editor and remain interactive`, async ({ page, browser }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('/login');
        await page.getByLabel('Email').fill(process.env.MODULO_E2E_EMAIL ?? 'e2e-admin@example.test');
        await page.getByLabel('Password').fill(process.env.MODULO_E2E_PASSWORD ?? 'a-sufficiently-long-password');
        await page.getByRole('button', { name: /log in|sign in/i }).click();
        await expect(page).toHaveURL(/\/dashboard/);
        // The bare wizard installation deliberately has no active theme.
        // Install/activate the bundled theme through the same UI an owner uses.
        await page.goto('/dashboard/admin/themes');
        await expect(page.getByRole('heading', { name: 'Active Theme', exact: true })).toBeVisible();
        const noTheme = page.getByText('No active theme', { exact: true });
        if (await noTheme.isVisible()) {
            const activate = page.getByRole('button', { name: 'Activate', exact: true });
            if (!(await activate.count())) {
                await page.getByRole('button', { name: 'Discover & Install All', exact: true }).click();
            }
            await activate.first().click();
            await expect(noTheme).toHaveCount(0);
        }
        const loaded = page.waitForResponse(
            (response) => response.url().includes('/dashboard/admin/editor-drafts') && response.request().method() === 'GET',
        );
        await page.goto(`/dashboard/admin/${section}/create`);
        await loaded;
        const discard = page.getByRole('button', { name: 'Discard', exact: true });
        if (await discard.isVisible()) {
            await discard.click();
            await expect(discard).toHaveCount(0);
        }
        const slug = `react-partials-${section}-${Date.now()}`;
        await page.locator('#title').fill(slug);
        await page
            .getByRole('textbox', { name: 'Content', exact: true })
            .fill(
                '[partial name="callout" title="From the theme" tone="success"]Fallback introduction[partial name="disclosure" title="Read more"]Hidden details[/partial][/partial]',
            );
        await page.locator('button[name="editor_action"][value="publish"]').click();
        await expect(page).toHaveURL(new RegExp(`/${section}/\\d+/edit`));
        const publicPath = `${section === 'posts' ? '/posts' : ''}/${slug}`;
        // Exercise an autosaved editor preview after the newly saved item loads.
        await page
            .getByRole('textbox', { name: 'Content', exact: true })
            .fill(
                '[partial name="callout" title="From the theme" tone="success"]Fallback introduction[partial name="disclosure" title="Read more"]Hidden details[/partial][/partial] Preview revision',
            );
        await expect(page.getByRole('status').filter({ hasText: /saved at/i })).toBeVisible();
        const popup = page.waitForEvent('popup');
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        const preview = await popup;
        await expect(preview.getByRole('heading', { name: 'From the theme', exact: true })).toBeVisible();
        await expect(preview.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
        await preview.close();
        await page.goto(publicPath);
        await expect(page.getByRole('heading', { name: 'From the theme', exact: true })).toBeVisible();
        const summary = page.locator('summary').filter({ hasText: 'Read more' });
        await expect(summary).toHaveCount(1);
        await expect(page.getByText('Hidden details', { exact: true }).last()).not.toBeVisible();
        await summary.focus();
        await page.keyboard.press('Enter');
        await expect(page.getByText('Hidden details', { exact: true }).last()).toBeVisible();
        await page.reload();
        await expect(page.locator('summary')).toHaveCount(1);
        const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
        const mobile = await mobileContext.newPage();
        await mobile.goto(publicPath);
        await mobile.locator('summary').tap();
        await expect(mobile.getByText('Hidden details', { exact: true }).last()).toBeVisible();
        expect(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await mobileContext.close();
        const noJsContext = await browser.newContext({ javaScriptEnabled: false });
        const noJs = await noJsContext.newPage();
        await noJs.goto(publicPath);
        // Body text is retained in server props; SSR-less installations still
        // use the existing app shell. The React fallback is unit-tested separately.
        expect(await noJs.content()).toContain('Fallback introduction');
        await noJsContext.close();
        expect(errors).toEqual([]);
    });
}
