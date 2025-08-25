# Modulo CMS

A modern, modular Content Management System built on the latest Laravel 12 and React 19 starter kit with authentication, featuring a plugin-based architecture, customizable themes, and a developer-friendly design.

## 🚀 Features

### Core Features
- **Built on Laravel 12 + React 19**: Latest starter kit with authentication
- **Complete Auth System**: Registration, login, email verification, password reset
- **Modular Architecture**: Plugin-based system for easy extensibility
- **Theme System**: Customizable themes with modern UI components
- **User Management**: Complete authentication and authorization system
- **Dashboard**: Modern, responsive admin dashboard
- **Settings Management**: Profile, password, and appearance settings
- **Email Verification**: Built-in email verification system
- **Password Reset**: Secure password reset functionality

### Technical Features
- **SPA Experience**: Single Page Application with Inertia.js
- **TypeScript Support**: Full TypeScript support for frontend
- **Modern UI**: Built with Radix UI and Tailwind CSS
- **Responsive Design**: Mobile-first responsive design
- **Dark/Light Mode**: Theme switching with system preference detection
- **Component Library**: Reusable UI components
- **Form Validation**: Client and server-side validation
- **Testing**: Comprehensive test suite with Pest PHP

## 🛠 Tech Stack

### Backend
- **PHP 8.4** - Latest PHP with modern features
- **Laravel 12** - Latest Laravel framework with starter kit
- **Inertia.js** - SPA without the complexity
- **SQLite/MySQL/PostgreSQL** - Flexible database options
- **Pest PHP** - Testing framework
- **Laravel Starter Kit** - Built-in authentication system

### Frontend
- **React 19** - Latest React with modern features
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Latest utility-first CSS framework
- **Radix UI** - Accessible UI primitives
- **Vite** - Fast build tool
- **Lucide React** - Beautiful icons
- **Inertia.js React** - SPA framework integration

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Laravel Sail** - Docker development environment
- **Laravel Pail** - Real-time log viewing
- **Ziggy** - Route generation for JavaScript

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **PHP 8.4**
- **Composer** (PHP package manager)
- **Node.js 18 or higher**
- **npm** or **yarn**
- **Git**

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/modulo-cms.git
cd modulo-cms
```

### 2. Install PHP Dependencies
```bash
composer install
```

### 3. Install Node.js Dependencies
```bash
npm install
```

### 4. Environment Setup
```bash
cp .env.example .env
php artisan key:generate
```

### 5. Database Setup
```bash
# For SQLite (default)
touch database/database.sqlite

# For MySQL/PostgreSQL, update .env file with your database credentials
```

### 6. Run Migrations
```bash
php artisan migrate
```

### 7. Start Development Server
```bash
# Start all services (Laravel, Vite, Queue, Logs)
composer run dev

# Or start individually
php artisan serve
npm run dev
```

## 🏃‍♂️ Quick Start

1. **Access the Application**: Visit `http://localhost:8000`
2. **Register a User**: Create your first account using the built-in registration
3. **Verify Email**: Check your email for verification link (if enabled)
4. **Login**: Access the dashboard with your credentials
5. **Explore**: Navigate through settings, themes, and features
6. **Customize**: Modify appearance settings and user profile

## 📁 Project Structure

```
modulo-cms/
├── app/
│   ├── Http/
│   │   ├── Controllers/     # Laravel controllers
│   │   ├── Middleware/      # Custom middleware
│   │   └── Requests/        # Form request validation
│   ├── Models/              # Eloquent models
│   └── Providers/           # Service providers
├── resources/
│   └── js/
│       ├── components/      # React components
│       ├── hooks/           # Custom React hooks
│       ├── layouts/         # Page layouts
│       ├── pages/           # Inertia pages
│       └── types/           # TypeScript types
├── routes/                  # Laravel routes
├── database/                # Migrations, seeders, factories
└── tests/                   # Test files
```

## 🔧 Development

### Available Scripts

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
```

### Adding New Features

1. **Create Migration**: `php artisan make:migration create_feature_table`
2. **Create Model**: `php artisan make:model Feature`
3. **Create Controller**: `php artisan make:controller FeatureController`
4. **Add Routes**: Update `routes/web.php`
5. **Create React Components**: Add to `resources/js/components/`
6. **Create Pages**: Add to `resources/js/pages/`
7. **Write Tests**: Add to `tests/Feature/`

### Plugin Development

Plugins can be developed as separate packages or within the main application:

```bash
# Create plugin structure
mkdir -p app/Plugins/MyPlugin
```

## 🧪 Testing

```bash
# Run all tests
composer test

# Run specific test file
./vendor/bin/pest tests/Feature/Auth/AuthenticationTest.php

# Run with coverage
./vendor/bin/pest --coverage
```

## 🚀 Deployment

### Production Build
```bash
# Install dependencies
composer install --optimize-autoloader --no-dev
npm ci
npm run build

# Set up environment
cp .env.example .env
php artisan key:generate
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
php artisan migrate --force
```

### Environment Variables
```env
APP_NAME="Modulo CMS"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=modulo_cms
DB_USERNAME=your_username
DB_PASSWORD=your_password

MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"
```

## 🔎 SEO & Sitemap

### Inertia SPA pages
- Use the reusable `SEOHead` component to set dynamic meta tags.
- Example usage:

```tsx
import SEOHead from '@/components/SEOHead';

export default function ExamplePage() {
  return (
    <>
      <SEOHead
        title="My Page Title"
        description="Concise page description."
        canonicalUrl="https://example.com/path"
        og={{ type: 'article', image: 'https://example.com/img/cover.jpg' }}
        twitter={{ card: 'summary_large_image' }}
      />
      {/* page content */}
    </>
  );
}
```

Notes:
- The canonical URL defaults to window location if omitted.
- `og:*` and `twitter:*` tags are supported; provide absolute URLs for images.
- Admin pages use `AdminLayout`, which injects `<SEOHead noindex />` to prevent indexing.

### Blade-rendered theme pages
- Theme layout at `resources/themes/flexia/templates/layout.blade.php` renders SEO meta server-side using data from `TemplateRenderingService` (title, description, canonical, OpenGraph, Twitter).

### Sitemap and robots.txt
- Dynamic sitemap: `/sitemap.xml` (covers public content).
- Robots file: `public/robots.txt` includes `Sitemap: /sitemap.xml`.
- Ensure `APP_URL` is set correctly so absolute URLs are generated where required (e.g., images).

## 📈 Roadmap

### Phase 1: Core CMS (Current)
- [x] Laravel 12 + React 19 starter kit foundation
- [x] Complete authentication system (Laravel Starter Kit)
- [x] User registration and login
- [x] Email verification system
- [x] Password reset functionality
- [x] Basic dashboard and navigation
- [x] Settings management (profile, password, appearance)
- [x] Theme system foundation
- [x] Responsive design
- [x] Dark/light mode support

### Phase 2: Content Management
- [ ] Content types and fields
- [ ] Media library
- [ ] Rich text editor
- [ ] Content versioning
- [ ] SEO management

### Phase 3: Plugin System
- [ ] Plugin architecture
- [ ] Plugin marketplace
- [ ] API for plugin development
- [ ] Plugin management interface
- [ ] Hook system

### Phase 4: Advanced Features
- [ ] Multi-site support
- [ ] Advanced permissions
- [ ] Workflow management
- [ ] Analytics dashboard
- [ ] Backup and restore

### Phase 5: Enterprise Features
- [ ] Multi-tenant support
- [ ] Advanced caching
- [ ] Performance optimization
- [ ] Security hardening
- [ ] API documentation

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards
- Follow PSR-12 coding standards for PHP
- Use TypeScript for all JavaScript/React code
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Laravel](https://laravel.com/) - The PHP framework
- [React](https://reactjs.org/) - The JavaScript library
- [Inertia.js](https://inertiajs.com/) - SPA without the complexity
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Accessible UI primitives

## 📞 Support

- **Documentation**: [docs.modulo-cms.com](https://docs.modulo-cms.com)
- **Issues**: [GitHub Issues](https://github.com/your-username/modulo-cms/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/modulo-cms/discussions)
- **Email**: support@modulo-cms.com

---

**Modulo CMS** - Building the future of content management, one module at a time. 