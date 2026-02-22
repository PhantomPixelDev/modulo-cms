# Dev-focused images for Modulo CMS

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

# Composer (for dev container)
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

COPY docker-dev/entrypoint.sh /usr/local/bin/app-entrypoint
RUN chmod +x /usr/local/bin/app-entrypoint

EXPOSE 9000
ENTRYPOINT ["/bin/sh","/usr/local/bin/app-entrypoint"]
CMD ["php-fpm"]


FROM node:22-bookworm-slim AS vite
WORKDIR /app

RUN set -eux; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 make g++; \
    rm -rf /var/lib/apt/lists/*

EXPOSE 5173
CMD ["sh","-lc","npm install --legacy-peer-deps && npm run dev -- --host 0.0.0.0 --port 5173"]
