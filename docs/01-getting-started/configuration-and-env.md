# Configuration and Environment

Modulo CMS uses environment files for runtime configuration.

## Environment files

- Development: `.env`
- Production-like local stack: `.env.production`
- Tests: `.env.testing`

## Important production keys

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY=<required>`
- `DB_*` for PostgreSQL connection
- `REDIS_*` for cache/session/queue
- `SESSION_SECURE_COOKIE=true`
- `SESSION_SAME_SITE=lax`
- `LOG_CHANNEL=stderr`

## Queue and scheduler

Production stack expects:
- `QUEUE_CONNECTION=redis`
- `SESSION_DRIVER=redis`
- `CACHE_STORE=redis`

## Mail

Set `MAIL_*` values for your SMTP provider.

## Safety checks

Before deployment or prod-local startup:
1. `APP_KEY` is present.
2. Strong DB credentials are set.
3. `APP_DEBUG=false`.
4. App/DB/Redis endpoints are reachable.

## Related docs

- [Local Development](./local-development.md)
- [Production (Local Containerized)](./production-local.md)
- [Healthchecks and Observability](../05-operations/healthchecks-and-observability.md)
