#!/bin/bash

# Production environment setup script

echo "🚀 Setting up Modulo CMS production environment..."

# Check if .env.production exists, if not copy from .env.example
if [ ! -f .env.production ]; then
    echo "📋 Creating .env.production file..."
    cp .env.example .env.production
    echo "✅ Created .env.production - Please edit it with your production settings"
    echo ""
    echo "⚠️  IMPORTANT: Update .env.production with your production values:"
    echo "   • APP_URL (your domain)"
    echo "   • Database credentials"
    echo "   • Redis password"
    echo "   • Mail settings"
    echo "   • Generate APP_KEY"
fi

# Copy production environment to .env
echo "📋 Setting up production .env file..."
cp .env.production .env

# Build and start production containers
echo "🐳 Building and starting production containers..."
docker-compose -f docker-compose.yml --profile production up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

echo ""
echo "🎉 Modulo CMS production environment is ready!"
echo ""
echo "📊 Services:"
echo "   • Laravel App: http://localhost:8080"
echo "   • Redis: localhost:6379"
echo ""
echo "🔧 Next steps:"
echo "   • Update your DNS to point to this server"
echo "   • Configure SSL certificate (recommended)"
echo "   • Set up proper backups"
echo "   • Monitor logs: docker-compose logs -f"
echo ""
echo "⚠️  Remember to:"
echo "   • Update .env.production with secure passwords"
echo "   • Run 'php artisan key:generate' to set APP_KEY"
echo "   • Configure firewall rules"
echo ""
