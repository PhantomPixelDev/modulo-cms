# Production (Local Containerized)

Use this guide to run the production-like Docker stack locally.

## Prerequisites

- Docker + Docker Compose
- Completed `.env.production` values

## Setup

```bash
cp .env.example .env.production
# set APP_KEY and production secrets in .env.production
./modulo.sh up prod
```

## Required settings

At minimum, set these before first startup:
- `APP_KEY`
- Database credentials (`DB_*`)
- Mail settings (`MAIL_*`) if email is needed

## Verify

- App: `http://localhost:8080`
- Liveness: `http://localhost:8080/health`
- Readiness: `http://localhost:8080/ready`

## Runtime services

- nginx (`web`)
- Laravel app (`app`)
- PostgreSQL (`db`)
- Redis (`redis`)
- Queue worker (`queue-worker`)
- Scheduler (`scheduler`)

## Common commands

```bash
./modulo.sh logs prod
./modulo.sh shell prod
./modulo.sh migrate prod
./modulo.sh seed prod
./modulo.sh status prod
```

## Troubleshooting

- If startup fails immediately, check for missing `APP_KEY` in `.env.production`.
- If `/ready` returns `503`, verify database and Redis health.

## Related docs

- [Configuration and Environment](./configuration-and-env.md)
- [Deployment Checklist](../05-operations/deployment-checklist.md)
