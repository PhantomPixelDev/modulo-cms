# Modulo CMS

Modern, modular CMS built with Laravel 12 + React 19.

## Quick start

```bash
git clone https://github.com/PhantomPixelDev/modulo-cms.git
cd modulo-cms
```

### Development

```bash
cp .env.example .env.dev
./modulo.sh up dev
```

Open:
- Frontend: http://localhost:8000
- Dashboard: http://localhost:8000/dashboard
- Mailpit: http://localhost:8025

### Production (local containerized)

```bash
cp .env.example .env.prod
./modulo.sh up prod
```

Open:
- App: http://localhost:8080

---

## `modulo.sh` commands

```bash
./modulo.sh up dev|prod
./modulo.sh down dev|prod
./modulo.sh restart dev|prod
./modulo.sh logs dev|prod
./modulo.sh shell dev|prod
./modulo.sh artisan <command> [dev|prod]
./modulo.sh migrate dev|prod
./modulo.sh seed dev|prod
./modulo.sh schema-dump dev|prod
./modulo.sh test dev|prod
./modulo.sh status dev|prod
./modulo.sh bootstrap-dev --force
```

---

## Docker folders

- `docker-dev/` → Development stack (nginx + php-fpm + postgres + vite + mailpit)
- `docker-prod/` → Production stack (nginx + php-fpm + postgres + redis)

Each stack reads its own env file:
- Dev: `.env.dev`
- Prod: `.env.prod`

---

## Tech stack

- Laravel 12 / PHP 8.4
- React 19 + Inertia + Tailwind
- PostgreSQL 16
- Docker

## License

MIT. See [LICENSE](LICENSE).