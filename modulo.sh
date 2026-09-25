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
    echo "              (environment comes from MODULO_ENV, not a trailing argument)"
    echo "  migrate     Run migrations"
    echo "  migrate-status  Show migration status"
    echo "  schema-dump     Generate database schema dump (non-pruning)"
    echo "  seed        Run database seeders"
    echo "  bootstrap-dev  Rebuild dev from scratch (down -v, up --build, composer install, migrate, seed)"
    echo "  test        Run tests"
    echo "  status      Show container status"
    echo "  version     Show the running version and install channel"
    echo "  install     First-run setup (migrate, bootstrap data, administrator)"
    echo "  update      Pull new images (prod) and migrate safely"
    echo "  backup      Dump the database"
    echo "  restore     Restore a dump (destructive)"
    echo ""
    echo "Environments:"
    echo "  dev         Development (docker-dev) - default"
    echo "  prod        Production (docker)"
    echo ""
    echo "Examples:"
    echo "  ./modulo.sh up dev"
    echo "  ./modulo.sh restart"
    echo "  ./modulo.sh logs prod"
    echo "  ./modulo.sh artisan migrate:status"
    echo "  MODULO_ENV=prod ./modulo.sh artisan queue:failed"
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

# Container runtime: docker if present, otherwise podman. Override with
# MODULO_RUNTIME=podman when both are installed.
RUNTIME="${MODULO_RUNTIME:-}"

detect_runtime() {
    if [[ -n "$RUNTIME" ]]; then
        :
    elif command -v docker >/dev/null 2>&1; then
        RUNTIME="docker"
    elif command -v podman >/dev/null 2>&1; then
        RUNTIME="podman"
    else
        echo "Error: neither docker nor podman found on PATH." >&2
        echo "Install one, or set MODULO_RUNTIME to the command to use." >&2
        exit 1
    fi

    if ! "$RUNTIME" compose version >/dev/null 2>&1; then
        echo "Error: '$RUNTIME compose' is unavailable." >&2
        echo "Install the Compose plugin (docker) or podman-compose provider (podman)." >&2
        exit 1
    fi
}

run_compose() {
    local compose_file=$(get_compose_file)
    local -a files=(-f "$compose_file")
    detect_runtime

    if [[ "$ENV" == "prod" && -n "${MODULO_BUILD:-}" ]]; then
        files+=(-f "$SCRIPT_DIR/docker/docker-compose.build.yml")
    fi

    if [[ "$ENV" == "prod" ]]; then
        # Compose interpolates DB_*, WEB_PORT and MODULO_TAG from .env.prod
        "$RUNTIME" compose --env-file "$SCRIPT_DIR/.env.prod" "${files[@]}" "$@"
    else
        "$RUNTIME" compose "${files[@]}" "$@"
    fi
}

# Extra `-e KEY=VALUE` arguments for the next run_app_command call.
EXEC_ENV=()

run_app_command() {
    local container=$(get_container_name)
    detect_runtime
    # No -t when stdin is not a terminal, so CI and scripted use work.
    if [[ -t 0 ]]; then
        "$RUNTIME" exec -it "${EXEC_ENV[@]}" "$container" "$@"
    else
        "$RUNTIME" exec -i "${EXEC_ENV[@]}" "$container" "$@"
    fi
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
        if [[ "$ENV" == "prod" && -z "${MODULO_BUILD:-}" ]]; then
            run_compose pull
            run_compose up -d
        else
            run_compose up -d --build
        fi
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
        ENV="${MODULO_ENV:-}"
        detect_env
        shift
        if [[ $# -eq 0 ]]; then
            echo "Usage: [MODULO_ENV=prod] ./modulo.sh artisan <command> [args...]" >&2
            exit 1
        fi
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
        # artisan schema:dump also stores the migrations table rows; a plain pg_dump
        # --schema-only baseline makes fresh installs re-run every migration and fail.
        run_compose exec -T app php artisan schema:dump
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
        confirm_destructive_action "This will delete dev volumes and data (compose down -v)." "$local_force"

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
        EXEC_ENV=(
            -e CACHE_STORE=array
            -e SESSION_DRIVER=array
            -e QUEUE_CONNECTION=sync
            -e MAIL_MAILER=array
        )
        run_app_command php artisan test
        EXEC_ENV=()
        ;;
    status)
        ENV="${2:-}"
        detect_env
        echo "Status for $ENV environment:"
        run_compose ps
        ;;
    version)
        ENV="${2:-}"
        detect_env
        run_app_command php artisan tinker --execute="echo App\\Support\\Version::current().' ('.App\\Support\\InstallChannel::detect().')'.PHP_EOL;"
        ;;
    install)
        ENV="${2:-}"
        detect_env
        echo "Setting up Modulo CMS in $ENV..."
        run_app_command php artisan modulo:install
        ;;
    update)
        ENV="${2:-}"
        detect_env
        # Deliberately two steps. Fetching new code is channel-specific and, on
        # Docker, cannot happen from inside the container at all: the image is
        # immutable and public/ is baked into the web image. So pull the new
        # image first, then migrate what is now on disk.
        if [[ "$ENV" == "prod" && -z "${MODULO_BUILD:-}" ]]; then
            echo "Pulling the published images..."
            run_compose pull
            run_compose up -d
        fi
        echo "Migrating..."
        run_app_command php artisan modulo:upgrade
        ;;
    backup)
        ENV="${2:-}"
        detect_env
        run_app_command php artisan modulo:db-backup
        ;;
    restore)
        ENV="${2:-}"
        detect_env
        DUMP="${3:-}"
        if [[ -z "$DUMP" ]]; then
            echo "Usage: ./modulo.sh restore <env> <dump-file>" >&2
            echo "Restoring overwrites the current database. Take a backup first." >&2
            exit 1
        fi
        if [[ ! -f "$DUMP" ]]; then
            echo "Error: '$DUMP' not found." >&2
            exit 1
        fi
        confirm_destructive_action "This will overwrite the $ENV database with '$DUMP'." ""
        detect_runtime
        # Stop everything that writes, so nothing lands mid-restore.
        run_compose stop app queue scheduler >/dev/null 2>&1 || true
        # Credentials come from the env file the stack actually uses, not from
        # whatever happens to be exported in this shell.
        ENV_FILE="$SCRIPT_DIR/.env.dev"
        [[ "$ENV" == "prod" ]] && ENV_FILE="$SCRIPT_DIR/.env.prod"
        env_value() { [[ -f "$ENV_FILE" ]] && sed -n "s/^$1=//p" "$ENV_FILE" | tail -n1 | sed -e 's/^"//' -e 's/"$//'; }
        RESTORE_DB="$(env_value DB_DATABASE)"
        RESTORE_USER="$(env_value DB_USERNAME)"
        [[ -n "$RESTORE_DB" ]] || RESTORE_DB=$([[ "$ENV" == "prod" ]] && echo modulo_prod || echo modulo)
        [[ -n "$RESTORE_USER" ]] || RESTORE_USER=modulo
        echo "Restoring into '$RESTORE_DB'..."
        # A plain pg_dump has no DROP statements, so loading it over existing
        # tables fails half-way while psql still exits 0. Start from an empty
        # schema, stop at the first error, and do it all in one transaction so
        # a failure leaves the old data untouched.
        if { printf 'DROP SCHEMA IF EXISTS public CASCADE;\nCREATE SCHEMA public;\n'; cat "$DUMP"; } \
            | "$RUNTIME" compose $( [[ "$ENV" == "prod" ]] && echo "--env-file $ENV_FILE" ) -f "$(get_compose_file)" \
                exec -T db psql -v ON_ERROR_STOP=1 --single-transaction --quiet -U "$RESTORE_USER" -d "$RESTORE_DB" >/dev/null; then
            echo "✅ Restored"
        else
            echo "❌ Restore failed and was rolled back; the database is unchanged. The writers are still stopped so you can retry." >&2
            exit 1
        fi
        run_compose start app queue scheduler >/dev/null 2>&1 || true
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
