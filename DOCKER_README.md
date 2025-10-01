# Modulo CMS Docker Setup

This document describes how to set up and run Modulo CMS using Docker for both development and production environments.

## 🚀 Quick Start

### Development Environment

```bash
# Start development environment
./docker.sh start

# Or manually
docker-compose up -d
```

### Production Environment

```bash
# Setup production environment
./docker-production.sh

# Or manually
docker-compose -f docker-compose.yml up -d --build
```

## 📋 Prerequisites

- Docker
- Docker Compose
- At least 2GB of available RAM
- Ports 8080 (web) and 6379 (Redis) available

## 🏗️ Architecture

The Docker setup includes:

- **Laravel App**: PHP 8.4-FPM application container
- **Nginx**: Web server with optimized Laravel configuration
- **Redis**: Caching and session storage
- **SQLite**: Database (can be easily changed to MySQL/PostgreSQL)

## 📁 Project Structure

```
├── Dockerfile                 # Main application container
├── docker-compose.yml         # Development stack
├── docker/
│   ├── development/
│   │   ├── startup.sh         # Development startup script
│   │   └── php.ini           # PHP configuration
│   ├── production/
│   │   └── startup.sh         # Production startup script
│   └── nginx/
│       ├── nginx.conf         # Main nginx configuration
│       └── conf.d/
│           └── default.conf   # Site configuration
├── .env.development          # Development environment
├── .env.production           # Production environment
├── docker.sh                 # Development setup script
├── docker-production.sh      # Production setup script
└── docker-manage.sh          # Utility script for common operations
```

## 🔧 Configuration

### Environment Files

1. **Development** (`.env.development`):
   - Debug mode enabled
   - SQLite database
   - Redis for caching/sessions
   - Local development settings

2. **Production** (`.env.production`):
   - Debug mode disabled
   - Secure settings
   - Production-ready configuration

### Database

Currently uses SQLite for simplicity. To use MySQL/PostgreSQL:

1. Uncomment the database service in `docker-compose.yml`
2. Update your `.env` file with database credentials
3. Update the app service dependencies

## 🛠️ Available Commands

### Development Setup

```bash
# Start development environment
./docker.sh start

# Stop all containers
./docker-manage.sh stop

# View logs
./docker-manage.sh logs [service]

# Restart containers
./docker-manage.sh restart

# Run artisan commands
./docker-manage.sh artisan migrate
./docker-manage.sh artisan make:model Post

# Run npm commands
./docker-manage.sh npm install
./docker-manage.sh npm run dev

# Run composer commands
./docker-manage.sh composer install
./docker-manage.sh composer require package/name

# Build assets
./docker-manage.sh build

# Run tests
./docker-manage.sh test

# View container status
./docker-manage.sh status
```

### Production Setup

```bash
# Setup and start production environment
./docker-production.sh

# Manual production start
docker-compose -f docker-compose.yml up -d --build
```

## 🌐 Accessing the Application

- **Local Development**: http://localhost:8080
- **Production**: Configure your domain to point to the server

## 🔍 Development Workflow

1. **Start Environment**:
   ```bash
   ./docker.sh start
   ```

2. **Development**:
   - Frontend assets are automatically rebuilt on changes
   - Access the app at http://localhost:8080
   - View logs: `./docker-manage.sh logs app`

3. **Database Management**:
   ```bash
   # Run migrations
   ./docker-manage.sh artisan migrate

   # Fresh migration with seed
   ./docker-manage.sh artisan migrate:fresh --seed

   # Create new migration
   ./docker-manage.sh artisan make:migration create_posts_table
   ```

4. **Asset Management**:
   ```bash
   # Install npm dependencies
   ./docker-manage.sh npm install

   # Build for production
   ./docker-manage.sh build

   # Start development server
   ./docker-manage.sh npm run dev
   ```

## 🚀 Production Deployment

1. **Environment Setup**:
   ```bash
   # Edit production environment file
   nano .env.production
   ```

   Important settings to update:
   - `APP_URL` - Your production domain
   - `APP_DEBUG` - Set to `false`
   - Database credentials
   - Redis password
   - Mail configuration

2. **Deploy**:
   ```bash
   ./docker-production.sh
   ```

3. **SSL Setup** (Recommended):
   ```bash
   # Install certbot
   sudo apt-get install certbot python3-certbot-nginx

   # Get SSL certificate
   sudo certbot --nginx -d yourdomain.com
   ```

## 🔒 Security Considerations

### Production Security

1. **Environment Variables**:
   - Never commit `.env` files
   - Use strong passwords
   - Set `APP_DEBUG=false`

2. **File Permissions**:
   - Storage directories have proper permissions
   - SQLite database is secured

3. **Nginx Security**:
   - Security headers are configured
   - Rate limiting is enabled
   - File upload restrictions

4. **HTTPS**:
   - Always use SSL in production
   - Configure proper certificates

## 📊 Monitoring

### Logs

```bash
# View all logs
./docker-manage.sh logs

# View specific service logs
./docker-manage.sh logs nginx
./docker-manage.sh logs app
./docker-manage.sh logs redis
```

### Health Checks

- **Application**: http://localhost:8080/health
- **Nginx Status**: http://localhost:8080/nginx_status

## 🆙 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Update dependencies
./docker-manage.sh composer install
./docker-manage.sh npm install

# Run migrations
./docker-manage.sh artisan migrate

# Build assets
./docker-manage.sh build

# Restart containers
./docker-manage.sh restart
```

### Backup Strategy

For production environments:

1. **Database**: Regular SQLite backups
2. **Uploads**: Backup storage directory
3. **Environment**: Backup `.env.production`

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**:
   ```bash
   # Check what's using port 8080
   sudo lsof -i :8080
   # Or change the port in docker-compose.yml
   ```

2. **Permission Issues**:
   ```bash
   # Fix storage permissions
   sudo chown -R www-data:www-data storage
   sudo chmod -R 755 storage
   ```

3. **Container Won't Start**:
   ```bash
   # View detailed logs
   ./docker-manage.sh logs
   # Clean restart
   ./docker-manage.sh stop && ./docker-manage.sh start
   ```

4. **Assets Not Loading**:
   ```bash
   # Rebuild assets
   ./docker-manage.sh build
   # Clear Laravel cache
   ./docker-manage.sh artisan optimize:clear
   ```

### Getting Help

```bash
# Show all available commands
./docker-manage.sh help

# Check container status
./docker-manage.sh status

# View logs for troubleshooting
./docker-manage.sh logs
```

## 📝 Customization

### Changing Database

To use MySQL instead of SQLite:

1. Uncomment MySQL service in `docker-compose.yml`
2. Update `.env` files with MySQL credentials
3. Add MySQL dependency to app service

### Adding Services

Common services to add:
- **MailHog**: Email testing
- **Elasticsearch**: Search functionality
- **MinIO**: File storage

### Performance Tuning

- Adjust PHP memory limits in `docker/development/php.ini`
- Configure Redis persistence in `docker-compose.yml`
- Add database indexes for better performance

---

For more help, run `./docker-manage.sh help` or check the script source code.
