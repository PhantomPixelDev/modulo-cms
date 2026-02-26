# Local Development

Use this guide to run Modulo CMS locally with the Docker development stack.

## Prerequisites

- Docker + Docker Compose
- Git

## Setup

```bash
git clone https://github.com/PhantomPixelDev/modulo-cms.git
cd modulo-cms
cp .env.example .env
./modulo.sh up dev
```

## Verify

- App: `http://localhost:8000`
- Dashboard: `http://localhost:8000/dashboard`
- Mailpit: `http://localhost:8025`

## Common commands

```bash
./modulo.sh logs dev
./modulo.sh shell dev
./modulo.sh migrate dev
./modulo.sh seed dev
./modulo.sh test dev
./modulo.sh status dev
```

## Reset development data

```bash
./modulo.sh bootstrap-dev --force
```

This recreates the dev stack and reruns migrations/seeders.

## Troubleshooting

- If you see blank pages/asset issues, rebuild assets in the vite container.
- If container startup is slow, check `./modulo.sh logs dev` for composer/migration progress.

## Related docs

- [Configuration and Environment](./configuration-and-env.md)
- [Production (Local Containerized)](./production-local.md)
