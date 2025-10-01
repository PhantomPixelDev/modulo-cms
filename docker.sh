#!/bin/bash

# Development environment startup script

echo "🚀 Starting Modulo CMS development environment..."

# Check if .env.development exists, if not copy from .env.example
if [ ! -f .env.development ]; then
    echo "📋 Creating .env.development file..."
    cp .env.example .env.development
    echo "✅ Created .env.development - Please edit it with your local settings"
fi

# Copy development environment to .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Setting up .env file for development..."
    cp .env.development .env
fi

# Start the development environment
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec -T app php artisan migrate

# Install npm dependencies if needed
echo "📦 Installing npm dependencies..."
docker-compose exec -T node npm install

echo ""
echo "🎉 Modulo CMS development environment is ready!"
echo ""
echo "📊 Services:"
echo "   • Laravel App: http://localhost:8080"
echo "   • Redis: localhost:6379"
echo ""
echo "🔧 Useful commands:"
echo "   • View logs: ./docker.sh logs"
echo "   • Stop: ./docker.sh stop"
echo "   • Restart: ./docker.sh restart"
echo "   • Run artisan commands: ./docker.sh artisan [command]"
echo "   • Run npm commands: ./docker.sh npm [command]"
echo ""
echo "📝 Don't forget to:"
echo "   • Update .env.development with your specific settings"
echo "   • Run 'php artisan key:generate' if needed"
echo ""
