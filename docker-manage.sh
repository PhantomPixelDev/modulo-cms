!/bin/bash

# Modulo CMS Docker utility script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if docker-compose exists
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed or not available"
        exit 1
    fi
}

# Start development environment
start_dev() {
    log_info "Starting development environment..."
    check_docker_compose

    if [ ! -f .env.development ]; then
        log_warning ".env.development not found. Creating from template..."
        cp .env.example .env.development
        log_info "Please edit .env.development with your settings"
    fi

    cp .env.development .env
    docker-compose up -d
    sleep 10

    log_success "Development environment started!"
    log_info "Laravel App: http://localhost:8080"
}

# Stop all containers
stop_all() {
    log_info "Stopping all containers..."
    check_docker_compose
    docker-compose down
    log_success "All containers stopped"
}

# View logs
show_logs() {
    local service=${2:-app}
    log_info "Showing logs for service: $service"
    check_docker_compose
    docker-compose logs -f "$service"
}

# Restart all containers
restart() {
    log_info "Restarting all containers..."
    check_docker_compose
    docker-compose restart
    log_success "All containers restarted"
}

# Run artisan command
run_artisan() {
    local command="$*"
    log_info "Running artisan command: php artisan $command"
    check_docker_compose
    docker-compose exec app php artisan "$command"
}

# Run npm command
run_npm() {
    local command="$*"
    log_info "Running npm command: npm $command"
    check_docker_compose
    docker-compose exec node npm "$command"
}

# Run composer command
run_composer() {
    local command="$*"
    log_info "Running composer command: composer $command"
    check_docker_compose
    docker-compose exec app composer "$command"
}

# Build assets
build_assets() {
    log_info "Building frontend assets..."
    check_docker_compose
    docker-compose exec node npm run build
    log_success "Assets built successfully"
}

# Run tests
run_tests() {
    log_info "Running tests..."
    check_docker_compose
    docker-compose exec app php artisan test
}

# Show status
show_status() {
    log_info "Container status:"
    check_docker_compose
    docker-compose ps
}

# Clean up everything (nuclear option)
cleanup() {
    log_warning "This will remove all containers, volumes, and images!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up Docker environment..."
        check_docker_compose
        docker-compose down -v --rmi all
        docker system prune -f
        log_success "Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
}

# Show help
show_help() {
    echo "Modulo CMS Docker Utility Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start development environment"
    echo "  stop      Stop all containers"
    echo "  restart   Restart all containers"
    echo "  logs      Show logs (use 'logs [service]' for specific service)"
    echo "  status    Show container status"
    echo "  artisan   Run artisan command (e.g., 'artisan migrate')"
    echo "  npm       Run npm command (e.g., 'npm install')"
    echo "  composer  Run composer command (e.g., 'composer install')"
    echo "  build     Build frontend assets"
    echo "  test      Run tests"
    echo "  cleanup   Remove all containers, volumes, and images"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs nginx"
    echo "  $0 artisan migrate:fresh --seed"
    echo "  $0 npm run dev"
}

# Main command handler
case "${1:-help}" in
    start)
        start_dev
        ;;
    stop)
        stop_all
        ;;
    restart)
        restart
        ;;
    logs)
        show_logs "$@"
        ;;
    status)
        show_status
        ;;
    artisan)
        shift
        run_artisan "$@"
        ;;
    npm)
        shift
        run_npm "$@"
        ;;
    composer)
        shift
        run_composer "$@"
        ;;
    build)
        build_assets
        ;;
    test)
        run_tests
        ;;
    cleanup)
        cleanup
        ;;
    help|*)
        show_help
        ;;
esac
