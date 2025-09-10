#!/bin/bash

# Exit on any error
set -e

echo "Starting Modulo CMS development container..."

# Wait for database to be ready (if using external DB)
echo "Waiting for services to be ready..."
sleep 2

# Ensure SQLite database exists before Composer (package:discover may boot app)
echo "Ensuring SQLite database exists..."
mkdir -p database
if [ ! -f database/database.sqlite ]; then
    touch database/database.sqlite
fi

# Install PHP dependencies first
echo "Installing PHP dependencies..."
composer install --no-interaction --optimize-autoloader

# Run Laravel setup commands
echo "Running Laravel setup..."

# Generate app key if not exists
if [ ! -f .env ] || ! grep -q "APP_KEY=" .env || [ -z "$(grep APP_KEY= .env | cut -d'=' -f2)" ]; then
    echo "Generating application key..."
    php artisan key:generate --no-interaction
fi

# Clear and cache config
echo "Clearing and caching configuration..."
php artisan config:clear
php artisan config:cache

# Run migrations
echo "Running database migrations..."
php artisan migrate --force

# Seed database if needed
echo "Seeding database..."
php artisan db:seed --force

# Install and activate modern-react theme only
echo "Installing modern-react theme..."
php artisan theme:install modern-react --activate || echo "Modern-react theme install/activate failed, continuing..."

# Publish assets for all installed themes
echo "Publishing theme assets..."
php -r "require 'vendor/autoload.php'; $app = require 'bootstrap/app.php'; $app->make(Illuminate\\Contracts\\Console\\Kernel::class); $ok = $app->make(App\\Services\\ThemeManager::class)->publishAllAssets(); echo ($ok ? 'Theme assets published' : 'Publishing theme assets failed'), PHP_EOL;" || echo "Publishing theme assets step encountered an error (continuing)"

# Create storage link for media files
echo "Creating storage link..."
php artisan storage:link || echo "Storage link already exists"

# Restore missing media files
echo "Restoring media files..."
php artisan media:restore || echo "Media restoration failed, continuing..."

# Clear route cache (skip caching in development to avoid closure errors)
echo "Clearing route cache..."
php artisan route:clear
# php artisan route:cache

# Clear view cache
echo "Clearing view cache..."
echo "Ensuring view compiled directory exists..."
mkdir -p storage/framework/views || true
php artisan view:clear || echo "view:clear failed (continuing)"

# Set proper permissions
echo "Setting permissions..."
# Ensure directories exist before changing permissions
mkdir -p storage bootstrap/cache public/themes || true
# Some hosts (e.g., bind mounts with restrictive perms) may not allow these; don't exit on failure
chmod -R 777 storage bootstrap/cache public/themes || true
chown -R www-data:www-data storage bootstrap/cache public/themes || true

echo "Setup complete! Starting Laravel development server..."

# Start the Laravel development server
exec php artisan serve --host=0.0.0.0 --port=8000
