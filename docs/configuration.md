# Configuration

Everything is environment variables. `.env.prod.example` and `.env.dev.example`
are the templates; copy, do not edit in place.

## Required

| Variable | Notes |
|---|---|
| `APP_KEY` | Encrypts sessions and cookies. Unique per install, never shared between environments. The installer generates one. |
| `APP_URL` | Used for absolute URLs, the sitemap, feeds and signed links. Must match how people actually reach the site, including `https://`. |
| `DB_PASSWORD` | Production compose refuses to start without it. |

## Frequently changed

| Variable | Default | Notes |
|---|---|---|
| `WEB_PORT` | `8080` | Host port for production. The dev stack is fixed at 8000. |
| `MODULO_TAG` | `latest` | Release to run. Pin an exact version for predictable deploys. |
| `APP_DEBUG` | `false` | Never `true` in production. |
| `RUN_MIGRATIONS` | `true` (prod) | On container start, migrate a fresh database, or run the guarded `modulo:upgrade` (backup, preflight, maintenance window) when an existing one has pending migrations. Set `false` to run `modulo:upgrade` yourself. |
| `DEFAULT_THEME` | `modern-react` | Installed on first boot if no theme is active. |

## Updates and plugins

| Variable | Default | Notes |
|---|---|---|
| `MODULO_UPDATE_CHECK` | `true` | Daily check for core and plugin updates (System → Updates). |
| `MODULO_UPDATE_NOTIFY` | `true` | Email administrators once per new set of available updates. |
| `MODULO_UPDATE_PRERELEASES` | `false` | Offer release candidates as updates. |
| `MODULO_BACKUP_PATH` | `storage/app/backups` | Where full backups (`modulo:backup`) are written. |
| `MODULO_BACKUP_KEEP` | `5` | Full backups kept; older ones are deleted after each run. |
| `MODULO_BACKUP_SCHEDULE` | `true` | Take a full backup every Sunday at 03:45. |
| `MODULO_PLUGIN_REGISTRY` | the project registry | Point at your own index to run a private one. |
| `MODULO_PLUGIN_ALLOW_URL_INSTALL` | `false` | Installing from an arbitrary URL bypasses the registry checksum. |

## Build identity

`MODULO_VERSION`, `MODULO_COMMIT` and `MODULO_BUILT_AT` are set by the release
build. `MODULO_INSTALL_CHANNEL` overrides channel detection, which only matters
for an image built from a checkout that still contains `.git`. See
[versioning.md](versioning.md).

## Mail

`MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
`MAIL_FROM_ADDRESS`, `MAIL_ADMIN_ADDRESS`. The dev stack captures everything in
Mailpit at <http://localhost:8025> and sends nothing.

Nothing validates these at boot. Wrong credentials surface as password-reset
and order emails that silently never arrive, so send yourself a test.

## Caching

Production caches config, routes, views and events at container start.
**Changing an environment variable therefore requires a restart**, not just a
file edit. Locally, `php artisan optimize:clear`.

`CACHE_STORE=redis` and `SESSION_DRIVER=redis` in production; the dev stack uses
files and runs no Redis.
