# Modulo CMS

Modern, modular CMS built with Laravel 12 & React 19.

## 🚀 Quick Start

### PROD

```bash
# 1. Clone & Setup env
git clone https://github.com/PhantomPixelDev/modulo-cms.git
cd modulo-cms
cp .env.prod.example .env.prod   # then set APP_KEY, DB_PASSWORD and mail credentials

# 2. Start with Docker (production)
./modulo.sh up prod
```

### DEV

```bash
# 1. Clone & Setup env
git clone https://github.com/PhantomPixelDev/modulo-cms.git
cd modulo-cms
cp .env.dev.example .env.dev

# 2. Start with Docker (development)
./modulo.sh up dev
```

**Access:**
- Dashboard: [http://localhost:8000/dashboard](http://localhost:8000/dashboard)
- Frontend: [http://localhost:8000](http://localhost:8000)
- Mailpit (email testing): [http://localhost:8025](http://localhost:8025)

**Dev admin credentials** (created by the dev seeder; never use them in production):
- **Email:** `admin@example.com`
- **Password:** `admin123`

---

## 🛠 Helper Script

Use `./modulo.sh` for common commands:

```bash
# Development (default)
./modulo.sh up dev          # Start services
./modulo.sh restart         # Restart dev
./modulo.sh logs dev        # Show logs
./modulo.sh shell dev       # Open shell
./modulo.sh artisan migrate:status dev
./modulo.sh migrate dev     # Run migrations
./modulo.sh migrate-status dev  # Show migration status
./modulo.sh schema-dump dev     # Generate database/schema/pgsql-schema.sql baseline
./modulo.sh seed dev        # Run seeders
./modulo.sh bootstrap-dev   # Rebuild from scratch (down -v, up --build, composer install, migrate, seed)
./modulo.sh test dev        # Run tests
./modulo.sh status dev      # Show container status

# Production
./modulo.sh up prod
./modulo.sh logs prod

# Help
./modulo.sh help
```

### Dev startup automation toggles

`docker-dev/docker-compose.yml` includes optional startup toggles on the `app` service:

- `FORCE_COMPOSER_INSTALL` (default `false`)
- `RUN_MIGRATIONS` (default `false`)
- `RUN_SEEDERS` (default `false`)
- `ENSURE_DEFAULT_THEME` (default `true`)
- `DEFAULT_THEME_SLUG` (default `modern-react`)

With defaults, startup remains fast and safe, while still ensuring the default React theme is available/active for the public site.

---

## 📬 Contact Form Plugin

The Contact Form plugin adds a `[contact_form]` shortcode that stores submissions in the database and emails the configured admin address.

### Setup

1. Activate **Contact Form** in the admin plugin manager.
2. Run migrations for the submissions table:

```bash
./modulo.sh migrate dev
```

3. Set an admin recipient in **Site Settings → General → Admin Email** or via `MAIL_ADMIN_ADDRESS` in `.env.dev`.

### Shortcode Usage

```
[contact_form]
```

Optional default subject:

```
[contact_form subject="Support request"]
```

---

## 🛍 Shop Plugin

The Shop plugin provides e‑commerce functionality with products, orders, and email notifications.

### Features

- Product management (using Posts)
- Order processing
- Email notifications (customer & admin)
- Admin dashboard integration

### Email Notifications

Configure `MAIL_ADMIN_ADDRESS` in `.env.dev` to receive:
- New order notifications
- Customer order status updates

---

## 🐳 Docker Environments

| Environment | Config File | Use Case |
|-------------|-------------|----------|
| **Development** | `.env.dev` | Local development with Mailpit |
| **Production** | `.env.prod` | Production deployment (Redis, PostgreSQL, SMTP) |

### Development

```bash
./modulo.sh up dev
```

#### If the dev stack feels slow on Windows

It is the bind mount, not the application. Measured inside the running
containers, a single `stat()` costs about **2.2ms** against a Windows bind
mount and **0.09ms** on a native volume -- roughly 25x. Laravel touches ~790
files per request, so path resolution, not PHP, dominates the response time.
Reaching the stack through `localhost` adds another ~150ms of WSL port
forwarding on top: the same request measured 220-300ms from inside the podman
network and 360-740ms from the Windows host.

`config:cache` does not help (opcache already holds those files) and neither
does `opcache.validate_timestamps=0`; both were measured and made no
difference. What actually helps, in order:

1. **Keep the repository on the Linux filesystem.** Clone it inside WSL
   (`~/modulo-cms`, reachable from Windows at `\\wsl.localhost\...`) rather
   than under `C:\`, and run the stack from there. This removes the 25x
   penalty rather than working around it.
2. Do not bother tuning the podman machine's CPU or memory. On WSL2 those
   settings are ignored -- the VM takes its resources from `.wslconfig` -- and
   they were not the constraint here anyway (12 cores, 7.5GB, mostly idle
   while requests were slow).

`vendor/`, `storage/` and `node_modules/` already live on named volumes, so
they are unaffected either way.

### Production

```bash
cp .env.prod.example .env.prod
# Set APP_URL, DB_PASSWORD, mail credentials and a key:
#   docker run --rm php:8.4-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
./modulo.sh up prod
```

`docker/docker-compose.yml` starts:

| Service | Purpose |
|---------|---------|
| `web` | nginx on `WEB_PORT` (default 8080); serves `public/`, only `/index.php` runs PHP |
| `app` | PHP-FPM with opcache; runs migrations when `RUN_MIGRATIONS=true`, caches config/views |
| `queue` | `queue:work` (queued mail etc.) |
| `scheduler` | `schedule:work` |
| `db` / `redis` | PostgreSQL 16 and Redis 7 |

The stack speaks plain HTTP: put a TLS-terminating proxy (Caddy, Traefik, a load balancer) in front of `web`.
Config, routes, views and events are cached on boot. Post type, taxonomy and locale URLs are resolved at
request time by `FrontendRouterController`, so adding content types never requires rebuilding the route cache.
Seeders are for development: never seed the demo accounts in production.

### Operations

**Health** — `GET /health` returns `{"status":"ok"}` (503 when the database or cache is unreachable);
the `web` and `app` containers use it as their healthcheck.

**Backups** — the scheduler runs a dump nightly at 03:15 into `storage/app/backups`, keeping the last 7:

```bash
./modulo.sh artisan modulo:db-backup prod          # on demand
./modulo.sh artisan "modulo:db-backup --keep=30" prod
```

Restore a PostgreSQL dump (stop the app containers first so nothing writes during the restore):

```bash
docker compose -f docker/docker-compose.yml stop app queue scheduler
docker compose -f docker/docker-compose.yml exec -T db psql -U modulo -d modulo_prod < backup.sql
docker compose -f docker/docker-compose.yml start app queue scheduler
```

**Failed jobs** — queued mail that keeps failing lands in the `failed_jobs` table:

```bash
./modulo.sh artisan queue:failed prod
./modulo.sh artisan queue:retry all prod
```

### Tests

```bash
./modulo.sh test dev                          # SQLite in-memory
vendor/bin/pest -c phpunit.pgsql.xml          # PostgreSQL (uses DB_HOST/DB_USERNAME/DB_PASSWORD, database modulo_test)
npm run test:js                               # Vitest (frontend)
```

---

## 🏗 Tech Stack
- **Backend:** PHP 8.4, Laravel 12
- **Frontend:** React 19, Inertia.js, Tailwind CSS 4
- **Database:** PostgreSQL 16
- **Tools:** Vite, Docker, Mailpit (dev), Redis (prod)

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.