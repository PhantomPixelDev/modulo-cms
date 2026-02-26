# Deployment Checklist

Use this checklist for production-like deployments.

## Pre-deploy

- [ ] `.env.production` is complete and reviewed
- [ ] `APP_KEY` is set
- [ ] `APP_DEBUG=false`
- [ ] Database credentials are valid
- [ ] Redis is reachable
- [ ] Required SMTP settings are configured

## Build and start

```bash
./modulo.sh up prod
```

## Verify runtime

- [ ] `GET /health` returns `200 ok`
- [ ] `GET /ready` returns `200` with healthy checks
- [ ] `queue-worker` is running
- [ ] `scheduler` is running

## Data tasks

When needed:

```bash
./modulo.sh migrate prod
./modulo.sh seed prod
```

## Post-deploy checks

- [ ] Admin login works
- [ ] Public homepage and key content routes work
- [ ] Logs show no startup exceptions

## Related docs

- [Healthchecks and Observability](./healthchecks-and-observability.md)
- [Queues and Scheduler](./queues-and-scheduler.md)
