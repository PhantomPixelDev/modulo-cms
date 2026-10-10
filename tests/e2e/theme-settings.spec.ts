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

test('branding uses media images, updates public header/footer and cache clearing preserves unsaved input', async ({ page }) => {
    await page.goto('/login?lang=en');
    await page.getByLabel('Email address').fill('admin@example.com');
    await page.getByLabel('Password', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/dashboard/admin/theme-settings?lang=en');
    await expect(page.locator('#theme-logo_text')).toBeVisible();
    const url = new URL(page.url());
    const endpoint = `${url.origin}${url.pathname}`;
    try {
        await page.locator('#theme-logo_icon').selectOption('leaf');
        await expect(page.locator('#theme-logo_style')).toHaveValue('icon');
        await expect(page.getByTestId('theme-preview-header').locator('.lucide-leaf')).toBeVisible();
        await page.locator('#theme-logo_text').fill('Studio branding test');
        await page.locator('#theme-logo_height').fill('48');
        await page.getByRole('button', { name: 'Choose from media', exact: true }).first().click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        const demoFolder = dialog.getByLabel('Media folder').locator('option', { hasText: /demo/i });
        await expect(demoFolder).toHaveCount(1);
        await dialog.getByLabel('Media folder').selectOption((await demoFolder.getAttribute('value'))!);
        await dialog
            .getByRole('button', { name: /^Select: / })
            .first()
            .click({ timeout: 15000 });
        await expect(dialog).not.toBeVisible();
        const image = await page.locator('#theme-logo_image').inputValue();
        expect(image).toBeTruthy();
        await expect(page.locator('#theme-logo_style')).toHaveValue('image');
        await expect(page.getByTestId('theme-preview-header').getByTestId('theme-brand')).toContainText('Studio branding test');
        await page.locator('#theme-header_sticky').uncheck();
        await page.locator('#theme-footer_text').fill('Studio © {year}');
        await page.locator('#theme-footer_powered_by').uncheck();
        await page.getByRole('button', { name: 'Save settings', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Save settings', exact: true })).toBeDisabled();
        await page.reload();
        await expect(page.locator('#theme-logo_text')).toHaveValue('Studio branding test');
        const publicPage = await page.context().newPage();
        await publicPage.goto('/?lang=en');
        await expect(publicPage.locator('header').getByTestId('theme-brand')).toContainText('Studio branding test');
        await expect(publicPage.locator('header').getByTestId('theme-brand').locator('img')).toHaveAttribute('src', image);
        await expect
            .poll(() =>
                publicPage
                    .locator('header')
                    .getByTestId('theme-brand')
                    .locator('img')
                    .evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
            )
            .toBe(true);
        await expect(publicPage.locator('header').first()).toHaveCSS('position', 'static');
        await expect(publicPage.locator('footer')).toContainText(`Studio © ${new Date().getFullYear()}`);
        await expect(publicPage.locator('footer')).not.toContainText('Powered by Modulo CMS');
        await publicPage.close();
        await page.locator('#theme-logo_text').fill('Unsaved branding');
        await page.getByRole('button', { name: 'Clear website cache', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Clear website cache', exact: true })).toBeEnabled();
        await expect(page.locator('#theme-logo_text')).toHaveValue('Unsaved branding');
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
});

test('icon choices replace the initial in admin and public pages and layout controls change the visible theme', async ({ page, browser }) => {
    await page.goto('/login?lang=en');
    await page.getByLabel('Email address').fill('admin@example.com');
    await page.getByLabel('Password', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/dashboard/admin/theme-settings?lang=en');
    const endpoint = `${new URL(page.url()).origin}${new URL(page.url()).pathname}`;
    try {
        await page.locator('#theme-logo_style').selectOption('auto');
        await page.locator('#theme-logo_icon').selectOption('layers');
        await expect(page.getByTestId('theme-preview-header').locator('.lucide-layers')).toBeVisible();
        await page.locator('#theme-logo_icon').selectOption('globe');
        await page.locator('#theme-logo_text').fill('Globe studio');
        await page.locator('#theme-logo_height').fill('64');
        await page.locator('#theme-logo_text_size').fill('24');
        await page.locator('#theme-header_density').selectOption('roomy');
        await page.locator('#theme-header_theme_toggle').uncheck();
        await page.locator('#theme-footer_show_brand').uncheck();
        await page.locator('#theme-footer_show_tagline').uncheck();
        await page.locator('#theme-footer_powered_by').uncheck();
        await page.locator('#theme-footer_text').fill('{site} / {year}');
        await page.locator('#theme-font_family').selectOption('mono');
        await page.locator('#theme-container_width').selectOption('compact');
        await page.locator('#theme-corner_style').selectOption('square');
        await expect(page.getByTestId('theme-preview-footer').getByTestId('theme-brand')).toHaveCount(0);
        await expect(page.getByTestId('theme-preview-header').locator('.lucide-globe')).toBeVisible();
        await page.getByRole('button', { name: 'Save settings', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Save settings', exact: true })).toBeDisabled();
        await expect(page.locator('[data-sidebar="header"]').locator('.lucide-globe')).toBeVisible();
        await page.reload();
        await expect(page.locator('[data-sidebar="header"]').getByTestId('theme-brand')).toContainText('Globe studio');
        const publicPage = await browser.newPage();
        await publicPage.goto('/?lang=en');
        await expect(publicPage.getByTestId('theme-brand').first()).toBeVisible();
        const paths = ['/', '/posts', '/login'];
        if (await publicPage.locator('header a[href^="/shop"]').count()) paths.push('/shop/field-notebook-a5');
        for (const path of paths) {
            await publicPage.goto(`${path}?lang=en`);
            await expect(publicPage.getByTestId('theme-brand').first().locator('.lucide-globe')).toBeVisible();
            await expect(publicPage.getByTestId('theme-brand').first()).toContainText('Globe studio');
        }
        await publicPage.goto('/?lang=en');
        await expect(publicPage.locator('header [data-brand-kind="icon"]')).toHaveCSS('height', '64px');
        await expect(publicPage.locator('header').getByTestId('theme-brand').locator('span').last()).toHaveCSS('font-size', '24px');
        await expect(publicPage.locator('footer').getByTestId('theme-brand')).toHaveCount(0);
        await expect(publicPage.getByRole('button', { name: 'Toggle color theme', exact: true })).toHaveCount(0);
        await expect(publicPage.locator('footer a[href="https://github.com/PhantomPixelDev/modulo-cms"]')).toHaveCount(0);
        await expect(publicPage.locator('footer')).toContainText(String(new Date().getFullYear()));
        await expect(publicPage.locator('.theme-frontend').first()).toHaveCSS('--theme-container-width', '64rem');
        await expect(publicPage.locator('.theme-frontend').first()).toHaveCSS('--radius', '0px');
        await publicPage.setViewportSize({ width: 390, height: 844 });
        expect(await publicPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await publicPage.close();
    } finally {
        const cookie = (await page.context().cookies()).find((entry) => entry.name === 'XSRF-TOKEN');
        expect(cookie).toBeDefined();
        const reset = await page.request.delete(endpoint, {
            maxRedirects: 0,
            headers: { Accept: 'application/json', 'X-XSRF-TOKEN': decodeURIComponent(cookie!.value) },
        });
        expect(reset.status()).toBe(302);
    }
});
