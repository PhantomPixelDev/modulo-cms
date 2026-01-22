#!/bin/bash

# Modulo CMS Helper Script
# Usage: ./modulo.sh [command] [environment]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DEV="docker-dev/docker-compose.yml"
COMPOSE_PROD="docker/docker-compose.yml"

print_usage() {
    echo "Modulo CMS Helper"
    echo ""
    echo "Usage:"
    echo "  ./modulo.sh <command> [environment]"
    echo ""
    echo "Commands:"
    echo "  up          Start services"
    echo "  down        Stop and remove containers"
    echo "  restart     Restart services"
    echo "  build       Build images"
    echo "  logs        Show logs"
    echo "  shell       Open shell in app container"
    echo "  artisan     Run artisan command in app container"
    echo "  migrate     Run migrations"
    echo "  seed        Run database seeders"
    echo "  test        Run tests"
    echo "  status      Show container status"
    echo ""
    echo "Environments:"
    echo "  dev         Development (docker-dev) - default"
    echo "  prod        Production (docker)"
    echo ""
    echo "Examples:"
    echo "  ./modulo.sh up dev"
    echo "  ./modulo.sh restart"
    echo "  ./modulo.sh logs prod"
    echo "  ./modulo.sh artisan migrate:status dev"
    echo "  ./modulo.sh test dev"
}

detect_env() {
    if [[ -z "$ENV" ]]; then
        if [[ -f "$COMPOSE_DEV" ]]; then
            ENV="dev"
        elif [[ -f "$COMPOSE_PROD" ]]; then
            ENV="prod"
        else
            echo "Error: No docker-compose files found"
            exit 1
        fi
    fi
}

get_compose_file() {
    case "$ENV" in
        dev)
            echo "$COMPOSE_DEV"
            ;;
        prod)
            echo "$COMPOSE_PROD"
            ;;
        *)
            echo "Error: Unknown environment '$ENV'"
            exit 1
            ;;
    esac
}

get_container_name() {
    case "$ENV" in
        dev)
            echo "modulo-dev-app"
            ;;
        prod)
            echo "modulo-php"
            ;;
        *)
            echo "Error: Unknown environment '$ENV'"
            exit 1
            ;;
    esac
}

run_compose() {
    local compose_file=$(get_compose_file)
    docker compose -f "$compose_file" "$@"
}

run_app_command() {
    local container=$(get_container_name)
    docker exec -it "$container" "$@"
}

case "${1:-}" in
    up)
        ENV="${2:-}"
        detect_env
        echo "Starting $ENV environment..."
        run_compose up -d --build
        echo "✅ Services started"
        ;;
    down)
        ENV="${2:-}"
        detect_env
        echo "Stopping $ENV environment..."
        run_compose down
        echo "✅ Services stopped"
        ;;
    restart)
        ENV="${2:-}"
        detect_env
        echo "Restarting $ENV environment..."
        run_compose down
        run_compose up -d --build
        echo "✅ Services restarted"
        ;;
    build)
        ENV="${2:-}"
        detect_env
        echo "Building $ENV environment..."
        run_compose build
        echo "✅ Images built"
        ;;
    logs)
        ENV="${2:-}"
        detect_env
        echo "Showing logs for $ENV environment..."
        run_compose logs -f
        ;;
    shell)
        ENV="${2:-}"
        detect_env
        echo "Opening shell in $ENV app container..."
        run_app_command bash
        ;;
    artisan)
        ENV="${3:-dev}"
        detect_env
        shift 2
        echo "Running artisan command in $ENV: artisan $*"
        run_app_command php artisan "$@"
        ;;
    migrate)
        ENV="${2:-}"
        detect_env
        echo "Running migrations in $ENV..."
        run_app_command php artisan migrate --force
        echo "✅ Migrations completed"
        ;;
    seed)
        ENV="${2:-}"
        detect_env
        echo "Running seeders in $ENV..."
        run_app_command php artisan db:seed --force
        echo "✅ Seeders completed"
        ;;
    test)
        ENV="${2:-}"
        detect_env
        echo "Running tests in $ENV..."
        run_app_command php artisan test
        ;;
    status)
        ENV="${2:-}"
        detect_env
        echo "Status for $ENV environment:"
        run_compose ps
        ;;
    help|--help|-h|"")
        print_usage
        ;;
    *)
        echo "Error: Unknown command '$1'"
        echo ""
        print_usage
        exit 1
        ;;
esac
