# Incident Runbook

Use this runbook for first-response production incidents.

## 1) Triage

- Confirm scope (single route, subsystem, full outage).
- Check service status and recent deploy/config changes.

## 2) Immediate checks

```bash
./modulo.sh status prod
./modulo.sh logs prod
```

Then verify:
- `GET /health`
- `GET /ready`

## 3) Common scenarios

### `/ready` failing

- Check DB and Redis service health.
- Validate env credentials and connectivity.

### 502 from web

- Confirm app container is healthy.
- Check php-fpm startup logs and fatal errors.

### Async features failing

- Check `queue-worker` process/logs.
- Confirm Redis availability.

## 4) Stabilize

- Roll back bad config values.
- Restart impacted service(s).
- Disable non-critical features if needed.

## 5) Post-incident

- Capture timeline and root cause.
- Add tests/alerts/runbook improvements.

## Related docs

- [Healthchecks and Observability](./healthchecks-and-observability.md)
- [Queues and Scheduler](./queues-and-scheduler.md)
