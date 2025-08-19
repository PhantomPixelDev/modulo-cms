#!/usr/bin/env bash
# Clear Laravel caches and PHP OPcache inside a Podman container
# Usage: ./scripts/clear-caches.sh [container_name]
# Default container_name: modulo-cms

set -euo pipefail

CONTAINER_NAME="${1:-modulo-cms}"

echo "[clear-caches] Target container: ${CONTAINER_NAME}"

# Verify container exists/running (non-fatal if not running; command will fail below)
if ! podman ps --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  echo "[clear-caches] WARNING: container '${CONTAINER_NAME}' not found in running containers. Attempting anyway..." >&2
fi

# Run all clears inside the container
# Reset OPcache (if enabled) with safe quoting
podman exec -it "${CONTAINER_NAME}" sh -lc 'echo "[clear-caches] Resetting PHP OPcache" && php -r "if (function_exists('\''opcache_reset'\'')) { opcache_reset(); }"'

# Clear Laravel caches step-by-step
podman exec -it "${CONTAINER_NAME}" sh -lc 'echo "[clear-caches] artisan optimize:clear" && php artisan optimize:clear'
podman exec -it "${CONTAINER_NAME}" sh -lc 'echo "[clear-caches] artisan event:clear" && php artisan event:clear || true'
podman exec -it "${CONTAINER_NAME}" sh -lc 'echo "[clear-caches] artisan view:clear" && php artisan view:clear'
podman exec -it "${CONTAINER_NAME}" sh -lc 'echo "[clear-caches] artisan route:clear" && php artisan route:clear'
podman exec -it "${CONTAINER_NAME}" sh -lc 'echo "[clear-caches] artisan config:clear" && php artisan config:clear'
podman exec -it "${CONTAINER_NAME}" sh -lc 'echo "[clear-caches] artisan cache:clear" && php artisan cache:clear'
echo "[clear-caches] Done."
