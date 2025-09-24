# Start Dev Stack (Podman/Docker)

Run the Modulo CMS dev environment with Laravel (artisan serve) and Vite HMR.

## Prerequisites

- Podman with compose support (or Docker). On some systems you may need `podman-compose`.
- Ports used:
  - 8080 → app (Laravel dev server)
  - 5173 → Vite HMR

## Start (recommended)

```bash
bash ./start-dev.sh
```

What this does:
- Builds and starts the containers from `docker/docker-compose.yml`.
- Waits until the app prints: `Setup complete! Starting Laravel development server...`.
- The app container initializes automatically (composer install, app key, publish Spatie migrations, migrate, seed, storage:link).

Open:
- App: http://localhost:8080
- Health: http://localhost:8080/health (should say `ok`)

## Manual alternative

```bash
podman compose -f docker/docker-compose.yml up -d --build
podman compose -f docker/docker-compose.yml logs -f app
```
Wait until you see the readiness message above. After first boot, you can use:

```bash
podman compose -f docker/docker-compose.yml exec app php artisan about
```

## Useful commands

- Logs
```bash
podman compose -f docker/docker-compose.yml logs -f app           # Laravel
podman compose -f docker/docker-compose.yml logs -f vite          # Vite HMR
```

- Artisan
```bash
podman compose -f docker/docker-compose.yml exec app php artisan migrate
podman compose -f docker/docker-compose.yml exec app php artisan tinker
```

- Stop
```bash
podman compose -f docker/docker-compose.yml down
```

## Development defaults

To avoid bind-mount permission issues, the dev `.env` uses:
- `VIEW_COMPILED_PATH=/tmp/laravel-views`
- `DB_CONNECTION=sqlite` + `DB_DATABASE=/tmp/modulo-cms.sqlite`
- `SESSION_DRIVER=file`, `CACHE_STORE=file`

These are container-only and safe for development. For production, use real DB/cache and remove the `/tmp` overrides.

## Troubleshooting

- Keyring quota error (rootless Podman): `crun: join keyctl ... Disk quota exceeded`
  - Fix by raising key quotas (sudo):
    ```bash
    sudo sysctl -w kernel.keys.maxkeys=50000 kernel.keys.maxbytes=50000000
    echo -e "kernel.keys.maxkeys=50000\nkernel.keys.maxbytes=50000000" | sudo tee /etc/sysctl.d/60-keyring-quota.conf
    sudo sysctl --system
    ```
  - Or use rootful Podman temporarily: `sudo podman compose -f docker/docker-compose.yml up -d --build`

- Cache/view path not writable (Blade compiler error):
  - Run: `podman compose -f docker/docker-compose.yml exec app php artisan optimize:clear`
  - Ensure paths exist: `storage/framework/*`, `bootstrap/cache` (the entrypoint creates these; in dev we fallback to `/tmp` automatically)

- SQLite read-only or missing tables:
  - Dev DB lives at `/tmp/modulo-cms.sqlite` inside container; ensure it exists and is writable.
  - Run migrations: `podman compose -f docker/docker-compose.yml exec app php artisan migrate --force`
