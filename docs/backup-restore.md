# Backups and restoring

## What runs automatically

The scheduler dumps the database nightly at 03:15 into `storage/app/backups`,
keeping the last 7. That requires the `scheduler` container to be running.

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

## What a dump does not contain

**Uploaded files.** Media lives in the `storage` volume, not the database. A
database-only restore gives you posts that reference images which no longer
exist.

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
