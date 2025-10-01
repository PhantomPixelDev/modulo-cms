# Multi-stage Docker build for Laravel + React application
FROM php:8.4-fpm as base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    nodejs \
    npm \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql pdo_sqlite mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy composer files first for better Docker layer caching
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy package files for Node.js dependencies
COPY package.json package-lock.json* ./

# Install Node.js dependencies
RUN npm ci

# Copy application code
COPY . .

# Build frontend assets
RUN npm run build

# Create storage directories and set permissions
RUN mkdir -p storage/app storage/framework/cache storage/framework/sessions storage/framework/views storage/logs \
    && chmod -R 755 storage \
    && chown -R www-data:www-data storage

# Create SQLite database
RUN touch database/database.sqlite \
    && chmod 664 database/database.sqlite \
    && chown www-data:www-data database/database.sqlite

# Production stage
FROM base as production

# Copy startup script
COPY docker/production/startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh

# Generate application key and run migrations
RUN php artisan key:generate --force \
    && php artisan migrate --force

# Expose port
EXPOSE 9000

# Start PHP-FPM
CMD ["php-fpm"]

# Development stage
FROM base as development

# Install development dependencies
RUN composer install --optimize-autoloader --no-interaction

# Copy development startup script
COPY docker/development/startup.sh /usr/local/bin/startup.sh
RUN chmod +x /usr/local/bin/startup.sh

# Expose port
EXPOSE 9000

# Start with development script
CMD ["/usr/local/bin/startup.sh"]
