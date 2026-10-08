# Modulo CMS

[![tests](https://github.com/PhantomPixelDev/modulo-cms/actions/workflows/tests.yml/badge.svg)](https://github.com/PhantomPixelDev/modulo-cms/actions/workflows/tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

![Modulo CMS: the public site and the admin dashboard](docs/screenshots/hero.png)

**Modulo is a free, self-hosted content management system — your own website platform that runs on your server, with no monthly fees and no vendor lock-in.** Write pages and blog posts, translate them into multiple languages, sell products with the shop plugin, and manage everything from a modern admin dashboard.

No programming needed to _use_ it. You only need to run one install command (see below) — or ask a technical friend; it takes about 10 minutes.

**[Read the documentation](docs/index.md)** — start with [getting started](docs/getting-started.md), the [editor guide](docs/editor-guide.md), or the [shop guide](docs/shop.md).

## What you can do with it

- **Publish content** — pages, blog posts, menus and an image library, with drafts and scheduled publishing.
- **Multiple languages** — translate any post, page or menu item (English and Spanish included in the demo).
- **Users & permissions** — admin, editor and reader roles out of the box; decide exactly who may publish.
- **Online shop** — install the shop plugin for products, cart, checkout and payments (Stripe, PayPal, Mollie).
- **Contact forms** — install the contact-form plugin, drop in a shortcode, get emails.
- **Automatic safety** — nightly backups, one-click updates, and a health check that keeps the site running.
- **Your design** — switch themes, or keep the clean default.

## Try the demo first

No install needed — open [the live demo](https://dev-modulo.ppxl.dev/), then log in with a public demo account:

| Role                    | Email                | Password    |
| ----------------------- | -------------------- | ----------- |
| Admin (everything)      | `admin@example.com`  | `admin123`  |
| Editor (writes content) | `editor@example.com` | `editor123` |
| Reader                  | `user@example.com`   | `user123`   |

The demo restores clean content every four hours, including uploads and recovery drafts. Use your own installation for work you want to keep.

## Install it (about 10 minutes)

You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed — that is the only prerequisite. Everything else (database, web server, mail catcher) comes bundled.

**Option A — automatic install (recommended)**

On Mac or Linux, open a terminal and run:

```bash
curl -fsSLO https://raw.githubusercontent.com/PhantomPixelDev/modulo-cms/main/install.sh
bash install.sh
```

On Windows, download [install.ps1](https://github.com/PhantomPixelDev/modulo-cms/raw/main/install.ps1), right-click it and choose _Run with PowerShell_.

The installer checks your system, sets everything up, and prints a web address. Open it in your browser and a **setup wizard** walks you through creating your administrator account and naming your site. Done — that is your CMS.

**Option B — for developers**

```bash
git clone https://github.com/PhantomPixelDev/modulo-cms.git
cd modulo-cms
cp .env.dev.example .env.dev
./modulo.sh up dev
```

Then open <http://localhost:8000> (dashboard at `/dashboard`, test emails at <http://localhost:8025>). On Windows use Git Bash or WSL.

## Screenshots

| Public site                                            | Admin dashboard                                          |
| ------------------------------------------------------ | -------------------------------------------------------- |
| ![Public site](docs/screenshots/site-home.png)         | ![Admin dashboard](docs/screenshots/admin-dashboard.png) |
| Post editor with translations                          | Plugin management                                        |
| ![Post editor](docs/screenshots/admin-editor.png)      | ![Plugins](docs/screenshots/admin-plugins.png)           |
| First-run setup wizard                                 |                                                          |
| ![Install wizard](docs/screenshots/install-wizard.png) |                                                          |

## Keeping it running

- **Updates:** open _Settings → Updates_ in the admin panel — it tells you when a new version exists and installs it with one click (a backup is taken first, automatically).
- **Backups:** the scheduler creates nightly database dumps and weekly full backups. _Settings → Backups_ lists full backups for download and restore; see the [backup guide](docs/backup-restore.md).
- **Plugins:** _Extensions → Plugins → Browse registry_ — the [Shop](https://github.com/PhantomPixelDev/modulo-plugin-shop), [Contact Form](https://github.com/PhantomPixelDev/modulo-plugin-contact-form) and more install in one click. Every package is checksum-verified before installing.

## Learn more

[Browse all documentation](docs/index.md), including configuration, APIs, architecture, and release guides.

|                                            |                                                  |
| ------------------------------------------ | ------------------------------------------------ |
| [Getting started](docs/getting-started.md) | First login, navigation, and your first page     |
| [Installation](docs/installation.md)       | Detailed setup options                           |
| [Editor guide](docs/editor-guide.md)       | Writing posts, pages and translations            |
| [Draft recovery](docs/editing.md)          | Saving, scheduling, recovery, and previews       |
| [Shop guide](docs/shop.md)                 | Products, checkout, payments, and orders         |
| [Troubleshooting](docs/troubleshooting.md) | Common errors and service diagnostics            |
| [Upgrading](docs/upgrading.md)             | Versions, preflight checks, per-channel commands |
| [Backups](docs/backup-restore.md)          | What is saved, and how to test a restore         |
| [Security](docs/security.md)               | Hardening checklist                              |
| [Plugins](docs/plugins.md)                 | Installing plugins and writing your own          |
| [Themes](docs/theme-development.md)        | Changing the design                              |
| [Contributing](CONTRIBUTING.md)            | Development setup and quality gates              |

Built with PHP 8.4 · Laravel 13 · React 19 · PostgreSQL 16 · Redis 7. MIT licensed — see [LICENSE](LICENSE).
