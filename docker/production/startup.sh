#!/bin/bash

# Production startup script for Laravel + React application

set -e

echo "🚀 Starting Modulo CMS in production mode..."

# Generate application key if not exists
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    echo "🔑 Generating application key..."
    php artisan key:generate --force
fi

# Run database migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force

# Optimize Laravel
echo "⚡ Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link if it doesn't exist
if [ ! -L public/storage ]; then
    echo "🔗 Creating storage link..."
    php artisan storage:link
fi

# Set proper permissions
echo "🔒 Setting proper permissions..."
chown -R www-data:www-data storage
chmod -R 755 storage

echo "✅ Modulo CMS is ready!"
echo "🌐 Application will be available at http://localhost:8080"

# Start PHP-FPM
exec php-fpm
