# Healthchecks and Observability

This page describes health probes and runtime observability guidance.

## Endpoints

- **Liveness**: `GET /health`
  - Confirms application process responds.
- **Readiness**: `GET /ready`
  - Confirms dependencies (DB + Redis) are reachable.
  - Returns `503` when degraded.

## Container healthchecks

Production compose includes healthchecks for:
- app
- web
- redis

Service dependencies use health conditions for startup ordering.

## Logging

Recommended production defaults:
- `LOG_CHANNEL=stderr`
- `LOG_LEVEL=warning`

This keeps logs container-friendly for centralized collection.

## Error reporting

- Structured exception reporting is configured in bootstrap exception pipeline.
- Optional Sentry capture is used when DSN is configured.

## Related docs

- [Deployment Checklist](./deployment-checklist.md)
- [Incident Runbook](./incident-runbook.md)
