# Multi-stage build for Laravel (PHP-FPM) + Vite assets

# 1) Build frontend assets with Node (latest LTS on Debian)
FROM node:22-bookworm-slim AS assets
WORKDIR /app
# Install deps
COPY package.json package-lock.json* bun.lockb* ./
RUN set -eux; \
    if [ -f bun.lockb ]; then echo "bun.lockb detected; using npm with legacy peer deps in this image"; fi; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 make g++; \
    npm install --legacy-peer-deps; \
    rm -rf /var/lib/apt/lists/*
# Copy project (filtered by .dockerignore)
COPY . .
# Build (outputs to public/build)
RUN npm run build

# 2) Install PHP dependencies (Composer)
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
  --no-dev \
  --prefer-dist \
  --no-progress \
  --no-interaction \
  --no-scripts \
  --optimize-autoloader \
  --ignore-platform-req=ext-exif

# 3) Runtime: PHP-FPM (Debian for reliable extension installs)
FROM php:8.4-fpm AS app
WORKDIR /var/www/html

# Install system packages and PHP extensions (incl. PostgreSQL)
RUN set -eux; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      bash git unzip libpq-dev libzip-dev \
      libfreetype6-dev libjpeg62-turbo-dev libpng-dev libwebp-dev; \
    docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp; \
    docker-php-ext-install -j"$(nproc)" \
      gd pdo pdo_mysql pgsql pdo_pgsql opcache exif bcmath zip; \
    rm -rf /var/lib/apt/lists/*; \
    sed -ri \
      -e 's#^listen\s*=\s*.*#listen = 0.0.0.0:9000#' \
      -e 's#^;?\s*clear_env\s*=\s*.*#clear_env = no#' \
      /usr/local/etc/php-fpm.d/www.conf

# Copy application source
COPY . /var/www/html

# Copy vendor from composer stage
COPY --from=vendor /app/vendor /var/www/html/vendor

# Copy built assets from node stage
COPY --from=assets /app/public/build /var/www/html/public/build

# Ensure storage/cache/database and symlink exist (so web stage gets public/storage)
RUN mkdir -p storage/framework/{cache,views,sessions} bootstrap/cache \
    && php artisan storage:link || true \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Copy entrypoint
COPY docker/entrypoint.sh /usr/local/bin/app-entrypoint
RUN chmod +x /usr/local/bin/app-entrypoint

EXPOSE 9000
ENTRYPOINT ["/bin/sh","/usr/local/bin/app-entrypoint"]
CMD ["php-fpm"]

# 4) Nginx web server image (static + proxy to php-fpm)
FROM nginx:alpine AS web

# Copy Nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the public dir and any built assets
COPY --from=app /var/www/html/public /var/www/html/public

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
