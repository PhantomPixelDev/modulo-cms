# Testing Strategy

This project uses Laravel testing with Pest.

## Test types

- Feature tests (primary coverage)
- Unit tests (optional/targeted)

## Running tests

Local/dev container:

```bash
./modulo.sh test dev
```

Direct artisan:

```bash
./modulo.sh artisan test dev
```

## Minimum expectations for changes

- Add/update tests for behavior changes.
- Add regression tests for bug fixes.
- Keep test data deterministic and isolated.

## CI recommendations

- Run `php artisan test`
- Validate fresh DB reproducibility (`migrate:fresh --seed`)

## Related docs

- [Database Changes](./database-changes.md)
- [Release Process](./release-process.md)
