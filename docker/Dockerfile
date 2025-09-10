# Dockerfile for Modulo CMS (Laravel 12 + React 19)
# syntax=docker/dockerfile:1.6

# Global args for version pinning
ARG PHP_VERSION=8.4
ARG COMPOSER_VERSION=2.7

# Stage 1: PHP base image
FROM --platform=$BUILDPLATFORM php:${PHP_VERSION}-fpm-alpine AS php-base

# Environment variables
ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_CACHE_DIR=/tmp/composer-cache \
    PHP_OPCACHE_VALIDATE_TIMESTAMPS=0 \
    PHP_OPCACHE_MAX_ACCELERATED_FILES=10000 \
    PHP_OPCACHE_MEMORY_CONSUMPTION=192 \
    PHP_OPCACHE_MAX_WASTED_PERCENTAGE=10 \
    PHP_MEMORY_LIMIT=-1

# Install system dependencies
RUN set -eux; \
    apk add --no-cache --virtual .persistent-deps \
        git \
        curl \
        icu-libs \
        libjpeg-turbo \
        libpng \
        freetype \
        libzip \
        oniguruma \
        sqlite-libs \
        libxml2 \
        zip \
        unzip \
        tzdata \
    && apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        icu-dev \
        libjpeg-turbo-dev \
        libpng-dev \
        freetype-dev \
        libzip-dev \
        oniguruma-dev \
        sqlite-dev \
        libxml2-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo \
        pdo_sqlite \
        pdo_mysql \
        mbstring \
        bcmath \
        gd \
        exif \
        fileinfo \
        intl \
        zip \
        opcache \
    && apk del --no-network .build-deps \
    && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Install Composer (using explicit version for compatibility)
COPY --from=docker.io/library/composer:2.7 /usr/bin/composer /usr/bin/composer

# Create app user and set up directory structure
RUN addgroup -g 1000 -S app && \
    adduser -S app -u 1000 -G app && \
    mkdir -p /var/www/html && \
    chown -R app:app /var/www/html

WORKDIR /var/www/html

# Copy PHP configuration
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini

# Production stage
FROM php-base AS production

# Install production dependencies
USER root
RUN apk add --no-cache nginx supervisor && \
    rm -rf /var/cache/apk/*

# Copy application files
COPY --chown=app:app . .

# Install production dependencies
RUN --mount=type=cache,target=/tmp/composer-cache,uid=1000,gid=1000 \
    composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Set up permissions
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R app:app storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Copy service configurations
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Expose port and run
EXPOSE 80
USER app
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# Development stage
FROM php-base AS development

# Install development tools
USER root
RUN apk add --no-cache \
        bash \
        vim \
        htop \
        curl \
        unzip \
        nano \
        git \
    && rm -rf /var/cache/apk/*

# Set up directories and permissions
RUN mkdir -p storage/framework/{cache,sessions,views} \
             storage/logs \
             bootstrap/cache \
             database \
             public/themes \
             storage/app/public \
    && chown -R app:app storage bootstrap/cache database public/themes \
    && chmod -R 775 storage bootstrap/cache database public/themes

# Copy development entrypoint
COPY docker/entrypoint-dev.sh /entrypoint-dev.sh
RUN chmod +x /entrypoint-dev.sh

# Development environment variables
ENV APP_ENV=local \
    APP_DEBUG=true \
    PHP_OPCACHE_VALIDATE_TIMESTAMPS=1

# Health check for development
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port and run
EXPOSE 8000
USER app
CMD ["/entrypoint-dev.sh"]