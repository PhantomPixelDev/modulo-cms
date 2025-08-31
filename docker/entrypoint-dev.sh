#!/bin/bash

# Exit on any error
set -e

echo "Starting Modulo CMS development container..."

# Wait for database to be ready (if using external DB)
echo "Waiting for services to be ready..."
sleep 2

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

# Install and publish theme assets
echo "Installing theme assets..."
php artisan theme:install modern-react --force || echo "Theme install failed, continuing..."

# Create storage link for media files
echo "Creating storage link..."
php artisan storage:link || echo "Storage link already exists"

# Restore missing media files
echo "Restoring media files..."
php artisan media:restore || echo "Media restoration failed, continuing..."

# Clear and cache routes
echo "Caching routes..."
php artisan route:clear
php artisan route:cache

# Clear view cache
echo "Clearing view cache..."
php artisan view:clear

# Set proper permissions
echo "Setting permissions..."
chmod -R 777 storage bootstrap/cache public/themes
chown -R www-data:www-data storage bootstrap/cache public/themes

echo "Setup complete! Starting Laravel development server..."

# Start the Laravel development server
exec php artisan serve --host=0.0.0.0 --port=8000
