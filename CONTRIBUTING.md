# Contributing to Modulo CMS

Thanks for taking the time. This document covers how to get a working environment,
what the quality gates are, and the few conventions that are not obvious from the code.

## Getting set up

The development stack runs in containers. You need Docker or Podman with a Compose
provider, and nothing else — no local PHP, Node or PostgreSQL.

```bash
git clone https://github.com/PhantomPixelDev/modulo-cms.git
cd modulo-cms
cp .env.dev.example .env.dev
./modulo.sh up dev
```

The dev entrypoint generates an `APP_KEY`, waits for PostgreSQL, and on a fresh
database runs migrations, seeds demo content and installs the default theme. The site
comes up on <http://localhost:8000> and Mailpit on <http://localhost:8025>.

Seeded logins are `admin@example.com` / `admin123`, `editor@example.com` / `editor123`
and `user@example.com` / `user123`. They are development fixtures — never seed them
into a production database.

`modulo.sh` picks Docker if it is on `PATH` and otherwise Podman. Set `MODULO_RUNTIME`
if you have both and want a specific one.

### Running commands

```bash
./modulo.sh artisan migrate:status
MODULO_ENV=prod ./modulo.sh artisan queue:failed
./modulo.sh shell
./modulo.sh logs
```

The environment comes from `MODULO_ENV`, not a trailing argument — everything after
`artisan` is passed through to Artisan untouched.

### If the dev stack feels slow on Windows

It is the bind mount, not the application. See [docs/performance-windows.md](docs/performance-windows.md)
for the measurements and the fix.

## Quality gates

CI runs these on every push and pull request to `dev` and `main`, and a red build
blocks a merge. Run them locally first:

```bash
./modulo.sh artisan test                       # Pest, SQLite
./vendor/bin/pint --test                       # code style
./vendor/bin/phpstan analyse --memory-limit=1G # static analysis (Larastan level 5)
npm run format:check                           # Prettier
npm run lint                                   # ESLint
npm run types                                  # tsc --noEmit
npm run test:js                                # Vitest
```

Tests also run against PostgreSQL in CI (`vendor/bin/pest -c phpunit.pgsql.xml`),
because production is PostgreSQL and several bugs have only ever reproduced there —
case-sensitive `LIKE` and full-text search among them.

`phpstan-baseline.neon` holds pre-existing findings. Do not regenerate it to silence a
new error; fix the code instead. The baseline is expected to shrink over time.

## Conventions

- **Commit messages** describe the behaviour change and why, not the diff. If a change
  is non-obvious, the reasoning belongs in the commit message where `git blame` will
  find it.
- **Every bug fix gets a test that fails without the fix.** This is the one rule we are
  strict about.
- **Migrations are append-only.** Never edit a migration that has shipped; add a new
  one. See [docs/migration-policy.md](docs/migration-policy.md).
- **Seeders must be idempotent and non-destructive.** They run on upgrades as well as
  fresh installs.

## Reporting bugs and requesting features

Use the issue templates. A bug report is far more useful with the version (shown in
the admin footer), the install channel (Docker, tarball or git), and the exact steps.

For security issues, do not open a public issue — see [SECURITY.md](SECURITY.md).
