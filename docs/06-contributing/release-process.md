# Release Process

Use this lightweight process for stable releases.

## Pre-release

- Ensure tests pass.
- Validate migration reproducibility.
- Verify key docs are updated (setup, config, behavior changes).

## Build and verification

1. Build/start prod-local stack.
2. Validate `/health` and `/ready`.
3. Smoke-test key user flows (home, content view, admin login).

## Data and migration checks

- Review pending migrations.
- Confirm rollback strategy for risky schema changes.

## Release notes checklist

- Features and fixes
- Breaking changes
- Required env/config updates
- Operational considerations

## Post-release

- Monitor logs and error reporting.
- Verify queue and scheduler services remain healthy.

## Related docs

- [Deployment Checklist](../05-operations/deployment-checklist.md)
- [Incident Runbook](../05-operations/incident-runbook.md)
