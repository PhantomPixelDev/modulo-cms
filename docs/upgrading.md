# Upgrading

## Before anything else

Take a backup you have actually restored at least once. `modulo:upgrade` takes one
automatically, but a backup nobody has tested is a hope, not a plan.

```bash
MODULO_ENV=prod ./modulo.sh artisan modulo:db-backup
```

## See what would happen

```bash
MODULO_ENV=prod ./modulo.sh artisan modulo:upgrade --dry-run
```

This lists the pending migrations, runs the preflight checks, and changes nothing.
Run it before every upgrade — the checks exist because some of these migrations
cannot be made safe by retrying.

### What the preflight catches

**Orphaned parent references.** `align_parent_ids_to_bigint` converts
`posts.parent_id` and `taxonomy_terms.parent_id` to BIGINT and then adds
self-referencing foreign keys, with no cleanup step. A row pointing at an id that no
longer exists makes `ADD CONSTRAINT` fail *after* the column type has already been
rewritten, leaving a schema that matches neither version: the column converted, the
constraint absent, and the migration unrecorded so it will be retried.

The check finds those rows first and names their ids:

```
x Orphaned parent references would fail the migration
  posts: ids 41, 77 -- set these rows' parent_id to NULL, or point them at a row
  that exists, then run the upgrade again.
```

Fix them, then run the upgrade again. `--force` overrides the check, which is almost
never what you want.

**Full-text index cost.** `add_search_vector_to_posts_table` adds a generated
`tsvector` column and builds a GIN index without `CONCURRENTLY`. That rewrites the
whole `posts` table and blocks writes for the duration. The check reports the row
count so a large site is not surprised.

## Run it

```bash
MODULO_ENV=prod ./modulo.sh artisan modulo:upgrade
```

In order: back up, enable Laravel maintenance mode, migrate, apply bootstrap data,
rebuild caches, and lift maintenance mode. Maintenance mode is lifted in a `finally`,
so a failed migration never leaves the site dark — it leaves it on the old schema,
which is recoverable.

Note that `php artisan down` is used rather than the maintenance-mode site setting.
The setting only stops web visitors; `down` is also respected by the queue worker and
scheduler, which would otherwise keep writing during the migration.

`modulo:upgrade` never fetches code. It migrates whatever is already on disk.

## Getting the new code there

That part is channel-specific, and the admin shows the right commands for your
install under **Settings → System**.

**Docker** — the image is replaced, not updated:

```bash
docker compose pull
docker compose up -d
docker compose exec app php artisan modulo:upgrade
```

A container genuinely cannot update itself in place here. `docker/php.ini` sets
`opcache.validate_timestamps = 0` so rewritten files are never re-read, the `web`
image bakes `public/` in at build time so PHP would serve new markup against stale
assets, and `compose up` replaces the container filesystem anyway.

**Git checkout:**

```bash
git fetch --tags && git checkout v1.2.3
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan modulo:upgrade
```

**Release tarball** — download and verify it, replace the directory keeping your
`.env` and `storage/`, then run `modulo:upgrade`. The tarball ships `vendor/` and
`public/build` prebuilt, so no Composer or Node is needed.

## Is an upgrade available?

**Settings → System** shows the running version, the install channel, and whether a
newer release exists. The check asks the GitHub releases API at most twice a day and
caches the answer; a development build never checks, and prereleases are ignored.

Disable it entirely with `MODULO_UPDATE_CHECK=false`.

## What we test

CI migrates a real database built at an older version up to the current commit on
every push, asserts nothing is left pending, re-runs the bootstrap seeder to prove it
is idempotent, and boots the application. `migrate:fresh` only ever proved that a new
install works, which is not the case that breaks.

## Seeders and upgrades

`BootstrapSeeder` is safe to re-run and `modulo:upgrade` runs it, so new roles,
permissions, post types and settings arrive with an upgrade. It is additive: it grants
permissions a role is missing and never removes ones you added, never deletes locales,
and never overwrites content.

`DemoContentSeeder` is the opposite and must never touch a live site. `modulo:seed-demo`
refuses to run in production without `--force`.
