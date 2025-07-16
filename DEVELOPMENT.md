# Development Guide for Modulo CMS

This guide provides detailed instructions for setting up and working with the Modulo CMS development environment, built on the latest Laravel 12 and React 19 starter kit with authentication.

## 🛠 Development Environment Setup

### Prerequisites

Before setting up the development environment, ensure you have the following installed:

#### Required Software
- **PHP 8.4**
- **Composer** (PHP package manager)
- **Node.js 18 or higher**
- **npm** or **yarn**
- **Git**

#### Optional but Recommended
- **Docker** and **Docker Compose** (for containerized development)
- **Laravel Sail** (Laravel's Docker development environment)
- **VS Code** with recommended extensions
- **Postman** or **Insomnia** (for API testing)

### System Requirements

#### Minimum Requirements
- **RAM**: 4GB
- **Storage**: 10GB free space
- **CPU**: Dual-core processor

#### Recommended Requirements
- **RAM**: 8GB or more
- **Storage**: 20GB free space
- **CPU**: Quad-core processor
- **SSD**: For faster development experience

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/modulo-cms.git
cd modulo-cms
```

### 2. Install Dependencies
```bash
# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install
```

### 3. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### 4. Database Setup
```bash
# For SQLite (default development database)
touch database/database.sqlite

# For MySQL/PostgreSQL, update .env file:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=modulo_cms
# DB_USERNAME=your_username
# DB_PASSWORD=your_password
```

### 5. Run Migrations
```bash
php artisan migrate
```

### 6. Start Development Server
```bash
# Start all services (recommended)
composer run dev

# Or start individually
php artisan serve
npm run dev

# For SSR support
composer run dev:ssr
```

## 🔧 Development Tools

### VS Code Extensions

Install these recommended extensions for the best development experience:

#### PHP & Laravel
- **PHP Intelephense** - PHP language server
- **Laravel Blade Snippets** - Blade template snippets
- **Laravel Artisan** - Laravel Artisan commands
- **Laravel Snippets** - Laravel code snippets

#### JavaScript & React
- **ES7+ React/Redux/React-Native snippets** - React snippets
- **TypeScript Importer** - Auto-import TypeScript modules
- **Tailwind CSS IntelliSense** - Tailwind CSS autocomplete

#### General Development
- **GitLens** - Git integration
- **Prettier** - Code formatter
- **ESLint** - JavaScript linting
- **Auto Rename Tag** - HTML/JSX tag renaming
- **Bracket Pair Colorizer** - Bracket matching

### Development Scripts

#### Available Commands
```bash
# Development
composer run dev          # Start all development services
composer run dev:ssr      # Start with SSR support
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run build:ssr        # Build with SSR support

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run types            # TypeScript type checking
composer test            # Run PHP tests

# Database
php artisan migrate      # Run migrations
php artisan migrate:fresh --seed  # Fresh install with seeders
php artisan db:seed      # Run seeders
```

#### Custom Scripts
```bash
# Create new feature
php artisan make:controller FeatureController
php artisan make:model Feature
php artisan make:migration create_features_table

# Clear caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear
```

## 🗄 Database Management

### Database Configuration

#### SQLite (Development)
```env
DB_CONNECTION=sqlite
DB_DATABASE=/path/to/database.sqlite
```

#### MySQL (Production)
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=modulo_cms
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

#### PostgreSQL (Production)
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=modulo_cms
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

### Database Commands
```bash
# Create migration
php artisan make:migration create_table_name

# Run migrations
php artisan migrate

# Rollback migrations
php artisan migrate:rollback

# Reset database
php artisan migrate:fresh

# Seed database
php artisan db:seed

# Create seeder
php artisan make:seeder SeederName
```

## 🧪 Testing

### Testing Setup
```bash
# Run all tests
composer test

# Run specific test file
./vendor/bin/pest tests/Feature/MyFeatureTest.php

# Run with coverage
./vendor/bin/pest --coverage

# Run tests in parallel
./vendor/bin/pest --parallel
```

### Writing Tests

#### PHP Tests (Pest)
```php
<?php

use function Pest\Laravel\get;

test('dashboard loads successfully', function () {
    $user = User::factory()->create();
    
    get('/dashboard')
        ->actingAs($user)
        ->assertOk();
});
```

#### Frontend Tests (Future)
```bash
# Run frontend tests (when implemented)
npm run test

# Run tests in watch mode
npm run test:watch
```

## 🔍 Debugging

### Laravel Debugging
```bash
# Enable debug mode
APP_DEBUG=true

# View logs
tail -f storage/logs/laravel.log

# Use Laravel Pail for real-time logs
php artisan pail
```

### Frontend Debugging
```bash
# Enable source maps
# Already enabled in development mode

# Use browser dev tools
# React DevTools extension recommended
```

### Database Debugging
```bash
# Enable query logging
DB_QUERY_LOG=true

# View database queries in logs
tail -f storage/logs/laravel.log | grep "SQL"
```

## 📁 Project Structure

### Backend Structure
```
app/
├── Http/
│   ├── Controllers/     # Application controllers
│   │   ├── Auth/        # Authentication controllers (Laravel Starter Kit)
│   │   └── Settings/    # Settings controllers
│   ├── Middleware/      # Custom middleware
│   └── Requests/        # Form request validation
├── Models/              # Eloquent models
├── Providers/           # Service providers
└── Plugins/             # Plugin system (future)
```

### Frontend Structure
```
resources/js/
├── components/          # React components
│   └── ui/             # UI component library
├── hooks/              # Custom React hooks
├── layouts/            # Page layouts
│   ├── app/            # App layout components
│   └── auth/           # Auth layout components
├── pages/              # Inertia pages
│   ├── auth/           # Authentication pages
│   └── settings/       # Settings pages
├── types/              # TypeScript types
└── lib/                # Utility functions
```

### Configuration Files
```
config/                 # Laravel configuration
vite.config.ts         # Vite configuration
tsconfig.json          # TypeScript configuration
eslint.config.js       # ESLint configuration
tailwind.config.js     # Tailwind CSS configuration
```

## 🔄 Development Workflow

### Feature Development
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/feature-name
   ```

2. **Make Changes**
   - Write code following standards
   - Add tests for new functionality
   - Update documentation

3. **Test Changes**
   ```bash
   composer test
   npm run lint
   npm run types
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/feature-name
   ```

### Code Review Process
1. **Self Review**
   - Check code quality
   - Ensure tests pass
   - Verify functionality

2. **Peer Review**
   - Request code review
   - Address feedback
   - Make necessary changes

3. **Merge**
   - Squash commits if needed
   - Merge to main branch
   - Delete feature branch

## 🚀 Performance Optimization

### Development Performance
```bash
# Use OPcache in development
opcache.enable=1
opcache.enable_cli=1

# Use Redis for caching
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

### Frontend Performance
```bash
# Enable Vite optimizations
npm run build

# Analyze bundle size
npm run build -- --analyze
```

## 🔒 Security

### Development Security
```bash
# Use HTTPS in development
# Configure local SSL certificate

# Secure environment variables
# Never commit .env files

# Regular dependency updates
composer update
npm update
```

### Security Best Practices
- Validate all user inputs
- Use Laravel's built-in security features
- Follow OWASP guidelines
- Regular security audits
- Keep dependencies updated

## 📚 Learning Resources

### Laravel
- [Laravel Documentation](https://laravel.com/docs)
- [Laravel News](https://laravel-news.com)
- [Laravel Podcast](https://laravelpodcast.com)

### React
- [React Documentation](https://react.dev)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app)
- [React Patterns](https://reactpatterns.com)

### Inertia.js
- [Inertia Documentation](https://inertiajs.com)
- [Inertia Examples](https://github.com/inertiajs/inertia-laravel)

### Tailwind CSS
- [Tailwind Documentation](https://tailwindcss.com/docs)
- [Tailwind UI](https://tailwindui.com)

## 🆘 Troubleshooting

### Common Issues

#### Permission Issues
```bash
# Fix storage permissions
chmod -R 775 storage bootstrap/cache

# Fix ownership
sudo chown -R $USER:www-data storage bootstrap/cache
```

#### Composer Issues
```bash
# Clear composer cache
composer clear-cache

# Update composer
composer self-update
```

#### Node.js Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Issues
```bash
# Reset database
php artisan migrate:fresh --seed

# Clear database cache
php artisan config:clear
```

### Getting Help
- Check the [Laravel documentation](https://laravel.com/docs)
- Search [Stack Overflow](https://stackoverflow.com)
- Ask in [GitHub Discussions](https://github.com/your-username/modulo-cms/discussions)
- Join the community Discord/Slack

---

This development guide will be updated as the project evolves. Keep it bookmarked for quick reference! 