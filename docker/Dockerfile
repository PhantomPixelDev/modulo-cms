# Production images for Modulo CMS
#
#   app  - PHP-FPM with the application, vendor (no dev deps) and built assets
#   web  - nginx serving public/ and proxying PHP to the app service
#   database - PostgreSQL 16.15 with the minimal Alpine privilege-drop helper
#
# Built by docker/docker-compose.yml; see README "Production".

# CI can select another Docker Official Images registry without changing tags.
ARG DOCKER_LIBRARY=docker.io/library
ARG PHP_VERSION=8.5

# --- Composer dependencies (no dev packages) ---------------------------------
FROM --platform=$BUILDPLATFORM ${DOCKER_LIBRARY}/composer:2 AS vendor
WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-progress \
      --no-scripts --no-autoloader --ignore-platform-reqs

COPY . .
RUN composer dump-autoload --no-dev --optimize --no-scripts


# --- Frontend build ------------------------------------------------------------
FROM --platform=$BUILDPLATFORM ${DOCKER_LIBRARY}/node:24-bookworm-slim AS assets
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build


# --- PHP-FPM application -------------------------------------------------------
FROM ${DOCKER_LIBRARY}/php:${PHP_VERSION}-fpm AS app
WORKDIR /var/www/html

COPY docker/install-postgres-client.sh /tmp/install-postgres-client.sh
RUN set -eux; \
    sh /tmp/install-postgres-client.sh; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      libpq-dev libzip-dev libfreetype6-dev libjpeg62-turbo-dev libpng-dev libwebp-dev libicu-dev \
      libpq5; \
    docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp; \
    docker-php-ext-install -j"$(nproc)" gd pdo_pgsql pgsql exif bcmath zip pcntl intl; \
    if [ "$(php -r 'echo PHP_VERSION_ID;')" -lt 80500 ]; then docker-php-ext-install opcache; fi; \
    pecl install redis; \
    docker-php-ext-enable redis; \
    # Keep extension runtime libraries, then remove compilers and headers.
    # This also avoids shipping kernel-header advisories in an FPM runtime.
    ldd /usr/local/bin/php /usr/local/lib/php/extensions/*/*.so \
      | awk '$2 == "=>" { print $3 }' | sort -u \
      | xargs -r readlink -f | xargs -r dpkg-query --search \
      | cut -d: -f1 | sort -u | xargs -r apt-mark manual; \
    apt-get purge -y --auto-remove $PHPIZE_DEPS \
      libpq-dev libzip-dev libfreetype6-dev libjpeg62-turbo-dev \
      libpng-dev libwebp-dev libicu-dev linux-libc-dev; \
    rm -rf /var/lib/apt/lists/* /tmp/pear /tmp/install-postgres-client.sh; \
    cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/php.ini "$PHP_INI_DIR/conf.d/zz-modulo.ini"

COPY --chown=www-data:www-data . .
COPY --chown=www-data:www-data --from=vendor /app/vendor ./vendor
COPY --chown=www-data:www-data --from=assets /app/public/build ./public/build

# Stamp the build. Passed by the release workflow from the git tag. Without it
# this is not a release, so it reports the committed VERSION with a -dev suffix
# (e.g. 0.1.2-dev): update checks stay quiet and it is never mistaken for the
# release it was merely built after.
ARG MODULO_VERSION=""
ARG MODULO_COMMIT=""
ARG MODULO_BUILT_AT=""
ENV MODULO_COMMIT=${MODULO_COMMIT}
ENV MODULO_BUILT_AT=${MODULO_BUILT_AT}
ENV MODULO_INSTALL_CHANNEL=docker
RUN if [ -n "$MODULO_VERSION" ]; then echo "${MODULO_VERSION#v}" > VERSION; \
    else echo "$(cat VERSION | tr -d '[:space:]' | sed 's/-dev$//')-dev" > VERSION; fi && cat VERSION

RUN set -eux; \
    rm -f .env bootstrap/cache/*.php; \
    mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache public/plugins; \
    # Git checkouts created under a private deployment umask can contain 0600
    # assets. nginx runs as a different user and must read public files.
    # Normalize only public assets; private application/environment modes stay intact.
    find public -type d -exec chmod 0755 {} +; \
    find public -type f -exec chmod 0644 {} +; \
    # Discover only the installed (non-dev) packages; no database exists at build time
    DB_CONNECTION=sqlite DB_DATABASE=:memory: php artisan package:discover --ansi; \
    # public/plugins is a named volume; a new volume takes this directory's owner,
    # so the app can publish plugin bundles into it
    chown -R www-data:www-data storage bootstrap/cache public/plugins

COPY docker/entrypoint.sh /usr/local/bin/modulo-entrypoint
RUN chmod +x /usr/local/bin/modulo-entrypoint

USER www-data
EXPOSE 9000
ENTRYPOINT ["modulo-entrypoint"]
CMD ["php-fpm"]


# --- PostgreSQL: same database version, minimal privilege-drop helper ----------
FROM ${DOCKER_LIBRARY}/postgres:16.15-alpine AS database
RUN set -eux; \
    apk upgrade --no-cache; \
    apk add --no-cache su-exec; \
    sed -i 's/exec gosu postgres /exec su-exec postgres /' /usr/local/bin/docker-entrypoint.sh; \
    ! grep -q gosu /usr/local/bin/docker-entrypoint.sh; \
    rm -f /usr/local/bin/gosu; \
    # The official entrypoint uses only `gosu postgres command [args]`.
    # su-exec preserves this exec/UID contract without an unused Go runtime.
    su-exec postgres sh -c 'test "$(id -un)" = postgres'; \
    postgres --version

# --- nginx ---------------------------------------------------------------------
FROM ${DOCKER_LIBRARY}/nginx:1.30-alpine AS web

# Apply distribution security fixes even when the upstream image is cached.
RUN apk upgrade --no-cache

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/nginx-entrypoint.sh /usr/local/bin/modulo-nginx-entrypoint
RUN chmod +x /usr/local/bin/modulo-nginx-entrypoint
ENTRYPOINT ["modulo-nginx-entrypoint"]
CMD ["nginx", "-g", "daemon off;"]

COPY --from=app /var/www/html/public /var/www/html/public
# Uploaded media is served from the shared storage volume
RUN ln -s /var/www/html/storage/app/public /var/www/html/public/storage
