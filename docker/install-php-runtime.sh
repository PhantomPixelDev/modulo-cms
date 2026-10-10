#!/bin/sh
# Shared Alpine runtime for production and development PHP images.
set -eu
apk upgrade --no-cache
apk add --no-cache bash libpq libzip freetype libjpeg-turbo libpng libwebp \
  icu-libs icu-data-full tzdata postgresql16-client
apk add --no-cache --virtual .modulo-build-deps $PHPIZE_DEPS \
  postgresql-dev libzip-dev freetype-dev libjpeg-turbo-dev libpng-dev libwebp-dev icu-dev
docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp
docker-php-ext-install -j"$(nproc)" gd pdo_mysql pdo_pgsql pgsql exif bcmath zip pcntl intl
if [ "$(php -r 'echo PHP_VERSION_ID;')" -lt 80500 ]; then docker-php-ext-install opcache; fi
pecl install redis-6.3.0
docker-php-ext-enable redis
apk del .modulo-build-deps
rm -rf /tmp/pear
pg_dump --version | grep ' 16\.'
psql --version | grep ' 16\.'
# Preserve existing Debian-based named-volume ownership without rewriting data.
deluser www-data
delgroup www-data 2>/dev/null || true
addgroup -S -g 33 www-data
adduser -S -D -H -u 33 -G www-data www-data
cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
