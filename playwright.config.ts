import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against a running stack.
 *
 * Scoped deliberately narrowly: the install wizard and the public site. The
 * wizard is the highest-stakes surface in the application -- it creates an
 * administrator without authentication and then has to close itself -- and it
 * is the one thing a unit test cannot really verify, because the failure modes
 * are in the browser.
 */
export default defineConfig({
    testDir: './tests/e2e',
    // A wizard step runs migrations, which is slow on a cold database.
    timeout: 120_000,
    expect: { timeout: 15_000 },
    fullyParallel: false,
    // These share one database; running them at once would be a race.
    workers: 1,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['list']] : [['list']],
    use: {
        baseURL: process.env.MODULO_E2E_URL ?? 'http://127.0.0.1:8000',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
