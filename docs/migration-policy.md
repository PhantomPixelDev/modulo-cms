# Migration Policy

This policy keeps migration history useful while preventing migration sprawl from hurting developer velocity.

## Principles

1. **History is kept**
   - Do not delete historical migrations during normal development.

2. **Schema baseline is first-class**
   - `database/schema/pgsql-schema.sql` is the baseline for fresh Postgres environments.

3. **Small, scoped migrations**
   - One migration should solve one schema concern.
   - Avoid mixed concerns in a single file (e.g., columns + unrelated indexes).

4. **Reproducible fresh setup**
   - CI must validate `migrate:fresh --seed` on Postgres.

## Naming convention

Use intent-based naming:
- `create_<table>_table`
- `add_<column>_to_<table>_table`
- `drop_<column>_from_<table>_table`
- `add_<purpose>_indexes_to_<table>_table`
- `align_<columns>_types` (for consistency/fixes)

## Baseline refresh cadence

Refresh schema baseline when:
1. A release branch is cut, or
2. A significant schema milestone is merged.

Command:

```bash
./modulo.sh schema-dump dev
```

## Squash-release workflow (periodic)

Use a dedicated branch (example: `chore/squash-release-YYYY-MM`) when the migration set gets too large.

1. Create branch from `dev`.
2. Move historical migrations to an archive folder, e.g.:
   - `database/migrations_archive/pre-squash-YYYY-MM-DD/`
3. Keep active path lean:
   - `database/migrations/` should only contain post-squash migrations (plus optional `.gitkeep`).
4. Regenerate schema baseline and commit archive + schema together.

This keeps day-to-day migration management simple while preserving full history in-repo.

## Required checks before merge

1. Migration status is clean:

```bash
./modulo.sh migrate-status dev
```

2. Fresh DB reproducibility works:

```bash
php artisan migrate:fresh --seed --force
```

3. Rollback path is valid where practical (`down()` tested for local/dev).

## Data safety for structural migrations

For type/constraint migrations:
1. Verify existing data compatibility first.
2. Add indexes before adding heavy FK constraints when needed.
3. Use phased rollout for production-critical tables (expand -> migrate -> constrain).

## Model synchronization rules

When changing schema:
- Update model `$fillable`/`$casts` in the same PR.
- Prefer `$casts` over manual JSON mutators unless a transform is required.
- Add/update factory + seeder defaults if new non-null columns are introduced.
