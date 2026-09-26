import { defineConfig } from 'vitepress';

// The documentation site: `npm run docs:dev` locally, built in CI (dead links
// fail the build) and published to GitHub Pages when DOCS_PAGES is enabled.
export default defineConfig({
    title: 'Modulo CMS',
    description: 'Documentation for Modulo CMS',
    base: process.env.DOCS_BASE ?? '/',
    cleanUrls: true,
    lastUpdated: true,
    // Links out of docs/ (README, source files) are for readers on GitHub.
    ignoreDeadLinks: [/(^|\/)\.\.\//, /localhost/],
    themeConfig: {
        nav: [
            { text: 'Guide', link: '/installation' },
            { text: 'Extending', link: '/plugins' },
            { text: 'API', link: '/api' },
            { text: 'GitHub', link: 'https://github.com/PhantomPixelDev/modulo-cms' },
        ],
        sidebar: [
            {
                text: 'Running a site',
                items: [
                    { text: 'Installation', link: '/installation' },
                    { text: 'Configuration', link: '/configuration' },
                    { text: 'Upgrading', link: '/upgrading' },
                    { text: 'Backups and restoring', link: '/backup-restore' },
                    { text: 'Security', link: '/security' },
                    { text: 'Performance on Windows', link: '/performance-windows' },
                ],
            },
            {
                text: 'Content',
                items: [
                    { text: 'Guide for editors', link: '/editor-guide' },
                    { text: 'Working with content', link: '/content' },
                ],
            },
            {
                text: 'Extending',
                items: [
                    { text: 'Plugins', link: '/plugins' },
                    { text: 'Plugin front ends', link: '/plugin-frontend' },
                    { text: 'Hooks', link: '/hooks' },
                    { text: 'Themes', link: '/theme-development' },
                    { text: 'Headless API', link: '/api' },
                ],
            },
            {
                text: 'Project',
                items: [
                    { text: 'Architecture', link: '/architecture' },
                    { text: 'Database', link: '/database-architecture' },
                    { text: 'Migration policy', link: '/migration-policy' },
                    { text: 'Versioning', link: '/versioning' },
                    { text: 'Releasing', link: '/releasing' },
                ],
            },
        ],
        search: { provider: 'local' },
        editLink: {
            pattern: 'https://github.com/PhantomPixelDev/modulo-cms/edit/main/docs/:path',
        },
        socialLinks: [{ icon: 'github', link: 'https://github.com/PhantomPixelDev/modulo-cms' }],
    },
});
