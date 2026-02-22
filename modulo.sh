#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DEV="$SCRIPT_DIR/docker-dev/docker-compose.yml"
COMPOSE_PROD="$SCRIPT_DIR/docker-prod/docker-compose.yml"

usage() {
  cat <<'EOF'
Modulo CMS helper

Usage:
  ./modulo.sh <command> [dev|prod]

Commands:
  up            Start services (build images)
  down          Stop services
  restart       Restart services
  build         Build images
  logs          Follow logs
  shell         Open shell in app service
  artisan ...   Run artisan command (env can be last arg)
  migrate       Run migrations
  migrate-status Show migration status
  schema-dump   Dump PostgreSQL schema to database/schema/pgsql-schema.sql
  seed          Run database seeders
  test          Run test suite
  status        Show service status
  bootstrap-dev Recreate dev stack and run migrate+seed

Examples:
  ./modulo.sh up dev
  ./modulo.sh logs prod
  ./modulo.sh artisan migrate:status dev
  ./modulo.sh bootstrap-dev --force
EOF
}

ensure_env() {
  local env="${1:-dev}"
  case "$env" in
    dev|prod) echo "$env" ;;
    *) echo "Error: invalid environment '$env' (use dev|prod)"; exit 1 ;;
  esac
}

compose_file() {
  local env="$1"
  if [[ "$env" == "dev" ]]; then
    echo "$COMPOSE_DEV"
  else
    echo "$COMPOSE_PROD"
  fi
}

run_compose() {
  local env="$1"
  shift
  docker compose -f "$(compose_file "$env")" "$@"
}

run_app() {
  local env="$1"
  shift
  run_compose "$env" exec app "$@"
}

confirm_yes() {
  local message="$1"
  local force_flag="${2:-}"
  if [[ "$force_flag" == "--force" ]]; then
    return 0
  fi
  echo "⚠️  $message"
  read -r -p "Type YES to continue: " answer
  [[ "$answer" == "YES" ]] || { echo "Aborted."; exit 1; }
}

COMMAND="${1:-help}"

case "$COMMAND" in
  up|down|restart|build|logs|shell|migrate|migrate-status|schema-dump|seed|test|status)
    ENVIRONMENT="$(ensure_env "${2:-dev}")"
    ;;
  *)
    ENVIRONMENT="dev"
    ;;
esac

case "$COMMAND" in
  up)
    run_compose "$ENVIRONMENT" up -d --build
    ;;
  down)
    run_compose "$ENVIRONMENT" down
    ;;
  restart)
    run_compose "$ENVIRONMENT" down
    run_compose "$ENVIRONMENT" up -d --build
    ;;
  build)
    run_compose "$ENVIRONMENT" build
    ;;
  logs)
    run_compose "$ENVIRONMENT" logs -f
    ;;
  shell)
    run_app "$ENVIRONMENT" sh
    ;;
  artisan)
    shift
    if [[ $# -eq 0 ]]; then
      echo "Error: artisan command required"
      exit 1
    fi
    last_arg="${!#}"
    if [[ "$last_arg" == "dev" || "$last_arg" == "prod" ]]; then
      ENVIRONMENT="$last_arg"
      set -- "${@:1:$(($#-1))}"
    else
      ENVIRONMENT="dev"
    fi
    run_app "$ENVIRONMENT" php artisan "$@"
    ;;
  migrate)
    run_app "$ENVIRONMENT" php artisan migrate --force
    ;;
  migrate-status)
    run_app "$ENVIRONMENT" php artisan migrate:status
    ;;
  schema-dump)
    mkdir -p "$SCRIPT_DIR/database/schema"
    run_compose "$ENVIRONMENT" exec -T db sh -lc 'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --schema-only --no-owner --no-acl' > "$SCRIPT_DIR/database/schema/pgsql-schema.sql"
    ;;
  seed)
    run_app "$ENVIRONMENT" php artisan db:seed --force
    ;;
  test)
    run_app "$ENVIRONMENT" php artisan test
    ;;
  status)
    run_compose "$ENVIRONMENT" ps
    ;;
  bootstrap-dev)
    force_flag="${2:-}"
    confirm_yes "This will delete dev volumes/data (docker compose down -v)." "$force_flag"
    run_compose dev down -v
    run_compose dev up -d --build
    run_compose dev exec -T app composer install --no-interaction --prefer-dist || true
    "$SCRIPT_DIR/modulo.sh" migrate dev
    "$SCRIPT_DIR/modulo.sh" seed dev
    ;;
  help|--help|-h|"")
    usage
    ;;
  *)
    echo "Error: unknown command '$COMMAND'"
    echo
    usage
    exit 1
    ;;
esac
