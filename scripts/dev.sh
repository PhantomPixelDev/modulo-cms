#!/usr/bin/env bash

set -euo pipefail

# Make bun available in bash shells (installer usually wired fish/zsh only)
export BUN_INSTALL="${HOME}/.bun"
export PATH="${BUN_INSTALL}/bin:${PATH}"

# Pick JS package manager (prefer bun if present)
if command -v bun >/dev/null 2>&1; then
  PM="bun"
  PM_RUN="bun run"
  PM_INSTALL="bun install"
else
  PM="npm"
  PM_RUN="npm run"
  PM_INSTALL="npm install --legacy-peer-deps"
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Starting Modulo CMS dev (backend:8080, vite:5173)…${NC}"

# Ensure PHP deps
if ! command -v composer >/dev/null 2>&1; then
  echo -e "${RED}composer not found. Please install Composer.${NC}"; exit 1
fi

# Ensure Node/NPM
if ! command -v npm >/dev/null 2>&1; then
  echo -e "${RED}npm not found. Please install Node.js/npm.${NC}"; exit 1
fi

# Backend setup (prepare env and DB BEFORE composer triggers package:discover)
mkdir -p storage/framework/{sessions,views,cache} bootstrap/cache database
chmod -R 777 storage bootstrap/cache database || true

# Ensure .env exists as early as possible
if [[ ! -f .env ]]; then
  # Prefer .env.docker if present, else fall back silently
  if [[ -f .env.docker ]]; then
    cp .env.docker .env || true
  else
    cp .env.example .env 2>/dev/null || true
  fi
fi

# Ensure SQLite DB file exists before composer (package:discover may touch DB)
touch database/database.sqlite 2>/dev/null || true
chmod 666 database/database.sqlite 2>/dev/null || true

# Now install PHP deps (this can trigger artisan hooks safely)
composer install --no-interaction

# Ensure app key and run migrations
php artisan key:generate --force || true
php artisan migrate --force || true

# Frontend deps
${PM_INSTALL}

# Start backend and vite with safe PID-based cleanup
backend_pid=""
vite_pid=""
cleanup() {
  echo -e "\n${YELLOW}Stopping dev servers…${NC}"
  if [[ -n "${vite_pid}" ]] && kill -0 "${vite_pid}" 2>/dev/null; then
    kill "${vite_pid}" 2>/dev/null || true
  fi
  if [[ -n "${backend_pid}" ]] && kill -0 "${backend_pid}" 2>/dev/null; then
    kill "${backend_pid}" 2>/dev/null || true
  fi
  wait || true
}
trap cleanup EXIT INT TERM

# Always run with Vite dev server; @vite auto-detects dev vs prod now

# Pick backend port dynamically (use 8081 if 8080 is busy)
BACKEND_PORT=8080
if (command -v lsof >/dev/null 2>&1 && lsof -iTCP:8080 -sTCP:LISTEN -n -P >/dev/null 2>&1) || (ss -ltn 2>/dev/null | grep -q ":8080 "); then
  BACKEND_PORT=8081
fi

# Pick Vite port dynamically (prefer 5173, else 5174)
VITE_PORT=5173
if (command -v lsof >/dev/null 2>&1 && lsof -iTCP:5173 -sTCP:LISTEN -n -P >/dev/null 2>&1) || (ss -ltn 2>/dev/null | grep -q ":5173 "); then
  VITE_PORT=5174
fi

VITE_HMR_HOST=127.0.0.1
VITE_HMR_PORT=${VITE_PORT}
VITE_ORIGIN="http://${VITE_HMR_HOST}:${VITE_PORT}"
VITE_DEV_SERVER_URL="${VITE_ORIGIN}"

# Start backend
APP_URL="http://127.0.0.1:${BACKEND_PORT}" VITE_DEV_SERVER_URL="${VITE_DEV_SERVER_URL}" VITE_HMR_HOST="${VITE_HMR_HOST}" php artisan serve --host=127.0.0.1 --port=${BACKEND_PORT} &
backend_pid=$!

# Start Vite
VITE_PORT=${VITE_PORT} VITE_HMR_PORT=${VITE_HMR_PORT} VITE_ORIGIN=${VITE_ORIGIN} ${PM_RUN} dev &
vite_pid=$!

echo -e "${GREEN}Dev running:${NC}\n  Backend:  http://127.0.0.1:${BACKEND_PORT}\n  Vite:     ${VITE_ORIGIN}"
wait



