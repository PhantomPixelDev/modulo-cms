#!/bin/sh
# Production entrypoint for the app, queue and scheduler containers.
set -e

cd /var/www/html

if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY is not set. Generate one with: php artisan key:generate --show" >&2
  exit 1
fi

wait_for_database() {
  attempts=0
  until php artisan db:show >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge "${DB_CONNECT_MAX_ATTEMPTS:-30}" ]; then
      echo "Database still unavailable after $attempts attempts." >&2
      exit 1
    fi
    echo "Waiting for database... ($attempts)"
    sleep 2
  done
}

# Only the main app container runs one-off setup; queue/scheduler just wait for it.
if [ "${CONTAINER_ROLE:-app}" = "app" ]; then
  wait_for_database

  if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    php artisan migrate --force
  fi

  php artisan storage:link >/dev/null 2>&1 || true

  # Refresh the bundled plugins over the volume. A named volume keeps whatever
  # it was seeded with on first boot, so without this an image upgrade would
  # never reach the plugins that ship with it. Plugins installed at runtime have
  # their own directories and are left alone.
  if [ -d plugins-bundled ]; then
    cp -a plugins-bundled/. plugins/ 2>/dev/null || true
  fi

  # Publish plugin assets to the volume nginx serves from; the web image bakes
  # public/ in at build time and cannot see runtime writes otherwise.
  php artisan plugin:publish-assets >/dev/null 2>&1 || true

  # First boot: make sure the public site has a theme (never overrides an active one)
  php artisan theme:ensure "${DEFAULT_THEME:-modern-react}" || echo "WARNING: no active theme; install one in the admin." >&2

  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  php artisan event:cache
else
  wait_for_database
  php artisan config:cache >/dev/null
fi

exec "$@"
