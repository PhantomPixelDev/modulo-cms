# Backup and Restore

This runbook provides baseline backup and restore guidance.

## Scope

Primary persistence targets:
- PostgreSQL data
- `storage` volume contents (uploads, generated files)

## Backup strategy (minimum)

1. **Database dump**
   - Run regular `pg_dump` from database container.
2. **Storage snapshot**
   - Archive storage volume content on schedule.
3. **Retention**
   - Keep multiple restore points (daily + weekly).
4. **Verification**
   - Periodically test restore to a non-production environment.

## Restore checklist

1. Stop traffic or isolate restore target.
2. Restore database dump.
3. Restore storage files.
4. Bring stack up and validate `/health` + `/ready`.
5. Validate critical content and admin access.

## Notes

- Keep backup credentials and artifacts in secure storage.
- Define RPO/RTO targets for your environment.

## Related docs

- [Deployment Checklist](./deployment-checklist.md)
- [Incident Runbook](./incident-runbook.md)
