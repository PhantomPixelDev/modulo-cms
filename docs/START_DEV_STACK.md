# Start Dev Stack (Podman/Docker)

This guide starts the Modulo CMS development environment with PHP (artisan serve) and Vite HMR.

## Prerequisites

- Podman with compose support (or Docker). On some systems you may need `podman-compose`.
- Ports in use:
  - 8080 → app (Laravel dev server)
  - 5173 → Vite HMR

## 1) Build and start

```bash
podman compose build
podman compose up -d
```

If your system requires the Python podman-compose wrapper, use:
```bash
podman-compose -f podman-compose.yml build
podman-compose -f podman-compose.yml up -d
```

## 2) Install PHP deps (first run)
Because the project root is bind-mounted, run Composer in the container once:
```bash
podman exec -it modulo-cms composer install
```

## 3) Initialize Laravel (SQLite + key + migrations)
```bash
podman exec -it modulo-cms sh -lc 'mkdir -p database && touch database/database.sqlite'
podman exec -it modulo-cms php artisan key:generate
podman exec -it modulo-cms php artisan migrate --force
```

## 4) Open in browser

- App: http://localhost:8080
- Vite HMR: http://localhost:5173

## Useful commands

- Logs
```bash
podman logs -f modulo-cms         # PHP (artisan serve)
podman logs -f modulo-cms-vite    # Vite HMR
```

- Artisan
```bash
podman exec -it modulo-cms php artisan about
podman exec -it modulo-cms php artisan migrate
podman exec -it modulo-cms php artisan tinker
```

- NPM (inside container)
```bash
podman exec -it modulo-cms npm run lint
podman exec -it modulo-cms npm run build
```

- Stop
```bash
podman compose down
```

## Day-to-day development

See `docs/DAY_TO_DAY_DEV.md` for the ongoing development workflow (start/stop, logs, artisan, frontend tasks, tests, caches).

## Troubleshooting

- Permission issues with bind mounts:
```bash
chmod -R 775 storage bootstrap/cache
```

- Compose fallback warning to docker-compose provider: consider installing `podman-compose` and using the commands shown above.
