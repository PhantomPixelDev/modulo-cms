# Production images for Modulo CMS
#
#   app  - PHP-FPM with the application, vendor (no dev deps) and built assets
#   web  - nginx serving public/ and proxying PHP to the app service
#
# Built by docker/docker-compose.yml; see README "Production".

# --- Composer dependencies (no dev packages) ---------------------------------
FROM composer:2 AS vendor
WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-progress \
      --no-scripts --no-autoloader --ignore-platform-reqs

COPY . .
RUN composer dump-autoload --no-dev --optimize --no-scripts


# --- Frontend build ------------------------------------------------------------
FROM node:22-bookworm-slim AS assets
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build


# --- PHP-FPM application -------------------------------------------------------
FROM php:8.4-fpm AS app
WORKDIR /var/www/html

RUN set -eux; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      libpq-dev libzip-dev libfreetype6-dev libjpeg62-turbo-dev libpng-dev libwebp-dev libicu-dev \
      postgresql-client; \
    docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp; \
    docker-php-ext-install -j"$(nproc)" gd pdo_pgsql pgsql opcache exif bcmath zip pcntl intl; \
    pecl install redis; \
    docker-php-ext-enable redis; \
    rm -rf /var/lib/apt/lists/* /tmp/pear; \
    cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/php.ini "$PHP_INI_DIR/conf.d/zz-modulo.ini"

COPY --chown=www-data:www-data . .
COPY --chown=www-data:www-data --from=vendor /app/vendor ./vendor
COPY --chown=www-data:www-data --from=assets /app/public/build ./public/build

# Stamp the build. Passed by the release workflow from the git tag; without it
# the committed VERSION file stands and the image reports itself as a dev build.
ARG MODULO_VERSION=""
ARG MODULO_COMMIT=""
ENV MODULO_COMMIT=${MODULO_COMMIT}
RUN if [ -n "$MODULO_VERSION" ]; then echo "${MODULO_VERSION#v}" > VERSION; fi && cat VERSION

RUN set -eux; \
    rm -f .env bootstrap/cache/*.php; \
    mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache; \
    # Discover only the installed (non-dev) packages; no database exists at build time
    DB_CONNECTION=sqlite DB_DATABASE=:memory: php artisan package:discover --ansi; \
    chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/modulo-entrypoint
RUN chmod +x /usr/local/bin/modulo-entrypoint

USER www-data
EXPOSE 9000
ENTRYPOINT ["modulo-entrypoint"]
CMD ["php-fpm"]


# --- nginx ---------------------------------------------------------------------
FROM nginx:1.27-alpine AS web

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/nginx-entrypoint.sh /usr/local/bin/modulo-nginx-entrypoint
RUN chmod +x /usr/local/bin/modulo-nginx-entrypoint
ENTRYPOINT ["modulo-nginx-entrypoint"]
CMD ["nginx", "-g", "daemon off;"]

COPY --from=app /var/www/html/public /var/www/html/public
# Uploaded media is served from the shared storage volume
RUN ln -s /var/www/html/storage/app/public /var/www/html/public/storage
