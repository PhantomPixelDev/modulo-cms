import { expect, test } from '@playwright/test';

// Run after the install/editor suite, against freshly seeded disposable data.
test.skip(process.env.MODULO_E2E_DEMO !== '1', 'Requires the compact demo fixtures');

test('search results navigate to real pages, articles and announcements', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    for (const [query, title, path] of [
        ['About', 'About', '/about'],
        ['Getting Started', 'Getting Started with Modulo CMS', '/posts/getting-started-with-modulo-cms'],
        ['Upcoming Webinar', 'Upcoming Webinar: Getting Started with Modulo', '/infos/upcoming-webinar-getting-started-with-modulo'],
    ]) {
        await page.goto(`/search?q=${encodeURIComponent(query)}`);
        const link = page.locator('main').getByRole('link', { name: title, exact: true });
        await expect(link).toHaveAttribute('href', path);
        await link.click();
        await expect(page).toHaveURL(new RegExp(`${path}$`));
        await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
        expect(await page.title()).not.toMatch(/404|not found/i);
        await page.reload();
        await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
    }
    expect(errors).toEqual([]);
});

test('all compact demo navigation and sitemap/feed entries are reachable', async ({ page, request }) => {
    const paths = new Set<string>();
    for (const path of [
        '/',
        '/posts',
        '/infos',
        '/about',
        '/contact',
        '/privacy',
        '/terms',
        '/modules',
        '/es/acerca',
        '/es/posts/primeros-pasos-con-modulo-cms',
    ]) {
        const response = await page.goto(path);
        expect(response?.status(), path).toBe(200);
        await expect(page.locator('main')).toBeVisible();
        const links = await page.locator('a[href]').evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href));
        for (const href of links) {
            const target = new URL(href);
            if (target.origin === new URL(page.url()).origin && !/\/(dashboard|login|logout|register|settings)(\/|$)/.test(target.pathname)) {
                paths.add(target.pathname + target.search);
            }
        }
    }
    for (const path of ['/sitemap.xml', '/feed']) {
        const response = await request.get(path);
        expect(response.status()).toBe(200);
        const xml = await response.text();
        for (const match of xml.matchAll(/<(?:loc|link)>(https?:\/\/[^<]+)<\/(?:loc|link)>/g)) {
            const target = new URL(match[1].replaceAll('&amp;', '&'));
            paths.add(target.pathname + target.search);
        }
    }
    for (const path of paths) {
        const response = await request.get(path);
        expect(response.status(), path).toBeLessThan(400);
    }
    for (const path of ['/posts/unfinished-demo-draft', '/posts/scheduled-demo-article']) {
        expect((await request.get(path)).status(), path).toBe(404);
    }
});

test('seeded partials stay interactive on desktop and mobile', async ({ page }) => {
    await page.goto('/es/acerca');
    await expect(page.getByRole('heading', { name: 'Acerca de', exact: true })).toBeVisible();
    await page.goto('/search?q=Primeros&lang=es');
    await page.getByRole('link', { name: 'Primeros pasos con Modulo CMS', exact: true }).click();
    await expect(page).toHaveURL(/\/es\/posts\/primeros-pasos-con-modulo-cms$/);
    await expect(page.getByRole('heading', { name: 'Primeros pasos con Modulo CMS', exact: true })).toBeVisible();
    for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/modules');
        await expect(page.getByRole('heading', { name: 'Reusable content', exact: true })).toBeVisible();
        await page.getByText('How does it work?', { exact: true }).click();
        await expect(page.getByText('Pick a partial, set its fields, and insert it in a page or post.', { exact: true }).last()).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.goto('/posts/react-theme-partials');
        await expect(page.getByRole('heading', { name: 'From the theme', exact: true })).toBeVisible();
        await page.getByText('Read more', { exact: true }).click();
        await expect(page.getByText('Nested modules also work.', { exact: true }).last()).toBeVisible();
    }
});
