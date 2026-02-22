#!/usr/bin/env sh
set -e

cd /var/www/html

prepare_env_file() {
  ENV_FILE_PATH="${LARAVEL_ENV_FILE:-}"

  if [ -n "$ENV_FILE_PATH" ] && [ -f "$ENV_FILE_PATH" ]; then
    ln -sf "$ENV_FILE_PATH" .env 2>/dev/null || cp "$ENV_FILE_PATH" .env || true
    return
  fi

  if [ ! -f .env ] && [ -f .env.prod ]; then
    ln -sf .env.prod .env 2>/dev/null || cp .env.prod .env || true
  fi
}

ensure_app_key() {
  if [ ! -f .env ]; then
    return
  fi

  CURRENT_KEY=$(grep '^APP_KEY=' .env 2>/dev/null | head -n1 | cut -d '=' -f2-)
  if [ -z "$CURRENT_KEY" ]; then
    php artisan key:generate --force || true
  fi
}

fix_permissions() {
  mkdir -p storage/framework/cache/data storage/framework/views storage/framework/sessions storage/logs bootstrap/cache || true
  chown -R www-data:www-data storage bootstrap/cache || true
  chmod -R 775 storage bootstrap/cache || true
}

wait_for_db() {
  ATTEMPT=1
  MAX_ATTEMPTS=${DB_CONNECT_MAX_ATTEMPTS:-30}
  PHP_DSN="pgsql:host=${DB_HOST:-db};port=${DB_PORT:-5432};dbname=${DB_DATABASE:-modulo_prod}"
  PHP_USER="${DB_USERNAME:-modulo}"
  PHP_PASS="${DB_PASSWORD:-secret}"

  until php -r "try { new PDO('$PHP_DSN', '$PHP_USER', '$PHP_PASS'); exit(0); } catch (Throwable $e) { exit(1); }" >/dev/null 2>&1; do
    if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
      echo "Database is not ready after ${MAX_ATTEMPTS} attempts"
      exit 1
    fi
    ATTEMPT=$((ATTEMPT + 1))
    sleep 2
  done
}

prepare_env_file
fix_permissions
ensure_app_key
wait_for_db

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php artisan migrate --force
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  php artisan db:seed --force
fi

php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

exec "$@"
