#!/usr/bin/env sh
set -e

cd /var/www/html

# Function to fix storage permissions
fix_permissions() {
  mkdir -p storage/framework/cache/data storage/framework/views storage/framework/sessions storage/logs bootstrap/cache || true
  chmod -R 777 storage bootstrap/cache || true
  chown -R www-data:www-data storage bootstrap/cache || true
  # Clear any root-owned files
  find storage -type f -user root -exec rm -f {} + 2>/dev/null || true
  find bootstrap/cache -type f -user root -exec rm -f {} + 2>/dev/null || true
}

wait_for_database() {
  if [ ! -f vendor/autoload.php ]; then
    return
  fi

  ATTEMPT=1
  MAX_ATTEMPTS=${DB_CONNECT_MAX_ATTEMPTS:-30}

  PHP_DSN="pgsql:host=${DB_HOST:-db};port=${DB_PORT:-5432};dbname=${DB_DATABASE:-modulo}"
  PHP_USER="${DB_USERNAME:-modulo}"
  PHP_PASS="${DB_PASSWORD:-secret}"

  echo "Attempting DB connection: host=${DB_HOST:-db} port=${DB_PORT:-5432} dbname=${DB_DATABASE:-modulo} user=${PHP_USER}" >&2

  until php -r "
    try {
        \$pdo = new PDO(\"$PHP_DSN\", \"$PHP_USER\", \"$PHP_PASS\");
        \$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        \$stmt = \$pdo->query('SELECT 1');
        exit(0);
    } catch (Throwable \$e) {
        fwrite(STDERR, 'DB Error: ' . \$e->getMessage() . PHP_EOL);
        exit(1);
    }
  " >/dev/null 2>&1; do
    if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
      echo "Database still unavailable after $MAX_ATTEMPTS attempts. Exiting." >&2
      exit 1
    fi

    echo "Waiting for database... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    ATTEMPT=$((ATTEMPT + 1))
    sleep 2
  done
  
  echo "Database connection successful!"
}

ensure_default_theme() {
  if [ "${ENSURE_DEFAULT_THEME:-true}" != "true" ]; then
    return
  fi

  if [ ! -f vendor/autoload.php ]; then
    return
  fi

  DEFAULT_THEME_SLUG="${DEFAULT_THEME_SLUG:-modern-react}"

  if ! php -r "require 'vendor/autoload.php'; \$app = require 'bootstrap/app.php'; \$kernel = \$app->make(Illuminate\\Contracts\\Console\\Kernel::class); \$kernel->bootstrap(); exit(App\\Models\\Theme::where('slug','${DEFAULT_THEME_SLUG}')->exists() ? 0 : 1);" >/dev/null 2>&1; then
    echo "Installing default theme (${DEFAULT_THEME_SLUG})..."
    php artisan theme:install "${DEFAULT_THEME_SLUG}" >/dev/null 2>&1 || true
  fi

  if ! php -r "require 'vendor/autoload.php'; \$app = require 'bootstrap/app.php'; \$kernel = \$app->make(Illuminate\\Contracts\\Console\\Kernel::class); \$kernel->bootstrap(); exit(App\\Models\\Theme::where('is_active', true)->where('template_engine', 'react')->exists() ? 0 : 1);" >/dev/null 2>&1; then
    echo "Activating default React theme (${DEFAULT_THEME_SLUG})..."
    php artisan theme:activate "${DEFAULT_THEME_SLUG}" >/dev/null 2>&1 || true
  fi

  if ! php -r "require 'vendor/autoload.php'; \$app = require 'bootstrap/app.php'; \$kernel = \$app->make(Illuminate\\Contracts\\Console\\Kernel::class); \$kernel->bootstrap(); exit(App\\Models\\Theme::where('slug','${DEFAULT_THEME_SLUG}')->where('is_active', true)->where('template_engine', 'react')->exists() ? 0 : 1);" >/dev/null 2>&1; then
    sleep 2
    php artisan theme:activate "${DEFAULT_THEME_SLUG}" >/dev/null 2>&1 || true
  fi

  if ! php -r "require 'vendor/autoload.php'; \$app = require 'bootstrap/app.php'; \$kernel = \$app->make(Illuminate\\Contracts\\Console\\Kernel::class); \$kernel->bootstrap(); exit(App\\Models\\Theme::where('slug','${DEFAULT_THEME_SLUG}')->where('is_active', true)->where('template_engine', 'react')->exists() ? 0 : 1);" >/dev/null 2>&1; then
    echo "WARNING: Could not auto-activate default React theme '${DEFAULT_THEME_SLUG}'."
    echo "Please ensure resources/themes/${DEFAULT_THEME_SLUG}/theme.json exists and rerun theme install/activate."
  fi
}

prepare_env_file() {
  # Prefer existing .env; otherwise bootstrap from example.
  if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env || true
  fi
}

ensure_app_key() {
  if [ ! -f .env ]; then
    return
  fi

  CURRENT_KEY=$(grep '^APP_KEY=' .env 2>/dev/null | head -n1 | cut -d '=' -f2-)

  if [ -z "$CURRENT_KEY" ]; then
    GENERATED_KEY=$(php -r "echo 'base64:'.base64_encode(random_bytes(32));" 2>/dev/null || true)
    if [ -n "$GENERATED_KEY" ]; then
      if grep -q '^APP_KEY=' .env 2>/dev/null; then
        sed -i "s|^APP_KEY=.*$|APP_KEY=$GENERATED_KEY|" .env || true
      else
        printf '\nAPP_KEY=%s\n' "$GENERATED_KEY" >> .env || true
      fi
    fi
  fi
}

# Initial permission fix
fix_permissions

# Remove any pre-existing Laravel cache files to avoid stale config/routes/views (dev)
rm -f bootstrap/cache/*.php || true

prepare_env_file

ensure_app_key

# Install composer dependencies if missing or explicitly requested
if [ "${FORCE_COMPOSER_INSTALL:-false}" = "true" ] || [ ! -f vendor/autoload.php ]; then
  echo "Installing composer dependencies..."
  composer install --no-interaction --prefer-dist --optimize-autoloader || true
fi

# Ensure app key and run setup (only when deps are installed)
if [ -f vendor/autoload.php ]; then
  wait_for_database

  # Check if this is a fresh install (no migrations table yet)
  FRESH_INSTALL="yes"
  if php -r "require 'vendor/autoload.php'; \$app = require 'bootstrap/app.php'; \$kernel = \$app->make(Illuminate\\Contracts\\Console\\Kernel::class); \$kernel->bootstrap(); exit(Illuminate\\Support\\Facades\\Schema::hasTable('migrations') ? 0 : 1);" >/dev/null 2>&1; then
    FRESH_INSTALL="no"
  fi
  
  if [ "$FRESH_INSTALL" = "yes" ] || [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "Running migrations..."
    php artisan migrate --force
  fi

  if [ "$FRESH_INSTALL" = "yes" ] || [ "${RUN_SEEDERS:-false}" = "true" ]; then
    echo "Seeding database..."
    php artisan db:seed --force
  fi

  ensure_default_theme
  
  # Fix permissions after all setup
  fix_permissions
fi

exec "$@"
