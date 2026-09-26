# Architecture

A map of the code for contributors. The individual guides go deeper.

## Stack

- **Laravel 13** (PHP 8.4) serves everything; **Inertia** hands pages to **React 19**
  (TypeScript, Tailwind v4, shadcn-style components in `resources/js/components/ui`).
- **PostgreSQL** in production (Docker), **SQLite** for tests and quick local runs.
- One Docker image for the app (php-fpm), one for the web server (nginx with `public/`
  baked in), plus a queue worker and the scheduler.

## Request flow

```
nginx ─▶ php-fpm ─▶ web middleware ─▶ route ─▶ controller ─▶ Inertia page (React)
                     │
                     ├─ RedirectToInstaller   no install yet → /install
                     ├─ EnsureSchemaIsCompatible   a newer version migrated the DB → 503
                     ├─ SecurityHeaders        CSP nonce, HSTS, …
                     ├─ HandleRedirects        old URLs → new
                     └─ HandleInertiaRequests  shared props (auth, settings, badges)
```

**Admin**: `routes/admin.php` (`/dashboard/admin/*`). Nearly every screen renders the
`Dashboard` Inertia page with an `adminSection` prop; `resources/js/pages/dashboard/
DashboardContent.tsx` maps it to a section in `pages/dashboard/sections/*`.

**Public site**: `routes/web.php` ends in catch-all routes handled by
`FrontendRouterController`, which finds the content and asks `ReactTemplateRenderer` to
render the active theme's component (`resources/themes/<theme>/components/*.tsx`,
resolved by a glob in `resources/js/app.tsx`; child themes fall back to their parent).

**API**: `routes/api.php` → `/api/v1` ([api.md](api.md)).

## Where things live

| Area | Code |
|---|---|
| Content | `app/Models/Post.php` (pages are posts of type `page`), `PostObserver` (revisions, redirects, cache), `PostPresenter` (what themes get) |
| Settings | `SiteSetting` model + `SiteSettingsService` (cached) |
| Plugins | `PluginManager` (discover, activate, requirements, hooks), `Plugins/{PluginRegistry,PluginInstaller,ArchiveExtractor,PackageDownloader}` |
| Themes | `ThemeManager`, `ThemeInstaller` (registry child themes), `ReactTemplateRenderer` |
| Updates | `UpdateChecker` (GitHub + `release.json`), `UpdateCenter` (stored results, badge), `modulo:check-updates`, `modulo:upgrade`, `modulo:update` (tarball), `docker/modulo` (Docker) |
| Backups | `BackupManager`, `modulo:backup` / `modulo:restore`, `modulo:db-backup` |
| Security | `SecurityHeaders`, `Support/Totp` + `TwoFactorController`, `ActivityLog` + `Listeners/RecordActivity`, `ApiToken` |
| Schema guard | `Support/SchemaVersion` (`modulo_meta` table), `Support/Version`, `Support/InstallChannel` |
| Hooks | `HookRegistry` with `add_action`/`do_action`/`add_filter`/`apply_filters` in `app/helpers.php` |

## Background work

`routes/console.php` schedules: nightly database dump, weekly full backup, daily update
check, daily pruning (activity log, trash), and scheduled publishing every minute. In
Docker the `scheduler` container runs them; elsewhere cron must run
`php artisan schedule:run` every minute.

## Quality gates

Every pull request runs Pest on SQLite and PostgreSQL, a coverage job, upgrades from the
last three releases, Pint, Larastan (the baseline may only shrink), Prettier, ESLint
(the count of `any` may only shrink), TypeScript, Vitest with coverage thresholds, the
Playwright end-to-end suite (install wizard, admin system screens, API), and dependency
audits. Ratchet values live in `.github/quality-baseline.json` and `phpstan-baseline.neon`.
