# Queues and Scheduler

Background execution in production is split into dedicated services.

## Services

- `queue-worker`: runs `php artisan queue:work`
- `scheduler`: runs `php artisan schedule:work`

## Required configuration

- `QUEUE_CONNECTION=redis`
- `CACHE_STORE=redis`
- `SESSION_DRIVER=redis`

## Operational checks

- Ensure both services are up via `./modulo.sh status prod`.
- Investigate stuck jobs via application logs.
- Restart worker after major deploys if needed.

## Failure symptoms

- Delayed emails/async tasks: queue worker down.
- Scheduled jobs not running: scheduler down.

## Related docs

- [Deployment Checklist](./deployment-checklist.md)
- [Healthchecks and Observability](./healthchecks-and-observability.md)
