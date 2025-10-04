#!/bin/bash

DOCKER_CMD=$(command -v podman || command -v docker)

case "$1" in
  start|up)
    echo "🚀 Starting dev stack..."
    $DOCKER_CMD compose up -d
    echo "✅ Started! Backend: http://localhost:8080 | Frontend: http://localhost:5173"
    ;;
  stop|down)
    echo "🛑 Stopping..."
    $DOCKER_CMD compose down
    ;;
  logs)
    $DOCKER_CMD compose logs -f
    ;;
  shell)
    $DOCKER_CMD compose exec backend sh
    ;;
  rebuild)
    echo "🔨 Rebuilding..."
    $DOCKER_CMD compose build --no-cache && $DOCKER_CMD compose up -d
    ;;
  setup)
    THEME=${DEFAULT_THEME:-modern-react}
    echo "🎯 Running first-time setup..."
    echo "📦 Building and starting containers..."
    $DOCKER_CMD compose build && $DOCKER_CMD compose up -d
    echo "⏳ Waiting for backend to be ready..."
    for i in {1..30}; do
      if $DOCKER_CMD compose exec backend php -v > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
      fi
      echo "   Still waiting... ($i/30)"
      sleep 2
    done
    echo "🗄️ Setting up database..."
    $DOCKER_CMD compose exec backend php artisan migrate:fresh --seed
    echo "🎨 Installing theme: $THEME"
    $DOCKER_CMD compose exec backend php artisan theme:install $THEME --activate
    echo ""
    echo "🎉 Setup complete!"
    echo "📱 Backend:  http://localhost:8080"
    echo "⚡ Frontend: http://localhost:5173"
    echo "🔐 Login:    admin@example.com / password"
    echo "🎨 Theme:    $THEME"
    ;;
  nuke)
    echo "⚠️  WARNING: This will remove ALL containers, volumes, and images!"
    read -p "Type 'NUKE' to confirm: " CONFIRM
    if [ "$CONFIRM" != "NUKE" ]; then
      echo "❌ Aborted."
      exit 1
    fi
    echo "💥 Stopping and removing containers..."
    $DOCKER_CMD compose down -v --remove-orphans
    echo "🗑️  Pruning images..."
    $DOCKER_CMD image prune -a -f
    echo "🧹 Cleaning up volumes..."
    $DOCKER_CMD volume prune -f
    echo "✅ Nuke complete! Run './docker.sh setup' to start fresh."
    ;;
  *)
    echo "Usage: ./docker.sh [start|stop|logs|shell|rebuild|setup|nuke]"
    echo ""
    echo "  setup   - First-time setup (builds, seeds DB, installs theme)"
    echo "  start   - Start services"
    echo "  stop    - Stop services"
    echo "  logs    - View logs"
    echo "  shell   - Open backend shell"
    echo "  rebuild - Rebuild from scratch"
    echo "  nuke    - Complete cleanup (removes everything)"
    ;;
esac
