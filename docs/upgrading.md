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
rebuild caches, and lift maintenance mode.

What happens when something goes wrong:

- **The backup fails** — the upgrade stops before anything changes. Fix the backup,
  or pass `--skip-backup` if you have taken one yourself.
- **A migration or the bootstrap data fails** — the site **stays in maintenance
  mode**. The schema may be part-way between versions, and serving traffic from it
  risks writes that neither the old nor the new code reads correctly. The command
  prints the backup it took; fix the problem and run `modulo:upgrade` again, or
  restore the backup, then `php artisan up`.
- **Rebuilding the caches fails** — the schema already matches the code, so the site
  comes back up and you are told to run `php artisan optimize` later.

Note that `php artisan down` is used rather than the maintenance-mode site setting.
The setting only stops web visitors; `down` is also respected by the queue worker and
scheduler, which would otherwise keep writing during the migration.

`modulo:upgrade` never fetches code. It migrates whatever is already on disk.

## Getting the new code there

That part is channel-specific, and the admin shows the right commands for your
install under **System → Updates**.

**Docker** — the image is replaced, not updated. The installer puts a `modulo` helper
next to `docker-compose.yml`; from that folder:

```bash
./modulo update          # latest release
./modulo update 1.2.3    # a specific one
```

It backs up the database, sets `MODULO_TAG` in `.env`, pulls the new images, restarts,
and waits for `/health`. If the site does not become healthy, it **rolls back on its
own**: `MODULO_TAG` goes back to the previous version, the pre-update dump is restored
and the old containers are started again. Pass `--no-rollback` to leave the failed
version running for inspection instead. With `RUN_MIGRATIONS=true` (the default) the new `app`
container runs `modulo:upgrade` itself on boot — the guarded path above, not a bare
`migrate`. If that upgrade cannot finish, the container keeps the site in maintenance
mode instead of serving new code against the old schema.

By hand, the same thing is:

```bash
sed -i 's/^MODULO_TAG=.*/MODULO_TAG=1.2.3/' .env
docker compose pull
docker compose up -d
docker compose exec app php artisan modulo:upgrade   # only if RUN_MIGRATIONS is not "true"
```

`MODULO_TAG` has to change: the installer pins it to the release it installed, so
`docker compose pull` alone re-pulls the same version.

A container cannot update itself in place: the `web` image bakes `public/` in at build
time, so PHP would serve new markup against stale assets, and `compose up` replaces
the container filesystem anyway.

**Rolling back by hand** — `./modulo update <previous version>`, then, if the schema changed,
`./modulo restore storage/app/backups/<dump>.sql`. The restore starts from an empty
schema and runs in a single transaction, so a failed restore leaves the database as
it was.

**Git checkout:**

```bash
git fetch --tags && git checkout v1.2.3
composer install --no-dev --optimize-autoloader
npm ci && npm run build
php artisan modulo:upgrade
```

**Release tarball** — one command, as the user that owns the files:

```bash
php artisan modulo:update          # latest release
php artisan modulo:update 1.2.3    # a specific one
php artisan modulo:update --rollback
```

It looks the release up on GitHub, refuses a downgrade or a release whose PHP
requirement this server does not meet, and downloads `modulo-cms-<v>.tar.gz`. The
download must match both the release's `.sha256` file and the checksum in its
`release.json`, or nothing is changed. It unpacks and checks the release (VERSION,
`vendor/`, `public/index.php`), puts the site into maintenance mode, and swaps the
code in. `.env`, `storage/`, `plugins/` and the site's own folders under `public/`
(`storage`, `themes`, `plugins`) are left alone; a release ships no plugins. Then the **new** code runs `modulo:upgrade` (backup,
preflight, migrations) in a fresh PHP process.

The replaced code is kept in `storage/app/updates/previous`. If the upgrade fails the
site stays in maintenance mode; `modulo:update --rollback` puts the old code back
(restore the backup `modulo:upgrade` took as well if migrations had run), and
`php artisan up` brings the site back. It runs from the command line only: a web
request replacing the code it is running from is not something that can be made
safe. The tarball ships `vendor/` and `public/build` prebuilt, so no Composer or Node
is needed.

## Is an upgrade available?

**System → Updates** in the admin shows the running version, whether a newer release
exists (flagged when it is a security release or has breaking changes), any PHP or
PostgreSQL requirement of the new release this server does not meet, and the exact
commands for that release on this install. The same page lists plugin updates from
the registry with one-click **Update** / **Update all**. A badge on the sidebar entry
counts pending updates, red for a security release.

The scheduler runs `php artisan modulo:check-updates` every day at 04:10. It records
core and plugin results for the page, and emails administrators (users with the
`admin` or `super-admin` role, else the site's admin email) once for each new set of
updates, not every day until they are applied. **Check now** on the page does the same
on demand. Turn the email off with `MODULO_UPDATE_NOTIFY=false`.

The release details come from the `release.json` published with each release (see
[releasing.md](releasing.md)); older releases without one still show as updates, just
without the flags. The check asks the GitHub releases API and caches the answer for 12
hours; a failed check is retried after ten minutes rather than hiding updates for
hours. A development build never checks. Prereleases are ignored unless
`MODULO_UPDATE_PRERELEASES=true`.

Disable checks entirely with `MODULO_UPDATE_CHECK=false`.

## What we test

CI builds a real database at each of the three newest earlier stable releases, runs
`modulo:upgrade` to the current commit on every push, asserts nothing is left pending and the site is not left
in maintenance mode, re-runs the bootstrap seeder to prove it is idempotent, and boots
the application. Releases are gated on it, on the unit/feature suites, and on the
browser test of the install wizard. `migrate:fresh` only ever proved that a new
install works, which is not the case that breaks.

## Seeders and upgrades

`BootstrapSeeder` is safe to re-run and `modulo:upgrade` runs it, so new roles,
permissions, post types and settings arrive with an upgrade. It is additive: it grants
permissions a role is missing and never removes ones you added, never deletes locales,
and never overwrites content.

`DemoContentSeeder` is the opposite and must never touch a live site. `modulo:seed-demo`
refuses to run in production without `--force`.
