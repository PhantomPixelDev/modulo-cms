# Production image for Modulo CMS

FROM node:22-bookworm-slim AS frontend
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build


FROM php:8.4-fpm AS app
WORKDIR /var/www/html

RUN set -eux; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      bash git unzip curl libpq-dev libzip-dev postgresql-client \
      libfreetype6-dev libjpeg62-turbo-dev libpng-dev libwebp-dev; \
    docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp; \
    docker-php-ext-install -j"$(nproc)" \
      gd pdo pdo_mysql pgsql pdo_pgsql opcache exif bcmath zip; \
    rm -rf /var/lib/apt/lists/*; \
    sed -ri \
      -e 's#^listen\s*=\s*.*#listen = 0.0.0.0:9000#' \
      -e 's#^;?\s*clear_env\s*=\s*.*#clear_env = no#' \
      /usr/local/etc/php-fpm.d/www.conf

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

COPY . .
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

COPY --from=frontend /app/public/build /var/www/html/public/build

COPY docker-prod/entrypoint.sh /usr/local/bin/app-entrypoint
RUN chmod +x /usr/local/bin/app-entrypoint

EXPOSE 9000
ENTRYPOINT ["/bin/sh", "/usr/local/bin/app-entrypoint"]
CMD ["php-fpm"]
