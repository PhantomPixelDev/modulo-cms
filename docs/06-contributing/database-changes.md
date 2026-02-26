# Database Changes

This page defines the expected workflow for schema and data-model updates.

## Required references

- [Migration Policy](../migration-policy.md)
- [Database Architecture](../database-architecture.md)

## Change workflow

1. Create a scoped migration for one concern.
2. Update matching model `fillable`/`casts` in same PR.
3. Update seeders/factories for new required columns.
4. Validate fresh setup and rollback path where practical.

## Useful commands

```bash
./modulo.sh migrate-status dev
./modulo.sh schema-dump dev
./modulo.sh artisan migrate:fresh --seed dev
```

## PR checklist

- [ ] Migration name follows conventions
- [ ] Data compatibility reviewed
- [ ] Related model updates included
- [ ] Tests updated

## Related docs

- [Testing Strategy](./testing-strategy.md)
- [Release Process](./release-process.md)
