# Modulo CMS documentation

Modulo is a self-hosted CMS for pages, posts, translations, and online shops. These guides cover using a site, running it, and extending it. They describe the current code on `main`; use the documentation in your release tag for older installations.

## Start here

- [Getting started](getting-started.md): try the demo, install Modulo, and publish your first page.
- [Editor guide](editor-guide.md): write content, upload images, manage menus, and translate pages.
- [Saving and recovering work](editing.md): drafts, publishing, scheduling, recovery, and previews.
- [Shop guide](shop.md): products, checkout, payments, and orders.
- [Troubleshooting](troubleshooting.md): saving, preview, email, and background-service problems.

## Run a site

| Guide                                            | What it covers                                              |
| ------------------------------------------------ | ----------------------------------------------------------- |
| [Installation](installation.md)                  | Docker, automatic installers, and bare-metal setup          |
| [Configuration](configuration.md)                | Environment variables, demo mode, email, and caching        |
| [Working with content](content.md)               | Revisions, custom fields, redirects, SEO, and trash         |
| [Demo fixtures and testing](demo-testing.md)     | Compact demo data, guarded replacement and browser checks   |
| [Upgrading](upgrading.md)                        | Preflight checks and commands for each installation channel |
| [Backups and restoring](backup-restore.md)       | Scheduled backups, restores, and off-site copies            |
| [Security](security.md)                          | Permissions, authentication, and server configuration       |
| [Performance on Windows](performance-windows.md) | Development setup and filesystem performance                |

## Extend or contribute

| Guide                                                                                   | What it covers                                     |
| --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [Plugins](plugins.md)                                                                   | Installation, structure, and lifecycle             |
| [Plugin front ends](plugin-frontend.md)                                                 | Admin components and public templates              |
| [Hooks](hooks.md)                                                                       | Actions and filters                                |
| [Themes](theme-development.md)                                                          | Components, settings, and translations             |
| [React content partials](theme-partials.md)                                             | Reusable modules inserted with shortcodes          |
| [Headless API](api.md)                                                                  | Reading published content from another application |
| [Architecture](architecture.md)                                                         | Application structure                              |
| [Database architecture](database-architecture.md)                                       | Content models and relationships                   |
| [Migration policy](migration-policy.md)                                                 | Forward upgrades and data compatibility            |
| [Versioning](versioning.md)                                                             | Release identity and installation channels         |
| [Releasing](releasing.md)                                                               | Release automation and validation                  |
| [Contributing](https://github.com/PhantomPixelDev/modulo-cms/blob/main/CONTRIBUTING.md) | Development setup and required checks              |

## Read these guides locally

Every guide is a Markdown file readable on GitHub or in a text editor. For a searchable documentation site, run these commands in a source checkout:

```bash
npm ci
npm run docs:dev
```

Open the address printed by VitePress. `npm run docs:build` builds the documentation and checks internal links.

Found an error or need help? [Open an issue](https://github.com/PhantomPixelDev/modulo-cms/issues), including your version, installation method, and steps to reproduce the problem.
