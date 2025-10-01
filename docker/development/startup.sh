#!/bin/bash

# Development startup script for Laravel + React application

set -e

echo "🚀 Starting Modulo CMS in development mode..."

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down Modulo CMS..."
    exit 0
}

# Set cleanup trap
trap cleanup SIGTERM SIGINT

# Ensure database exists
if [ ! -f database/database.sqlite ]; then
    echo "📦 Creating SQLite database..."
    touch database/database.sqlite
    chmod 664 database/database.sqlite
    chown www-data:www-data database/database.sqlite
fi

# Generate application key if not exists
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    echo "🔑 Generating application key..."
    php artisan key:generate --force
fi

# Run database migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force

# Install npm dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Build assets for production or watch for development
if [ "$NODE_ENV" = "production" ]; then
    echo "🔨 Building assets for production..."
    npm run build
else
    echo "🔥 Starting Vite development server..."
    # Start Vite in background
    npm run dev &
    VITE_PID=$!
fi

# Start Laravel development server with queue worker
echo "⚡ Starting Laravel development server..."
php artisan serve --host=0.0.0.0 --port=8000 &

echo "📋 Starting queue worker..."
php artisan queue:work --tries=3 --timeout=90 &

echo "🗂️ Starting file storage link..."
php artisan storage:link || true

# Wait for all background processes
wait
