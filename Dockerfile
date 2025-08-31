# Dockerfile for Modulo CMS (Laravel 12 + React 19)
# syntax=docker/dockerfile:1.6
#
# NOTE: Development-first setup
# ---------------------------------
# This repository uses Docker primarily for LOCAL DEVELOPMENT.
# docker-compose.yml builds with `target: development`, which:
#   - runs `php artisan serve` inside the container
#   - mounts your source code into the container
#   - uses a separate Node vite dev server container for HMR
# The production and frontend-builder stages below exist for future use, but
# are NOT used by the default docker-compose.

# Global args for version pinning
ARG PHP_VERSION=8.4
ARG ALPINE_VERSION=3.20

# Stage 1: Bun build stage for frontend assets
FROM oven/bun:latest AS frontend-builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json bun.lock ./
COPY tsconfig.json vite.config.ts components.json ./

# Install dependencies with Bun
RUN bun install --frozen-lockfile --no-cache

# Copy source code
COPY resources/ ./resources/
COPY public/ ./public/

# Build frontend assets
RUN bun run build

# Stage 2: PHP production base
FROM php:${PHP_VERSION}-fpm-alpine AS php-base

# Environment variables
ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_CACHE_DIR=/tmp/composer-cache \
    PHP_OPCACHE_VALIDATE_TIMESTAMPS=0 \
    PHP_OPCACHE_MAX_ACCELERATED_FILES=10000 \
    PHP_OPCACHE_MEMORY_CONSUMPTION=192 \
    PHP_OPCACHE_MAX_WASTED_PERCENTAGE=10

# Build arguments
ARG TARGETPLATFORM

# Security: Create app user
RUN addgroup -g 1000 -S app && \
    adduser -S app -u 1000 -G app

# Install system dependencies in separate steps for better debugging
RUN apk update && apk upgrade

# Install runtime dependencies
RUN apk add --no-cache \
    git \
    curl \
    nginx \
    supervisor \
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
    tzdata

# Install build dependencies
RUN apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    icu-dev \
    libjpeg-turbo-dev \
    libpng-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    sqlite-dev \
    libxml2-dev

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install -j"$(nproc)" \
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
        opcache

# Clean up build dependencies
RUN apk del .build-deps && \
    rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Install Composer with specific version for reproducibility
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Set working directory and create app structure
WORKDIR /var/www/html
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views \
             bootstrap/cache public/build && \
    chown -R app:app /var/www/html

# Copy composer files with proper ownership
COPY --chown=app:app composer.json composer.lock ./

# Install PHP dependencies as app user
USER app
RUN --mount=type=cache,target=/tmp/composer-cache,uid=1000,gid=1000 \
    composer install --no-dev --optimize-autoloader --prefer-dist --no-interaction --no-scripts

# Copy application code
COPY --chown=app:app . .

# Copy built frontend assets from frontend-builder stage
COPY --from=frontend-builder --chown=app:app /app/public/build ./public/build

# Ensure Bun is available in the final image
COPY --from=frontend-builder /usr/local/bin/bun /usr/local/bin/bun

# Switch back to root for system configuration
USER root

# Copy configuration files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create necessary directories and set permissions
RUN mkdir -p /var/log/supervisor /run/nginx && \
    chown -R app:app /var/www/html/storage /var/www/html/bootstrap/cache && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Production stage
FROM php-base AS production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Security: Run as non-root user
USER app

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

# Stage 3: Development stage
FROM php-base AS development

# Switch to root for package installation
USER root

# Install development tools
RUN apk add --no-cache \
        bash \
        vim \
        htop \
        curl \
        unzip \
        nodejs \
        npm && \
    rm -rf /var/cache/apk/*

# Install development PHP dependencies as root to avoid permission issues
RUN --mount=type=cache,target=/tmp/composer-cache \
    composer install --optimize-autoloader --no-interaction --no-scripts

# Install dependencies with npm (fallback from Bun for Docker compatibility)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Fix permissions for Laravel directories
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views \
             bootstrap/cache database public/themes storage/app/public && \
    chmod -R 777 storage bootstrap/cache database public/themes && \
    chown -R www-data:www-data storage bootstrap/cache database public/themes

# Development environment variables
ENV APP_ENV=local \
    APP_DEBUG=true \
    PHP_OPCACHE_VALIDATE_TIMESTAMPS=1

# Create entrypoint script for development
COPY docker/entrypoint-dev.sh /entrypoint-dev.sh
RUN chmod +x /entrypoint-dev.sh

# Override CMD for development - run as root to avoid permission issues
CMD ["/entrypoint-dev.sh"]
