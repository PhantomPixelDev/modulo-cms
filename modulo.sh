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
    echo "  migrate-status  Show migration status"
    echo "  schema-dump     Generate database schema dump (non-pruning)"
    echo "  seed        Run database seeders"
    echo "  bootstrap-dev  Rebuild dev from scratch (down -v, up --build, composer install, migrate, seed)"
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
    echo "  ./modulo.sh bootstrap-dev --force"
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

confirm_destructive_action() {
    local prompt_message="$1"
    local force_flag="$2"

    if [[ "$force_flag" == "--force" ]]; then
        return 0
    fi

    echo "⚠️  $prompt_message"
    read -r -p "Type YES to continue: " confirmation

    if [[ "$confirmation" != "YES" ]]; then
        echo "Aborted."
        exit 1
    fi
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
        SCHEMA_FILE="$SCRIPT_DIR/database/schema/pgsql-schema.sql"
        SCHEMA_BAK="$SCRIPT_DIR/database/schema/pgsql-schema.sql.bak"
        RESTORE_SCHEMA=0

        if [[ -f "$SCHEMA_FILE" ]]; then
            if ! run_app_command sh -lc 'command -v psql >/dev/null 2>&1'; then
                echo "ℹ️  psql not found in app container; temporarily disabling schema dump for migrate"
                mv "$SCHEMA_FILE" "$SCHEMA_BAK"
                RESTORE_SCHEMA=1
            fi
        fi

        run_app_command php artisan migrate --force

        if [[ "$RESTORE_SCHEMA" -eq 1 && -f "$SCHEMA_BAK" ]]; then
            mv "$SCHEMA_BAK" "$SCHEMA_FILE"
        fi
        echo "✅ Migrations completed"
        ;;
    migrate-status)
        ENV="${2:-}"
        detect_env
        echo "Showing migration status in $ENV..."
        run_app_command php artisan migrate:status
        ;;
    schema-dump)
        ENV="${2:-}"
        detect_env
        echo "Generating schema dump in $ENV (without pruning migrations)..."
        mkdir -p "$SCRIPT_DIR/database/schema"
        run_compose exec -T db sh -lc 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --schema-only --no-owner --no-acl' > "$SCRIPT_DIR/database/schema/pgsql-schema.sql"
        echo "✅ Schema dump generated"
        ;;
    seed)
        ENV="${2:-}"
        detect_env
        echo "Running seeders in $ENV..."
        run_app_command php artisan db:seed --force
        echo "✅ Seeders completed"
        ;;
    bootstrap-dev)
        ENV="dev"
        local_force="${2:-}"
        confirm_destructive_action "This will delete dev volumes/data (docker compose down -v)." "$local_force"

        echo "Rebuilding dev stack from scratch..."
        run_compose down -v
        run_compose up -d --build

        echo "Installing dependencies in dev app container..."
        if ! run_compose exec -T app composer install --no-interaction --prefer-dist; then
            echo "⚠️  Composer install failed. Clearing cache and retrying once..."
            run_compose exec -T app sh -lc 'composer clear-cache && composer install --no-interaction --prefer-dist --no-progress'
        fi

        echo "Running DB setup (migrate + seed)..."
        "$SCRIPT_DIR/modulo.sh" migrate dev
        "$SCRIPT_DIR/modulo.sh" seed dev

        echo "✅ Dev bootstrap completed"
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
