# Modulo CMS - Programmer Documentation

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Database Schema](#database-schema)
- [Theme System](#theme-system)
- [Routing & Controllers](#routing--controllers)
- [Services & Business Logic](#services--business-logic)
- [Frontend Architecture](#frontend-architecture)
- [API Reference](#api-reference)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)

## Architecture Overview

Modulo CMS is a modern, modular content management system built with:

- **Backend**: Laravel 12 with PHP 8.4+
- **Frontend**: React 19 with TypeScript and Inertia.js
- **Styling**: Tailwind CSS 4.0
- **Database**: SQLite (default) or MySQL/PostgreSQL
- **Package Manager**: Bun for frontend dependencies
- **Containerization**: Podman Compose for development

### Key Features
- Dynamic post types with configurable fields
- Hybrid theme system (Blade + React/TSX)
- Hierarchical taxonomy management
- Role-based permissions with Spatie Laravel Permission
- Media library with folder organization
- SEO optimization with automatic sitemap generation
- Server-side rendering with Inertia.js

## Core Components

### Models

#### Post (`app/Models/Post.php`)
The central content model supporting hierarchical content with custom fields.

```php
class Post extends Model
{
    protected $fillable = [
        'post_type_id', 'author_id', 'title', 'slug', 'excerpt', 
        'content', 'featured_image', 'status', 'published_at',
        'parent_id', 'menu_order', 'meta_title', 'meta_description', 
        'meta_data', 'view_count'
    ];

    // Relationships
    public function postType(): BelongsTo;
    public function author(): BelongsTo;
    public function parent(): BelongsTo;
    public function children(): HasMany;
    public function taxonomyTerms(): BelongsToMany;

    // Scopes
    public function scopePublished($query);
    public function scopeByPostType($query, $postTypeId);
}
```

#### PostType (`app/Models/PostType.php`)
Defines content types with routing and template configuration.

```php
class PostType extends Model
{
    protected $fillable = [
        'name', 'label', 'plural_label', 'description', 'route_prefix',
        'single_template_id', 'archive_template_id', 'has_taxonomies',
        'has_featured_image', 'has_excerpt', 'has_comments', 'supports',
        'taxonomies', 'slug', 'is_public', 'is_hierarchical',
        'menu_icon', 'menu_position'
    ];

    protected $casts = [
        'supports' => 'array',
        'taxonomies' => 'array',
        'is_public' => 'boolean',
        'is_hierarchical' => 'boolean'
    ];
}
```

#### Theme (`app/Models/Theme.php`)
Manages theme metadata and configuration with support for both Blade and React templates.

```php
class Theme extends Model
{
    protected $fillable = [
        'name', 'slug', 'version', 'description', 'author', 'author_url',
        'screenshot', 'tags', 'supports', 'templates', 'partials',
        'assets', 'customizer', 'menus', 'widget_areas', 'directory_path',
        'is_active', 'is_installed', 'template_engine'
    ];

    // Key methods
    public function getTemplatePath(string $template): ?string;
    public function getAssetUrl(string $type, string $asset = null);
    public function supports(string $feature): bool;
    public function activate(): bool;
}
```

### Services

#### ThemeManager (`app/Services/ThemeManager.php`)
Central service for theme discovery, installation, and management.

```php
class ThemeManager
{
    public function getActiveTheme(): ?Theme;
    public function discoverThemes(): Collection;
    public function installTheme(array $themeData, int $userId = null): Theme;
    public function activateTheme(string $slug): bool;
    public function renderTemplate(string $template, array $data = []): ?string;
    public function publishAssets(Theme $theme): bool;
}
```

#### ReactTemplateRenderer (`app/Services/ReactTemplateRenderer.php`)
Handles React component rendering via Inertia.js for React-based themes.

```php
class ReactTemplateRenderer
{
    public function render(string $templateName, array $data = []): \Inertia\Response;
    public function canRender(string $templateName): bool;
    public function isReactTheme(): bool;
    protected function convertToInertiaPath(string $themeSlug, string $componentPath): string;
}
```

#### TemplateRenderingService (`app/Services/TemplateRenderingService.php`)
Handles Blade template rendering with theme fallbacks and layout management.

## Database Schema

### Core Tables

#### posts
```sql
- id (bigint, primary key)
- post_type_id (bigint, foreign key)
- author_id (bigint, foreign key)
- title (varchar)
- slug (varchar, unique)
- excerpt (text, nullable)
- content (longtext, nullable)
- featured_image (varchar, nullable)
- status (enum: draft, published, private)
- published_at (timestamp, nullable)
- parent_id (bigint, nullable, self-reference)
- menu_order (integer, default 0)
- meta_title (varchar, nullable)
- meta_description (text, nullable)
- meta_data (json, nullable)
- view_count (integer, default 0)
- created_at, updated_at (timestamps)
```

#### post_types
```sql
- id (bigint, primary key)
- name (varchar, unique)
- label (varchar)
- plural_label (varchar)
- description (text, nullable)
- route_prefix (varchar, nullable)
- single_template_id (bigint, nullable)
- archive_template_id (bigint, nullable)
- has_taxonomies (boolean, default false)
- has_featured_image (boolean, default true)
- has_excerpt (boolean, default true)
- has_comments (boolean, default false)
- supports (json, nullable)
- taxonomies (json, nullable)
- slug (varchar, unique)
- is_public (boolean, default true)
- is_hierarchical (boolean, default false)
- menu_icon (varchar, nullable)
- menu_position (integer, nullable)
- created_at, updated_at (timestamps)
```

#### themes
```sql
- id (bigint, primary key)
- name (varchar)
- slug (varchar, unique)
- version (varchar)
- description (text, nullable)
- author (varchar, nullable)
- author_url (varchar, nullable)
- screenshot (varchar, nullable)
- tags (json, nullable)
- supports (json, nullable)
- template_engine (varchar, default 'blade')
- templates (json, nullable)
- partials (json, nullable)
- assets (json, nullable)
- customizer (json, nullable)
- menus (json, nullable)
- widget_areas (json, nullable)
- directory_path (varchar)
- is_active (boolean, default false)
- is_installed (boolean, default false)
- installed_at (timestamp, nullable)
- installed_by (bigint, nullable)
- created_at, updated_at (timestamps)
```

## Theme System

### Hybrid Architecture
Modulo CMS supports both Blade and React-based themes through a hybrid rendering system:

1. **Blade Themes**: Traditional Laravel Blade templates
2. **React Themes**: TypeScript components rendered via Inertia.js

### Theme Configuration (`theme.json`)

```json
{
  "name": "Theme Name",
  "slug": "theme-slug",
  "version": "1.0.0",
  "template_engine": "react", // or "blade"
  "templates": {
    "index": {
      "type": "react",
      "component": "components/Index.tsx"
    },
    "post": {
      "type": "react", 
      "component": "components/Post.tsx"
    }
  },
  "supports": {
    "post_thumbnails": true,
    "menus": true,
    "widgets": true
  },
  "customizer": {
    "colors": {
      "primary": {
        "label": "Primary Color",
        "type": "color",
        "default": "#3b82f6"
      }
    }
  }
}
```

### Theme Directory Structure

```
resources/themes/theme-name/
├── theme.json              # Theme configuration
├── components/             # React components (React themes)
│   ├── Layout.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── partials/
├── templates/              # Blade templates (Blade themes)
│   ├── layout.blade.php
│   ├── index.blade.php
│   └── partials/
└── assets/                 # Static assets
    ├── css/
    ├── js/
    └── images/
```

### Template Hierarchy

1. **React Theme**: `ReactTemplateRenderer` → Inertia component
2. **Blade Theme**: `ThemeManager::renderTemplate()` → Blade view
3. **Fallback**: Default Inertia pages in `resources/js/Pages/`

## Routing & Controllers

### Frontend Routes (`routes/web.php`)

```php
// Home page
Route::get('/', [FrontendController::class, 'home'])->name('home');

// Dynamic post type routes (auto-generated)
Route::get('/{postTypeSlug}', [FrontendController::class, 'listPosts']);
Route::get('/{postTypeSlug}/{slug}', [FrontendController::class, 'showContent']);

// Taxonomy archives
Route::get('/tag/{slug}', [FrontendController::class, 'listByTaxonomyTerm']);
Route::get('/category/{slug}', [FrontendController::class, 'listByTaxonomyTerm']);

// Fallback for pages
Route::get('/{slug}', [FrontendController::class, 'showContent'])->name('page.show');
```

### Admin Routes (`routes/admin.php`)

All admin routes are prefixed with `dashboard/admin/` and protected by authentication and permissions:

```php
Route::middleware(['auth', 'verified'])->prefix('dashboard/admin')->name('dashboard.admin.')->group(function () {
    // Content Management
    Route::resource('posts', PostController::class)->middleware('permission:view posts');
    Route::resource('post-types', PostTypeController::class)->middleware('permission:view post types');
    Route::resource('taxonomies', TaxonomyController::class)->middleware('permission:view taxonomies');
    
    // Theme Management
    Route::resource('themes', ThemeController::class)->middleware('permission:view themes');
    Route::post('themes/{slug}/activate', [ThemeController::class, 'activate']);
    
    // User Management
    Route::resource('users', UserController::class)->middleware('permission:view users');
    Route::resource('roles', RoleController::class)->middleware('permission:view roles');
});
```

### FrontendController Logic

The `FrontendController` implements intelligent routing:

1. **Theme Detection**: Checks if active theme is React or Blade
2. **Template Resolution**: Attempts React → Blade → Inertia fallback
3. **Content Type Handling**: Differentiates between posts and pages
4. **Dynamic Routing**: Auto-generates routes based on post type configuration

```php
public function showContent(Request $request)
{
    $slug = $request->route('slug');
    $postTypeSlug = $request->route('postTypeSlug');
    
    // Determine content type and fetch content
    if (!$postTypeSlug) {
        // Page lookup
        $pagePostType = PostType::where('route_prefix', '')->first();
        $content = Post::where('slug', $slug)->where('post_type_id', $pagePostType->id)->first();
    } else {
        // Post lookup
        $postType = PostType::where('route_prefix', $postTypeSlug)->firstOrFail();
        $content = Post::where('slug', $slug)->where('post_type_id', $postType->id)->firstOrFail();
    }
    
    return $this->renderContent($content);
}

private function renderContent($content)
{
    // Try React first
    if ($this->shouldUseReact() && $this->reactRenderer->canRender('post')) {
        return $this->reactRenderer->render('post', ['post' => $content]);
    }
    
    // Fallback to Blade
    $rendered = $this->templateService->renderPost($content);
    if ($rendered) {
        return response($rendered)->header('Content-Type', 'text/html');
    }
    
    // Final fallback to Inertia
    return Inertia::render('frontend/post', ['post' => $content]);
}
```

## Services & Business Logic

### Key Services

#### MenuService (`app/Services/MenuService.php`)
Handles menu creation, management, and rendering with hierarchical support.

#### SitemapBuilder (`app/Services/SitemapBuilder.php`)
Generates XML sitemaps with configurable post type inclusion and priority settings.

#### TemplateRenderingService (`app/Services/TemplateRenderingService.php`)
Core template rendering with layout management, data injection, and theme integration.

### Permission System

Uses Spatie Laravel Permission for role-based access control:

```php
// Permissions are granular
'view posts', 'create posts', 'edit posts', 'delete posts'
'view themes', 'install themes', 'activate themes', 'customize themes'
'view users', 'create users', 'edit users', 'delete users'
```

## Frontend Architecture

### React Components Structure

```
resources/js/
├── Pages/                  # Inertia pages
│   ├── dashboard/         # Admin dashboard
│   ├── frontend/          # Public pages
│   └── Themes/            # Theme components
├── components/            # Shared components
│   ├── ui/               # UI primitives
│   └── forms/            # Form components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities
└── types/                # TypeScript definitions
```

### Theme Components (`resources/js/Pages/Themes/`)

React themes are organized by theme name:

```
Themes/
└── ModernReact/          # PascalCase theme name
    ├── Index.tsx         # Post listing
    ├── Post.tsx          # Single post
    ├── Page.tsx          # Static page
    └── Layout.tsx        # Main layout
```

### TypeScript Interfaces

```typescript
interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  published_at: string;
  author: User;
  post_type: PostType;
  terms: TaxonomyTerm[];
}

interface PostType {
  id: number;
  name: string;
  label: string;
  route_prefix: string;
  is_public: boolean;
}

interface Theme {
  name: string;
  slug: string;
  colors: {
    primary: string;
    secondary: string;
  };
  typography: {
    font_family: string;
  };
}
```

## API Reference

### Public API Endpoints

#### Menu API (`/api/menus/`)
```php
GET /api/menus/slug/{slug}        # Get menu by slug
GET /api/menus/location/{location} # Get menu by location
```

### Internal API (Dashboard)

All admin API endpoints follow RESTful conventions:

```php
GET    /dashboard/admin/posts              # List posts
POST   /dashboard/admin/posts              # Create post
GET    /dashboard/admin/posts/{id}         # Show post
PUT    /dashboard/admin/posts/{id}         # Update post
DELETE /dashboard/admin/posts/{id}         # Delete post
```

### API Resources

Laravel API Resources provide consistent JSON structure:

```php
// PostResource
{
  "id": 1,
  "title": "Post Title",
  "slug": "post-title",
  "content": "...",
  "post_type_label": "Blog Post",
  "author_name": "John Doe",
  "published_at": "2025-01-01T00:00:00Z"
}
```

## Development Workflow

### Local Development Setup

1. **Clone and Setup**:
   ```bash
   git clone https://github.com/PhantomPixelDev/modulo-cms.git
   cd modulo-cms
   cp .env.example .env
   ```

2. **Using Podman Compose**:
   ```bash
   podman compose up -d
   podman compose exec app php artisan key:generate
   podman compose exec app php artisan migrate --seed
   ```

3. **Manual Setup**:
   ```bash
   composer install
   bun install
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve
   bun run dev  # In separate terminal
   ```

### Development Commands

```bash
# Backend
composer dev                    # Start all services
php artisan migrate:fresh --seed
php artisan theme:install
php artisan cache:clear

# Frontend
bun run dev                     # Vite dev server
bun run build                   # Production build
bun run build:ssr              # SSR build
bun run types                   # TypeScript check
bun run lint                    # ESLint
bun run format                  # Prettier

# Cleaning
bun run clean                   # Clean all caches
bun run clean:php              # Clean PHP caches
bun run clean:frontend         # Clean frontend caches
```

### Theme Development

1. **Create Theme Directory**:
   ```bash
   mkdir -p resources/themes/my-theme
   ```

2. **Create `theme.json`**:
   ```json
   {
     "name": "My Theme",
     "slug": "my-theme",
     "template_engine": "react",
     "templates": {
       "index": {
         "type": "react",
         "component": "components/Index.tsx"
       }
     }
   }
   ```

3. **Create Components** (React themes):
   ```bash
   mkdir -p resources/js/Pages/Themes/MyTheme
   # Create Index.tsx, Post.tsx, etc.
   ```

4. **Install Theme**:
   ```bash
   php artisan theme:discover
   # Or via admin dashboard
   ```

## Testing

### Test Structure

```
tests/
├── Feature/               # Integration tests
│   ├── Admin/            # Admin functionality
│   ├── Auth/             # Authentication
│   └── Settings/         # Settings management
└── Unit/                 # Unit tests
```

### Running Tests

```bash
# All tests
php artisan test

# Specific test suite
php artisan test --testsuite=Feature

# With coverage
php artisan test --coverage

# In Podman container
podman compose exec app php artisan test
```

### Test Examples

```php
// Feature test example
test('can create post with featured image', function () {
    $user = User::factory()->create();
    $postType = PostType::factory()->create();
    
    $response = $this->actingAs($user)
        ->post('/dashboard/admin/posts', [
            'title' => 'Test Post',
            'content' => 'Test content',
            'post_type_id' => $postType->id,
            'featured_image' => 'image.jpg'
        ]);
    
    $response->assertRedirect();
    $this->assertDatabaseHas('posts', [
        'title' => 'Test Post',
        'featured_image' => 'image.jpg'
    ]);
});
```

## Deployment

### Production Build

```bash
# Build assets
bun run build

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Run migrations
php artisan migrate --force
```

### Environment Configuration

Key environment variables:

```env
APP_NAME="Modulo CMS"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=modulo_cms
DB_USERNAME=root
DB_PASSWORD=

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

### Server Requirements

- PHP 8.4+
- Composer
- Web server (Nginx/Apache)
- Database (MySQL 8.0+/PostgreSQL 13+)
- Redis (recommended for caching)
- Bun (for asset building and package management)

### Deployment Checklist

- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Configure database connection
- [ ] Set up Redis caching
- [ ] Configure file permissions
- [ ] Set up SSL certificate
- [ ] Configure backup strategy
- [ ] Set up monitoring
- [ ] Configure log rotation

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
