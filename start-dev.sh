#!/bin/bash

# Modulo CMS Development Startup Script
# This script sets up the complete development environment

set -e

echo "🚀 Starting Modulo CMS Development Environment..."

# Stop any existing containers
echo "📦 Stopping existing containers..."
podman compose -f docker/docker-compose.yml down || true

# Build and start containers
echo "🔨 Building and starting containers..."
podman compose -f docker/docker-compose.yml up -d --build

# Wait for containers to be ready
echo "⏳ Waiting for containers to start..."
sleep 10

# Check container status
echo "📊 Container status:"
podman compose -f docker/docker-compose.yml ps

# Wait for app to be ready
echo "⏳ Waiting for app container to be ready..."
for i in {1..30}; do
    if podman compose -f docker/docker-compose.yml exec app php -v > /dev/null 2>&1; then
        echo "✅ App container is ready!"
        break
    fi
    echo "   Waiting... ($i/30)"
    sleep 2
done

# Generate app key if needed
echo "🔑 Ensuring app key is set..."
podman compose -f docker/docker-compose.yml exec app php artisan key:generate --force || true

# Run migrations and seed
echo "🗄️  Running migrations and seeding..."
podman compose -f docker/docker-compose.yml exec app php artisan migrate --force
podman compose -f docker/docker-compose.yml exec app php artisan db:seed --force

# Clear all caches
echo "🧹 Clearing caches..."
podman compose -f docker/docker-compose.yml exec app php artisan cache:clear
podman compose -f docker/docker-compose.yml exec app php artisan config:clear
podman compose -f docker/docker-compose.yml exec app php artisan view:clear

# Verify theme status
echo "🎨 Checking theme status..."
podman compose -f docker/docker-compose.yml exec app php artisan tinker --execute="
try {
    \$theme = App\\Models\\Theme::active()->first();
    if (\$theme) {
        echo '✅ Active theme: ' . \$theme->name . ' (' . \$theme->slug . ')' . PHP_EOL;
        echo '   Template engine: ' . \$theme->template_engine . PHP_EOL;
    } else {
        echo '❌ No active theme found' . PHP_EOL;
    }
} catch (Exception \$e) {
    echo '❌ Error checking theme: ' . \$e->getMessage() . PHP_EOL;
}
" 2>/dev/null || echo "⚠️  Could not check theme status (this is normal on first run)"

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📍 Access your application:"
echo "   🌐 Main app: http://localhost:8080"
echo "   ⚡ Vite HMR: http://localhost:5173"
echo "   📊 Dashboard: http://localhost:8080/dashboard"
echo ""
echo "👤 Default admin credentials:"
echo "   📧 Email: admin@example.com"
echo "   🔒 Password: password"
echo ""
echo "🔧 Useful commands:"
echo "   📋 View logs: podman compose -f docker/docker-compose.yml logs -f"
echo "   🔄 Restart: podman compose -f docker/docker-compose.yml restart"
echo "   🛑 Stop: podman compose -f docker/docker-compose.yml down"
