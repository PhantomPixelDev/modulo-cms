#!/usr/bin/env sh
set -e

cd /var/www/html

# Ensure directories exist and are writable
mkdir -p \
  storage/framework/cache/data \
  storage/framework/views \
  storage/framework/sessions \
  storage/logs \
  storage/app/public \
  bootstrap/cache \
  || true
chmod -R 775 storage bootstrap/cache || true
# Ensure correct ownership for runtime-mounted volumes
chown -R www-data:www-data storage bootstrap/cache || true

# Remove any pre-existing Laravel cache files from the repo to avoid stale package discovery (e.g. dev-only providers)
rm -f bootstrap/cache/*.php || true

# Ensure .env exists
if [ ! -f .env ]; then
  cp .env.example .env || true
fi

# Install composer dependencies if missing
if [ ! -f vendor/autoload.php ]; then
  echo "Installing composer dependencies..."
  composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev || true
fi

# Ensure storage symlink exists (idempotent)
php artisan storage:link >/dev/null 2>&1 || true

# Generate app key if missing or blank
if [ -z "${APP_KEY:-}" ] || grep -Eq '^\s*APP_KEY\s*=\s*$' .env 2>/dev/null || ! grep -Eq '^\s*APP_KEY\s*=' .env 2>/dev/null; then
  php artisan key:generate --force || true
fi

# Ensure APP_KEY is exported for the php-fpm process (production may not read .env directly)
APP_KEY_VALUE="$(grep -E '^\s*APP_KEY\s*=' .env 2>/dev/null | sed -E 's/^\s*APP_KEY\s*=\s*//')"
if [ -n "$APP_KEY_VALUE" ]; then
  export APP_KEY="$APP_KEY_VALUE"
fi

# Write php-fpm runtime overrides so workers inherit env and listen publicly
# Patch www.conf directly to ensure settings take effect
if [ -f /usr/local/etc/php-fpm.d/www.conf ]; then
  sed -ri \
    -e 's#^listen\s*=\s*.*#listen = 0.0.0.0:9000#' \
    -e 's#^;?\s*clear_env\s*=\s*.*#clear_env = no#' \
    /usr/local/etc/php-fpm.d/www.conf || true
fi

# Optimize caches (do not fail hard if DB is not ready yet)
php artisan optimize:clear || true
php artisan package:discover --ansi || true
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# Check if this is a fresh install (no migrations table) or migrations requested
# Use direct SQL check to avoid loading Laravel app
FRESH_INSTALL="yes"
if php artisan migrate:status >/dev/null 2>&1; then
  FRESH_INSTALL="no"
fi

if [ "$FRESH_INSTALL" = "yes" ] || [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Running migrations..."
  php artisan migrate --force || true
  
  # Seed on fresh install
  echo "Seeding database..."
  php artisan db:seed --class=DefaultUsersSeeder --force || true
  php artisan db:seed --class=RolePermissionSeeder --force || true
  php artisan db:seed --class=SiteSettingsSeeder --force || true
  
  # Install and activate theme
  echo "Setting up theme..."
  # Install theme (discovers and installs in one step)
  php artisan theme:install modern-react --no-interaction || true
  php artisan theme:activate modern-react || true
fi

exec "$@"
