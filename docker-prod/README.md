# Modulo CMS - Docker Production

## Start

```bash
./modulo.sh up prod
```

App runs on **http://localhost:8080** by default.

## Services

- nginx (web)
- php-fpm (Laravel app)
- PostgreSQL
- Redis

## Useful commands

```bash
./modulo.sh logs prod
./modulo.sh shell prod
./modulo.sh migrate prod
./modulo.sh seed prod
./modulo.sh down prod
```

## Notes

- Uses `.env.prod` via `env_file`.
- Set `RUN_MIGRATIONS=true` only when you intentionally want startup migrations.
