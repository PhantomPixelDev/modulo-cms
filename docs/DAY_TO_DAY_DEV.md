# Day-to-day Development

Common workflows while developing Modulo CMS with Podman/Docker.

## Start/stop stack
```bash
podman compose up -d
podman compose down
```

## Logs and shell
```bash
podman logs -f modulo-cms             # PHP (artisan serve)
podman logs -f modulo-cms-vite        # Vite HMR
podman exec -it modulo-cms sh         # shell into app container
```

## Artisan tasks
```bash
podman exec -it modulo-cms php artisan about
podman exec -it modulo-cms php artisan migrate
podman exec -it modulo-cms php artisan db:seed
podman exec -it modulo-cms php artisan tinker
```

## Frontend dev/build
```bash
# Vite dev server runs in modulo-cms-vite automatically
podman exec -it modulo-cms npm run lint
podman exec -it modulo-cms npm run build
```

## Tests (Pest)
```bash
podman exec -it modulo-cms php artisan test
```

## Clear caches when env/config change
```bash
podman exec -it modulo-cms php artisan config:clear
podman exec -it modulo-cms php artisan cache:clear
```
