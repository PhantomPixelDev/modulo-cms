## What does this change?

<!-- The behaviour change and why it is needed. Link the issue if there is one. -->

## How was it verified?

<!-- Tests added, and anything you checked by hand. If a bug is fixed, say which
     test fails without the fix. -->

## Checklist

- [ ] A test covers the change (and fails without it, if this is a bug fix)
- [ ] `./modulo.sh artisan test` passes
- [ ] `vendor/bin/pint --test`, `phpstan`, `npm run format:check`, `lint`, `types` pass
- [ ] Any new migration is additive and does not edit a shipped one
- [ ] Any new or changed seeder is idempotent and non-destructive
- [ ] Docs updated if behaviour or setup changed
