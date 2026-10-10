# Dev-focused images for Modulo CMS

ARG PHP_VERSION=8.5
ARG DOCKER_LIBRARY=docker.io/library
FROM ${DOCKER_LIBRARY}/composer:2 AS composer

FROM ${DOCKER_LIBRARY}/php:${PHP_VERSION}-fpm-alpine3.24 AS app
WORKDIR /var/www/html

COPY docker/install-php-runtime.sh /tmp/install-php-runtime.sh
RUN set -eux; \
    sh /tmp/install-php-runtime.sh; \
    apk add --no-cache bash git unzip; \
    rm /tmp/install-php-runtime.sh; \
    cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"; \
    sed -ri \
      -e 's#^listen\s*=\s*.*#listen = 0.0.0.0:9000#' \
      -e 's#^;?\s*clear_env\s*=\s*.*#clear_env = no#' \
      /usr/local/etc/php-fpm.d/www.conf

COPY docker-dev/php.ini "$PHP_INI_DIR/conf.d/zz-modulo-dev.ini"

# Composer (for dev container)
COPY --from=composer /usr/bin/composer /usr/local/bin/composer

COPY docker-dev/entrypoint.sh /usr/local/bin/app-entrypoint
RUN chmod +x /usr/local/bin/app-entrypoint

EXPOSE 9000
ENTRYPOINT ["/bin/sh","/usr/local/bin/app-entrypoint"]
CMD ["php-fpm"]


FROM ${DOCKER_LIBRARY}/node:24-bookworm-slim AS vite
WORKDIR /app

RUN set -eux; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends python3 make g++; \
    rm -rf /var/lib/apt/lists/*

EXPOSE 5173
CMD ["sh","-lc","npm install --no-audit --no-fund && npm run dev -- --host 0.0.0.0 --port 5173"]
