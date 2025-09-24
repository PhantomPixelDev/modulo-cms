#!/bin/bash

# Fail fast and make errors visible
set -euo pipefail

echo "Starting Modulo CMS development container..."

# 1) Ensure SQLite database exists (Laravel may access it during composer scripts)
echo "Ensuring SQLite database exists..."
mkdir -p database
touch database/database.sqlite || true
chmod 777 database || true
chmod 666 database/database.sqlite || true

# 2) Install PHP dependencies (idempotent)
echo "Installing PHP dependencies..."
composer install --no-interaction --optimize-autoloader

# 3) Generate app key if not set
if [ ! -f .env ] || ! grep -q "^APP_KEY=" .env || [ -z "$(grep -m1 '^APP_KEY=' .env | cut -d'=' -f2-)" ]; then
  echo "Generating application key..."
  php artisan key:generate --no-interaction || true
fi

# 3.5) Ensure cache/view/session directories exist and are writable
echo "Ensuring cache/view/session directories..."
mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache || true
# Try to make them writable for dev
chmod -R 775 storage bootstrap/cache 2>/dev/null || true

# If views path is not writable, fall back to /tmp
if [ ! -w storage/framework/views ]; then
  echo "storage/framework/views not writable; falling back to /tmp/laravel-views"
  mkdir -p /tmp/laravel-views
  chmod 777 /tmp/laravel-views || true
  export VIEW_COMPILED_PATH=/tmp/laravel-views
fi

# If bootstrap/cache not writable, try to relax perms; otherwise fallback to /tmp
if [ ! -w bootstrap/cache ]; then
  echo "bootstrap/cache not writable; attempting chmod 777"
  chmod 777 bootstrap/cache 2>/dev/null || true
  if [ ! -w bootstrap/cache ]; then
    echo "bootstrap/cache still not writable; using /tmp/bootstrap-cache"
    mkdir -p /tmp/bootstrap-cache
    chmod 777 /tmp/bootstrap-cache || true
    export APP_BOOTSTRAP_CACHE=/tmp/bootstrap-cache
  fi
fi

# 4) Publish package migrations required by the app (idempotent)
echo "Publishing package migrations..."
php artisan vendor:publish --provider="Spatie\\Permission\\PermissionServiceProvider" --tag=migrations --force || true
php artisan vendor:publish --provider="Spatie\\MediaLibrary\\MediaLibraryServiceProvider" --tag=migrations --force || true

# 4.5) Ensure we are not using stale cached config/views
echo "Clearing cached config and views..."
php artisan config:clear || true
php artisan view:clear || true

# 5) Run database migrations and seeds
echo "Running database migrations..."
php artisan migrate --force
echo "Seeding database..."
php artisan db:seed --force || true

# 6) Create storage symlink (safe to re-run)
echo "Creating storage link..."
php artisan storage:link || true

echo "Setup complete! Starting Laravel development server..."
exec php artisan serve --host=0.0.0.0 --port=8000
