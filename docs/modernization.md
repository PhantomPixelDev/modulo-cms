# Security and runtime upgrade guide

This guide describes the changes on `main` after 0.4.1. For a published
installation, use the files and documentation from its release tag. Test a copy
of your installation before replacing production images.

## Supported stack

| Component           | Current source                      | Installation notes                                      |
| ------------------- | ----------------------------------- | ------------------------------------------------------- |
| PHP                 | 8.4 minimum; shipped images use 8.5 | Both versions run SQLite and PostgreSQL tests           |
| Laravel             | 13.35.0                             | Remains within Laravel 13                               |
| React               | 19.3.0                              | One shared runtime for core, themes and plugins         |
| Inertia             | PHP 3.5.1 / React 3.9.1             | Update backend, frontend and plugin shims together      |
| Vite                | 8.3.4                               | React plugin 6; Rolldown chunk configuration            |
| Node.js             | 24 LTS                              | Development/build only; not needed on a deployed server |
| PostgreSQL          | 16.15                               | No database major upgrade                               |
| Redis               | 8.10.2                              | Separate persistence migration; retain the 7.4 snapshot |
| Spatie Permission   | 8.3.0                               | Existing role and permission names are retained         |
| Pest                | 5.3.1                               | Development dependency                                  |
| ESLint / TypeScript | 9 / 5.9                             | Retained until dependent tooling supports newer majors  |

Sail is no longer installed. The repository's Docker development stack remains
available. The process runner is pinned. Native build binaries are selected by
the package manager instead of manually pinning one machine's architecture.
CI builds the client, SSR and an independently bundled plugin on x64 and ARM64.

## Security behavior

- Public demos explicitly enable `MODULO_DEMO=true`. Visitors can edit content,
  products and media, but cannot administer backups, extensions, users, roles,
  API tokens, credentials, mail or payment settings. Direct requests and plugin
  routes receive the same server checks. Operators use the private CLI.
- Publishing authorization considers the resulting status **and publication
  date**, including date-only API updates. Publishing, scheduling and releasing
  scheduled content require publishing permission. Ordinary authorized edits to
  public content remain available.
- Plugin administration uses `admin.access` plus its own operation permissions.
  Required two-factor enrollment applies to privileged routes and API token
  issuance/use. Setup and recovery remain accessible; API errors are JSON.
- First setup requires a one-time token from `php artisan modulo:install-token`.
  Paste it into the wizard, never its URL. It expires after one hour, the wizard
  belongs to one session, and administrator creation is serialized. An installed
  site does not reopen setup when its database is unavailable.
- Sensitive backup and extension operations on normal installations require
  recent password confirmation. Archive extraction and downloads have limits;
  redirect destinations, paths and links are validated before use.

See [Security](security.md), [Installation](installation.md) and
[Backups](backup-restore.md) for configuration and operating procedures.

## Updating themes and plugins

Build with Node 24, run `npm ci`, and update Inertia's PHP and React packages
together. The core uses Inertia 3's JSON page bootstrap and `data-inertia` head
attributes. Keep custom Blade layouts consistent with `resources/views/app.blade.php`.
Vite 8 uses `build.rolldownOptions`; the SDK preset also accepts Vite 6/7 plugin
pipelines. Builds target ES2022.

Run `npm run build:shims`, `npm run build:ssr` and
`npm run build:plugin-fixture`. Plugins keep React, ReactDOM, Inertia and
`@modulo/ui` external and register components through the existing runtime
contract. Rebuild independently installed plugins against the shared runtime;
Shop 1.10.1 includes this build update and checkout retry protection.

SSR and the client share application providers. Core and theme pages hydrate
their server markup. Runtime-installed plugin pages are client mounted because
their modules are unavailable to the SSR process. Enable SSR explicitly when
using it; browser tests cover ordinary rendering and SSR.

Contact-form delivery is queued with retries and has a honeypot. Supervise a
queue worker when using asynchronous mail delivery. The Shop stores a checkout
retry key so repeated submissions return the same order without reserving stock
or sending its confirmation again.

## Redis 7 to 8: persistence and rollback

Do this separately from application migrations. Follow [Upgrading](upgrading.md)
for the application backup and guarded upgrade.

1. Suspend demo resets if applicable. Stop application writes, workers and the
   scheduler, then cleanly stop Redis 7 so persistence files are consistent.
2. Retain the exact Redis 7 image and copy **the whole data directory**, including
   `dump.rdb`, the multipart AOF directory and its manifest. Keep this snapshot
   immutable and outside the volume Redis 8 will write to.
3. Copy the snapshot into a separate Redis 8 volume. Start Redis 8.10.2 there;
   check cached values, sessions, TTLs, locks, queued and delayed work. Restart
   Redis 8 and repeat the checks before reopening writes.
4. Rehearse rollback by starting Redis 7 with a copy of the preserved **Redis 7
   snapshot**. Never ask Redis 7 to read files rewritten by Redis 8.
5. If application deployment fails, restore compatible code/images, database,
   content and Redis snapshots together. Once verified, resume writers.

The VPS rehearsal covered cache/session TTLs, lists, sorted sets, hashes, streams,
AOF/RDB restart persistence and rollback. PHP integration tests also exercise
sessions, scoped cache locks and a queued job failing twice before succeeding.
They run against Redis 7.4.11 and 8.10.2 on PHP 8.4 and 8.5.

## Validation and measured changes

Security fixes landed before major upgrades. Checks include SQLite/PostgreSQL
Pest, upgrades from three prior releases, Pint, PHPStan, TypeScript, check-only
ESLint/Prettier, Vitest, browser tests, documentation links, production/SSR builds
and independent plugin builds. Release packages also require runtime/security
checks. Semgrep scans PHP/TypeScript; Trivy retains complete container reports
and rejects fixable high/critical findings.

Measured PHP line coverage is **70.72%**, recorded as a **70.7%** baseline rounded
down. Reproduce it from a Clover report with
`php scripts/measure-coverage.php storage/coverage-final.xml`.
The JavaScript suite contains 102 tests; measured line coverage is 81.93%.

The cold dashboard's static JavaScript dependency graph decreased from 451,349
to 284,761 gzip bytes, **36.9% smaller**. Other admin sections load when opened.
These are build-size measurements, not request latency; use
`node scripts/measure-admin-bundle.mjs` with each build to compare.

Composer/npm audits report no known advisories. The patched nginx image has no
high/critical findings in the measured scan. The PHP image still has 64 unfixed
high/critical distribution findings; full reports are retained rather than
ignored. SVG input now rejects DTD/entity declarations and unsupported encodings
before libxml parsing, mitigating its exposed parsing path while awaiting
distribution fixes. See [Security](security.md) for the upstream advisory and
limitations. A passing scan gate does not mean OS packages have no advisories.
