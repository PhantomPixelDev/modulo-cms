#!/usr/bin/env sh
set -e

cd /var/www/html

# Ensure writable dirs exist
mkdir -p storage/framework/cache/data storage/framework/views storage/framework/sessions storage/logs bootstrap/cache || true
chmod -R 775 storage bootstrap/cache || true
chown -R www-data:www-data storage bootstrap/cache || true

# If any cache files were created as root (common when running artisan via docker exec),
# PHP-FPM (www-data) can fail to write/overwrite them.
find storage/framework/views -maxdepth 1 -type f -user root -exec rm -f {} + 2>/dev/null || true
find storage/framework/cache -type f -user root -exec rm -f {} + 2>/dev/null || true
find storage/framework/sessions -type f -user root -exec rm -f {} + 2>/dev/null || true

chown -R www-data:www-data storage bootstrap/cache || true

# Remove any pre-existing Laravel cache files to avoid stale config/routes/views (dev)
rm -f bootstrap/cache/*.php || true

# Ensure .env exists for local runtime inside container
if [ ! -f .env ]; then
  if [ -f .env.docker-dev ]; then
    cp .env.docker-dev .env || true
  else
    cp .env.example .env || true
  fi
fi

# Install composer dependencies if missing
if [ ! -f vendor/autoload.php ]; then
  echo "Installing composer dependencies..."
  composer install --no-interaction --prefer-dist --optimize-autoloader || true
fi

# Ensure app key and run setup (only when deps are installed)
if [ -f vendor/autoload.php ]; then
  php artisan key:generate --force || true

  # Check if this is a fresh install (no migrations table)
  # Use direct SQL check to avoid loading Laravel app
  FRESH_INSTALL="yes"
  if php artisan migrate:status >/dev/null 2>&1; then
    FRESH_INSTALL="no"
  fi
  
  if [ "$FRESH_INSTALL" = "yes" ] || [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "Running migrations..."
    php artisan migrate --force || true
    
    # Seed only on fresh install (always seed on fresh install)
    echo "Seeding database..."
    php artisan db:seed --force || true
    
    # Install and activate theme if none active
    echo "Setting up theme..."
    # Install theme (discovers and installs in one step)
    php artisan theme:install modern-react --no-interaction || true
    php artisan theme:activate modern-react || true
  fi
fi

exec "$@"
