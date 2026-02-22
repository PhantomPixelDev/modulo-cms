#!/usr/bin/env sh
set -e

cd /var/www/html

mkdir -p storage/framework/cache/data \
  storage/framework/views \
  storage/framework/sessions \
  storage/logs \
  bootstrap/cache
# Ensure directories are writable by both host user (via shared group) and PHP-FPM (www-data)
chmod -R ug+rwX storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Remove any stray cache files created as root to avoid future collisions
find storage/framework/cache -type f ! -user www-data -exec rm -f {} + 2>/dev/null || true
find bootstrap/cache -type f ! -user www-data -exec rm -f {} + 2>/dev/null || true

echo "Storage permissions refreshed."
