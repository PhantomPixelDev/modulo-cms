# Backups and restoring

There are two kinds of backup:

| | Database dump | Full backup |
|---|---|---|
| Command | `modulo:db-backup` | `modulo:backup` |
| Contains | the database | database, uploaded media, installed plugins (`--with-env` adds `.env`) |
| File | `storage/app/backups/<db>-<stamp>.sql` | `storage/app/backups/modulo-backup-<stamp>.zip` |
| Schedule | nightly, 03:15, keeps 7 | Sundays, 03:45, keeps `MODULO_BACKUP_KEEP` (5) |
| Restore | `./modulo restore <dump>.sql` | `php artisan modulo:restore <backup>.zip` |

## Full backups

**Admin → System → Backups** lists full backups and can create, download and
delete them. Only users with the `admin` or `super-admin` role can open it: a
backup holds the whole database, password hashes included.

```bash
php artisan modulo:backup                 # database + media + plugins
php artisan modulo:backup --no-media      # skip uploads (can be large)
php artisan modulo:backup --with-env      # also .env -- it holds secrets
./modulo backup --full                    # Docker, from the install folder
```

Each archive carries a `manifest.json` with the Modulo version that made it.
Turn the weekly run off with `MODULO_BACKUP_SCHEDULE=false`; change where
archives go with `MODULO_BACKUP_PATH`.

Restoring is command-line only, because it replaces the database under anyone
using the site:

```bash
php artisan modulo:restore modulo-backup-2026-09-25_034500.zip
php artisan modulo:restore <file> --only=media        # just the uploads
./modulo restore modulo-backup-2026-09-25_034500.zip  # Docker; a local path is copied in first
```

It puts the site in maintenance mode, restores, migrates an older backup up to
the running version, and brings the site back. It refuses a backup made by a
*newer* Modulo (update first), and never restores `.env` automatically. Media
and plugin files are written over the current ones; files added since the
backup are kept. If anything fails, the site stays in maintenance mode.

## What runs automatically

The scheduler dumps the database nightly at 03:15 into `storage/app/backups`,
keeping the last 7, and takes a full backup every Sunday at 03:45. That
requires the `scheduler` container to be running.

```bash
MODULO_ENV=prod ./modulo.sh artisan schedule:list
```

## On demand

```bash
./modulo.sh backup                       # dev
MODULO_ENV=prod ./modulo.sh backup       # prod
MODULO_ENV=prod ./modulo.sh artisan modulo:db-backup --keep=30
```

PostgreSQL dumps use `pg_dump --no-owner --no-acl`, so a dump restores into a
database owned by a different role than the one that made it.

## Restoring

```bash
./modulo.sh restore prod backup.sql
```

This stops the app, queue and scheduler first so nothing writes mid-restore,
and asks for confirmation because it overwrites the database. If the restore
fails, the writers stay stopped so you can retry rather than coming back up
onto a half-restored database.

By hand:

```bash
docker compose -f docker/docker-compose.yml stop app queue scheduler
docker compose -f docker/docker-compose.yml exec -T db psql -U modulo -d modulo_prod < backup.sql
docker compose -f docker/docker-compose.yml start app queue scheduler
```

## From the admin

**System → Backups** lists the full backups, makes one on demand, and:

- **Restores** one: choose what to restore (database, media, plugins) and type the
  backup's name to confirm. A queued job runs `modulo:restore` (maintenance mode,
  restore, migrate) and the page shows how it went. It needs the queue worker (the
  `queue` container); with `QUEUE_CONNECTION=sync` it runs inside the request.
- **Uploads** a backup made on another server, e.g. to move a site. The size is limited
  by PHP's `upload_max_filesize`/`post_max_size`; copy bigger archives into
  `storage/app/backups` on the server instead.

## Off-site copies

A backup on the same server doesn't survive losing the server. Point
`MODULO_BACKUP_DISK` at a filesystem disk and every new full backup (scheduled, from
the admin or `modulo:backup`) is also copied there, keeping the newest
`MODULO_BACKUP_DISK_KEEP` (10):

```dotenv
MODULO_BACKUP_DISK=s3
MODULO_BACKUP_DISK_PATH=modulo-backups   # folder in the bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=auto
AWS_BUCKET=my-site-backups
# Any S3-compatible storage: set its endpoint (Backblaze B2, Wasabi, Cloudflare R2, MinIO)
AWS_ENDPOINT=https://s3.eu-central-003.backblazeb2.com
AWS_USE_PATH_STYLE_ENDPOINT=false
```

Use a key that can only write to that bucket. The Backups page shows where copies go
and whether the last one worked; a failed copy also makes `modulo:backup` exit with an
error, so the scheduler's failure reporting sees it.

## What a dump does not contain

**Uploaded files.** Media lives in the `storage` volume, not the database. A
database-only restore gives you posts that reference images which no longer
exist. Use a full backup (above), or archive the volume yourself:

```bash
docker run --rm -v modulo_storage:/data -v "$PWD":/backup alpine \
  tar czf /backup/storage-$(date +%F).tar.gz -C /data .
```

Restore it the same way with `tar xzf`.

## Test the restore

A backup nobody has restored is a hope. At least once, restore into a scratch
database and confirm the site comes up:

```bash
docker compose -f docker/docker-compose.yml exec -T db createdb -U modulo restore_test
docker compose -f docker/docker-compose.yml exec -T db psql -U modulo -d restore_test < backup.sql
docker compose -f docker/docker-compose.yml exec -T db psql -U modulo -d restore_test -c "SELECT count(*) FROM posts;"
```

## Before upgrading

`modulo:upgrade` takes a backup first, and refuses to start when a preflight
check finds data that would break a migration partway through. See
[upgrading.md](upgrading.md).
