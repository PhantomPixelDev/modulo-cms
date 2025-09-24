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

# Wait briefly for containers to transition to running state
echo "⏳ Waiting for containers to start (initial grace period)..."
sleep 3

# Check container status
echo "📊 Container status:"
podman compose -f docker/docker-compose.yml ps

# Wait until the entrypoint completes setup. The entrypoint prints this line
READY_LOG_MARKER="Setup complete! Starting Laravel development server..."
echo "⏳ Waiting for application setup to finish inside container..."

MAX_WAIT_SECONDS=300
SLEEP_INTERVAL=3
ELAPSED=0

until podman compose -f docker/docker-compose.yml logs app 2>/dev/null | grep -q "$READY_LOG_MARKER"; do
  if [ $ELAPSED -ge $MAX_WAIT_SECONDS ]; then
    echo "❌ Timeout waiting for app setup to complete after ${MAX_WAIT_SECONDS}s."
    echo "ℹ️  You can inspect logs with: podman compose -f docker/docker-compose.yml logs -f app"
    exit 1
  fi
  printf "   Waiting for setup to complete... (%ds/%ds)\r" "$ELAPSED" "$MAX_WAIT_SECONDS"
  sleep $SLEEP_INTERVAL
  ELAPSED=$((ELAPSED + SLEEP_INTERVAL))
done

echo "\n✅ Application setup finished. Laravel dev server should be running."

# At this point, vendor/ should exist and artisan should be usable without errors.
# The entrypoint already runs key:generate, migrate, seed, cache steps.
# If you still want to run additional commands, do it after this point.

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
