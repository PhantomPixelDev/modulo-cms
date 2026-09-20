#!/usr/bin/env bash
#
# Modulo CMS installer (Docker or Podman).
#
# Download it, read it, then run it. Piping a script from the internet straight
# into a shell means running code you have not seen.
#
#   curl -fsSLO https://raw.githubusercontent.com/PhantomPixelDev/modulo-cms/main/install.sh
#   less install.sh
#   bash install.sh
#
# It creates a directory, writes a .env.prod with generated secrets, starts the
# stack and prints the URL to finish setup in a browser. It never modifies
# anything outside the directory it creates.

set -euo pipefail

REPO="PhantomPixelDev/modulo-cms"
TARGET_DIR="${MODULO_DIR:-modulo-cms}"
WEB_PORT="${WEB_PORT:-8080}"

info() { printf '  %s\n' "$*"; }
ok() { printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*" >&2; }
die() { printf '\n  \033[31m✗ %s\033[0m\n\n' "$*" >&2; exit 1; }

printf '\n  Modulo CMS installer\n\n'

# --- Prerequisites ----------------------------------------------------------

if command -v docker >/dev/null 2>&1; then
    RUNTIME=docker
elif command -v podman >/dev/null 2>&1; then
    RUNTIME=podman
else
    die "Neither docker nor podman is installed. Install one and run this again."
fi
ok "Container runtime: $RUNTIME"

"$RUNTIME" compose version >/dev/null 2>&1 \
    || die "'$RUNTIME compose' is not available. Install the Compose plugin and run this again."
ok "Compose available"

"$RUNTIME" info >/dev/null 2>&1 \
    || die "$RUNTIME is installed but not running. Start it and run this again."
ok "$RUNTIME is running"

for tool in curl tar; do
    command -v "$tool" >/dev/null 2>&1 || die "$tool is required but not installed."
done

# openssl generates the secrets. Deliberately not PHP: someone installing via
# Docker has no reason to have PHP on the host.
command -v openssl >/dev/null 2>&1 \
    || die "openssl is required to generate secrets. Install it and run this again."
ok "Required tools present"

# --- Port -------------------------------------------------------------------

port_in_use() {
    if command -v ss >/dev/null 2>&1; then
        ss -ltn "sport = :$1" 2>/dev/null | grep -q LISTEN
    elif command -v lsof >/dev/null 2>&1; then
        lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
    else
        return 1
    fi
}

if port_in_use "$WEB_PORT"; then
    die "Port $WEB_PORT is already in use. Re-run with WEB_PORT=8081 bash install.sh"
fi
ok "Port $WEB_PORT is free"

# --- Target directory -------------------------------------------------------

if [ -e "$TARGET_DIR" ]; then
    die "'$TARGET_DIR' already exists. Remove it, or set MODULO_DIR to another name."
fi

mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"
ok "Created $TARGET_DIR/"

# --- Release ----------------------------------------------------------------

# Pin to a published release rather than a moving branch, so an install is
# reproducible and does not pick up whatever main happens to contain.
TAG="${MODULO_TAG:-}"
if [ -z "$TAG" ]; then
    TAG="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null \
        | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -n1 || true)"
fi

if [ -z "$TAG" ]; then
    warn "No published release found yet; using the main branch."
    REF="main"
    TAG="latest"
else
    REF="$TAG"
    ok "Release: $TAG"
fi

BASE="https://raw.githubusercontent.com/${REPO}/${REF}"
curl -fsSL "${BASE}/docker/docker-compose.yml" -o docker-compose.yml \
    || die "Could not download docker-compose.yml for ${REF}."
curl -fsSL "${BASE}/.env.prod.example" -o .env.prod.example \
    || die "Could not download the environment template for ${REF}."
ok "Downloaded deployment files"

# --- Configuration ----------------------------------------------------------

APP_KEY="base64:$(openssl rand -base64 32)"
DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-32)"
APP_URL="${APP_URL:-http://localhost:${WEB_PORT}}"

# sed over the template rather than writing a fresh file, so new settings added
# upstream survive instead of being silently dropped.
sed \
    -e "s|^APP_KEY=.*|APP_KEY=${APP_KEY}|" \
    -e "s|^APP_URL=.*|APP_URL=${APP_URL}|" \
    -e "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" \
    -e "s|^WEB_PORT=.*|WEB_PORT=${WEB_PORT}|" \
    -e "s|^MODULO_TAG=.*|MODULO_TAG=${TAG}|" \
    .env.prod.example > .env.prod

chmod 600 .env.prod
ok "Generated .env.prod with a unique application key and database password"

# --- Start ------------------------------------------------------------------

info "Starting the stack. The first run downloads images and may take a few minutes."

if ! "$RUNTIME" compose --env-file .env.prod -f docker-compose.yml pull 2>/dev/null; then
    warn "Could not pull published images."
    warn "If no release exists yet, clone the repository and use: MODULO_BUILD=1 ./modulo.sh up prod"
    die "Aborting."
fi

"$RUNTIME" compose --env-file .env.prod -f docker-compose.yml up -d \
    || die "The stack failed to start. Check: $RUNTIME compose -f docker-compose.yml logs"

# --- Wait for health --------------------------------------------------------

info "Waiting for the site to come up..."
for _ in $(seq 1 60); do
    if curl -fsS "http://localhost:${WEB_PORT}/health" >/dev/null 2>&1; then
        READY=1
        break
    fi
    sleep 3
done

if [ "${READY:-0}" != "1" ]; then
    warn "The site did not respond in time. It may still be starting."
    warn "Check with: cd ${TARGET_DIR} && $RUNTIME compose -f docker-compose.yml logs"
else
    ok "The site is up"
fi

printf '\n  \033[32mReady.\033[0m Open this to finish setup:\n\n'
printf '    http://localhost:%s/install\n\n' "$WEB_PORT"
info "Your secrets are in ${TARGET_DIR}/.env.prod - keep it, and do not commit it."
info "Stop the site with:  cd ${TARGET_DIR} && $RUNTIME compose -f docker-compose.yml down"
printf '\n'
