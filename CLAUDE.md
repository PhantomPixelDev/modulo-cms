# Working on Modulo CMS

Guidance for contributors and coding agents. The architecture is described in
`docs/architecture.md`.

## Commands

```bash
composer install && npm ci
php artisan test                 # Pest (SQLite in memory); --parallel is flaky for maintenance-mode tests
vendor/bin/pint                  # PHP style (CI runs --test)
vendor/bin/phpstan analyse --memory-limit=2G   # Larastan; never grow phpstan-baseline.neon
npm run types && npm run lint && npm run format:check
npm run test:js                  # Vitest
npx playwright test              # e2e against a running app (see .github/workflows/e2e.yml)
npm run docs:dev                 # documentation site
```

## Conventions

- Match the surrounding code; comments explain *why*, briefly.
- Admin screens are sections of the `Dashboard` Inertia page (see
  `resources/js/pages/dashboard/DashboardContent.tsx`); add a section rather than a page.
- Use the design tokens (`bg-background`, `text-muted-foreground`, `bg-primary`, …), never
  raw colours; UI primitives are in `resources/js/components/ui`.
- Server messages go through `back()->with('success'|'error'|'warning', …)`; the admin
  shows them as toasts.
- New user-facing behaviour gets a Pest test; new admin screens get an e2e check if they
  are central.
- Record security-relevant actions with `App\Support\ActivityLog::record()`.
- `plugins/*` are copies of the plugin repositories (`PhantomPixelDev/modulo-plugin-*`), which the registry
  installs from. Change the plugin repository, tag the release, then copy it here; CI
  (`scripts/check-bundled-plugins.sh`) fails when a bundled plugin differs from its tagged release. Bump
  the plugin version for every change, or `plugin:sync-bundled` won't deliver it to existing sites.
- No new PHP packages without a good reason: 2FA, API tokens and the activity log are
  deliberately in-house.
- Migrations only run forwards in production; make them safe on PostgreSQL and SQLite
  (`docs/migration-policy.md`).
- Commit messages follow Conventional Commits (release-please builds the changelog);
  `fix(security):` marks a security release, `!`/`BREAKING CHANGE:` a breaking one.
