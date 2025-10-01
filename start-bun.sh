#!/bin/bash

# Modulo CMS - Enhanced Bun Development Server with Auto-Reload
# Configuration - Change this to use a different theme
DEFAULT_THEME="modern-react"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Starting Enhanced Modulo CMS with Bun...${NC}"
echo -e "${BLUE}📋 Theme to install: ${DEFAULT_THEME}${NC}"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Bun is not installed. Please install it first:${NC}"
    echo "curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Auto-reload file watcher has been disabled in this script.

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${PURPLE}📦 Installing dependencies with bun...${NC}"
    bun install
fi

# Check if vendor directory exists (PHP dependencies)
if [ ! -d "vendor" ]; then
    echo -e "${PURPLE}🎼 Installing PHP dependencies...${NC}"
    composer install --no-dev --optimize-autoloader
fi

# Kill any existing processes
echo -e "${YELLOW}🔄 Stopping existing processes...${NC}"
pkill -f "php artisan serve" 2>/dev/null || true
pkill -f "bun run dev" 2>/dev/null || true
pkill -f "artisan serve" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Check environment and database setup BEFORE starting servers
echo -e "${BLUE}🔧 Checking environment...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}🔑 Generating application key...${NC}"
    php artisan key:generate --force
fi

# Function to install and activate theme
install_theme() {
    echo -e "${PURPLE}🎨 Installing and activating ${DEFAULT_THEME} theme...${NC}"
    php artisan theme:install "${DEFAULT_THEME}" --activate
}

# Check database and setup if needed
echo -e "${BLUE}🗄️ Checking database...${NC}"
check_database() {
    # Check if database file exists (for SQLite)
    if [ -f "database/database.sqlite" ]; then
        echo -e "${GREEN}✅ Database file exists${NC}"

        # Check if tables exist
        if php artisan tinker --execute="echo 'Tables: ' . count(DB::select('SELECT name FROM sqlite_master WHERE type=\"table\"'));" 2>/dev/null | grep -q "Tables: 0"; then
            echo -e "${YELLOW}⚠️ Database is empty, running migrations and seeds...${NC}"
            php artisan migrate:fresh --seed --force
            install_theme
        else
            echo -e "${GREEN}✅ Database tables exist${NC}"
            # Check if React theme exists
            if ! php artisan tinker --execute="echo App\Models\Theme::where('template_engine', 'react')->exists() ? 'yes' : 'no';" 2>/dev/null | grep -q "yes"; then
                install_theme
            fi
        fi
    else
        echo -e "${YELLOW}📝 Creating database file...${NC}"
        touch database/database.sqlite
        echo -e "${GREEN}🔄 Running migrations and seeds...${NC}"
        php artisan migrate:fresh --seed --force
        install_theme
    fi
}

# Run database check BEFORE starting servers
check_database

# Auto-restart functions removed as watcher is disabled

# Start PHP development server in background
echo -e "${GREEN}🐘 Starting PHP server on http://localhost:8080...${NC}"
php artisan serve --host=0.0.0.0 --port=8080 &
PHP_PID=$!

# Wait for PHP server to start
sleep 3

# Start Vite development server with bun
echo -e "${GREEN}⚡ Starting Vite dev server with Bun on http://localhost:5173...${NC}"
bun run dev &
VITE_PID=$!

# File watcher removed; manual restarts are required when files change

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${RED}🛑 Shutting down servers...${NC}"

    # Kill main processes
    kill $PHP_PID 2>/dev/null || true
    kill $VITE_PID 2>/dev/null || true

    # Kill any remaining processes
    pkill -f "php artisan serve" 2>/dev/null || true
    pkill -f "bun run dev" 2>/dev/null || true

    echo -e "${GREEN}✅ All servers stopped${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

echo ""
echo -e "${GREEN}🎉 Enhanced Modulo CMS is running!${NC}"
echo -e "${CYAN}📱 Frontend (Vite): http://localhost:5173${NC}"
echo -e "${CYAN}🌐 Backend (PHP):  http://localhost:8080${NC}"
echo -e "${YELLOW}🔄 Auto-reload disabled - manual restart required${NC}"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}"

# Wait for both processes
wait
