#!/usr/bin/env bash
set -euo pipefail

# Colors
cyan() { printf "\033[36m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
yellow() { printf "\033[33m%s\033[0m\n" "$*"; }
red() { printf "\033[31m%s\033[0m\n" "$*"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Helpers
have() { command -v "$1" >/dev/null 2>&1; }
exists() { [ -e "$1" ]; }
rmrf() { [ -e "$1" ] && rm -rf "$1" || true; }

cyan "==> Cleaning project caches and artifacts"

# 1) Laravel / PHP caches
if have php && exists artisan; then
  cyan "-- Laravel: clearing caches via artisan"
  php artisan optimize:clear || true
  php artisan cache:clear || true
  php artisan config:clear || true
  php artisan route:clear || true
  php artisan view:clear || true
  php artisan event:clear || true

  cyan "-- Laravel: removing cached files and logs"
  rmrf bootstrap/cache/*.php
  rmrf storage/framework/cache/*
  rmrf storage/framework/sessions/*
  rmrf storage/framework/views/*
  rmrf storage/framework/testing/*
  rmrf storage/logs/*.log

  if have composer; then
    cyan "-- Composer: dump autoload"
    composer dump-autoload -o || true
  else
    yellow "composer not found; skipping dump-autoload"
  fi
else
  yellow "php or artisan not found; skipping Laravel cache clear"
fi

# 2) Frontend/Vite/TypeScript caches
cyan "-- Frontend: removing Vite/TS caches and build output"
rmrf .vite
rmrf .vite
rmrf .cache
rmrf .eslintcache
rmrf .turbo
rmrf public/build
rmrf resources/js/*.tsbuildinfo
rmrf tsconfig.tsbuildinfo

# 3) NPM/Yarn/PNPM store (safe optional)
if have npm; then
  cyan "-- npm: cleaning cache (safe)"
  npm cache verify >/dev/null 2>&1 || true
fi

# 4) Optional: Laravel queue/caches specific (non-fatal)
if have php && exists artisan; then
  php artisan queue:clear || true
fi

green "✔ Clean complete. Suggested next steps:"
echo "  - Reinstall deps if needed: npm ci (and composer install)"
echo "  - Rebuild assets: npm run build or npm run dev"
echo "  - If running in Docker, consider restarting containers"
