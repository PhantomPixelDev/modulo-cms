# Plugin Development Guide for Modulo CMS

This guide explains how to create, develop, and distribute plugins for Modulo CMS, built on the Laravel 12 + React 19 starter kit with authentication.

## 🎯 Overview

Plugins in Modulo CMS are modular extensions that add functionality to the core system. They can include:
- New content types
- Custom fields
- Admin interfaces
- API endpoints
- Frontend components
- Database migrations
- Configuration options

## 🏗 Plugin Architecture

### Plugin Structure
```
app/Plugins/MyPlugin/
├── Controllers/          # Plugin controllers
├── Models/              # Plugin models
├── Views/               # Blade templates (if needed)
├── Routes/              # Plugin routes
├── Migrations/          # Database migrations
├── Config/              # Configuration files
├── Assets/              # Frontend assets
├── Tests/               # Plugin tests
├── Database/            # Seeders and factories
│   ├── Seeders/
│   └── Factories/
├── Resources/           # Frontend resources
│   └── js/
│       ├── components/  # React components
│       ├── pages/       # Inertia pages
│       └── types/       # TypeScript types
├── Plugin.php           # Main plugin class
├── composer.json        # Plugin dependencies
├── package.json         # Frontend dependencies
└── README.md           # Plugin documentation
```

### Plugin Class
```php
<?php

namespace App\Plugins\MyPlugin;

use Illuminate\Support\ServiceProvider;

class Plugin extends ServiceProvider
{
    /**
     * Plugin name
     */
    public const NAME = 'MyPlugin';

    /**
     * Plugin version
     */
    public const VERSION = '1.0.0';

    /**
     * Plugin description
     */
    public const DESCRIPTION = 'A sample plugin for Modulo CMS';

    /**
     * Register plugin services
     */
    public function register(): void
    {
        // Register services, bindings, etc.
        $this->app->singleton('myplugin.service', function ($app) {
            return new MyPluginService();
        });
    }

    /**
     * Boot the plugin
     */
    public function boot(): void
    {
        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/Routes/web.php');

        // Load migrations
        $this->loadMigrationsFrom(__DIR__ . '/Migrations');

        // Load views
        $this->loadViewsFrom(__DIR__ . '/Views', 'myplugin');

        // Load configuration
        $this->publishes([
            __DIR__ . '/Config/myplugin.php' => config_path('myplugin.php'),
        ], 'myplugin-config');

        // Register commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                MyPluginCommand::class,
            ]);
        }

        // Register hooks
        $this->registerHooks();

        // Register menu items
        $this->registerMenuItems();
    }

    /**
     * Register plugin hooks
     */
    protected function registerHooks(): void
    {
        // Example: Hook into content creation
        Hook::listen('content.created', function ($content) {
            // Handle content creation
        });

        // Example: Hook into user registration
        Hook::listen('user.registered', function ($user) {
            // Handle user registration
        });
    }

    /**
     * Register admin menu items
     */
    protected function registerMenuItems(): void
    {
        Menu::add('myplugin', [
            'label' => 'My Plugin',
            'icon' => 'icon-name',
            'route' => 'myplugin.index',
            'children' => [
                [
                    'label' => 'Settings',
                    'route' => 'myplugin.settings',
                ],
                [
                    'label' => 'Items',
                    'route' => 'myplugin.items.index',
                ],
            ],
        ]);
    }
}
```

## 🚀 Creating Your First Plugin

### 1. Generate Plugin Structure
```bash
# Create plugin directory
mkdir -p app/Plugins/MyPlugin

# Create basic structure
cd app/Plugins/MyPlugin
mkdir -p Controllers Models Views Routes Migrations Config Assets Tests
```

### 2. Create Plugin Class
```php
<?php

namespace App\Plugins\MyPlugin;

use Illuminate\Support\ServiceProvider;

class Plugin extends ServiceProvider
{
    public const NAME = 'MyPlugin';
    public const VERSION = '1.0.0';
    public const DESCRIPTION = 'My first plugin';

    public function register(): void
    {
        // Register services
    }

    public function boot(): void
    {
        // Load routes
        $this->loadRoutesFrom(__DIR__ . '/Routes/web.php');
        
        // Load migrations
        $this->loadMigrationsFrom(__DIR__ . '/Migrations');
    }
}
```

### 3. Create Routes
```php
<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::get('/myplugin', [MyPluginController::class, 'index'])
        ->name('myplugin.index');
});
```

### 4. Create Controller
```php
<?php

namespace App\Plugins\MyPlugin\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class MyPluginController extends Controller
{
    public function index()
    {
        return Inertia::render('MyPlugin/Index', [
            'data' => 'Hello from MyPlugin!',
        ]);
    }
}
```

### 5. Create Frontend Page
```tsx
// resources/js/pages/MyPlugin/Index.tsx
import React from 'react';
import { Page } from '@/types';

interface Props {
  data: string;
}

const Index: Page<Props> = ({ data }) => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Plugin</h1>
      <p>{data}</p>
    </div>
  );
};

export default Index;
```

### 6. Register Plugin
Add your plugin to the application's plugin registry:

```php
// config/plugins.php
return [
    'enabled' => [
        App\Plugins\MyPlugin\Plugin::class,
    ],
];
```

## 📝 Plugin Development Best Practices

### 1. Naming Conventions
- Use PascalCase for plugin names
- Use kebab-case for routes and URLs
- Use snake_case for database tables
- Use camelCase for JavaScript/TypeScript

### 2. Database Design
```php
// Migrations should be prefixed with plugin name
// Example: 2024_01_01_000001_create_myplugin_items_table.php

public function up(): void
{
    Schema::create('myplugin_items', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->text('description')->nullable();
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}
```

### 3. Model Design
```php
<?php

namespace App\Plugins\MyPlugin\Models;

use Illuminate\Database\Eloquent\Model;

class MyPluginItem extends Model
{
    protected $table = 'myplugin_items';

    protected $fillable = [
        'name',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Plugin-specific relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

### 4. Frontend Components
```tsx
// resources/js/components/MyPlugin/ItemCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ItemCardProps {
  item: {
    id: number;
    name: string;
    description?: string;
    is_active: boolean;
  };
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{item.description}</p>
        <div className="mt-2">
          <span className={`px-2 py-1 text-xs rounded ${
            item.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {item.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 5. Configuration
```php
// Config/myplugin.php
return [
    'name' => env('MYPLUGIN_NAME', 'My Plugin'),
    'version' => '1.0.0',
    'settings' => [
        'feature_enabled' => env('MYPLUGIN_FEATURE_ENABLED', true),
        'max_items' => env('MYPLUGIN_MAX_ITEMS', 100),
    ],
];
```

## 🔌 Plugin Hooks System

### Available Hooks
```php
// Content hooks
Hook::listen('content.created', function ($content) {});
Hook::listen('content.updated', function ($content) {});
Hook::listen('content.deleted', function ($content) {});

// User hooks
Hook::listen('user.registered', function ($user) {});
Hook::listen('user.updated', function ($user) {});
Hook::listen('user.deleted', function ($user) {});

// Authentication hooks
Hook::listen('user.login', function ($user) {});
Hook::listen('user.logout', function ($user) {});

// System hooks
Hook::listen('plugin.installed', function ($plugin) {});
Hook::listen('plugin.uninstalled', function ($plugin) {});
Hook::listen('plugin.enabled', function ($plugin) {});
Hook::listen('plugin.disabled', function ($plugin) {});
```

### Using Hooks
```php
// In your plugin
Hook::listen('content.created', function ($content) {
    // Send notification
    Notification::send($content->user, new ContentCreatedNotification($content));
    
    // Log activity
    Activity::log('content.created', $content);
    
    // Update statistics
    Statistics::increment('content_count');
});
```

## 🧪 Testing Plugins

### PHP Tests
```php
<?php

namespace Tests\Plugins\MyPlugin;

use Tests\TestCase;
use App\Plugins\MyPlugin\Models\MyPluginItem;

class MyPluginTest extends TestCase
{
    public function test_can_create_item()
    {
        $item = MyPluginItem::factory()->create([
            'name' => 'Test Item',
            'description' => 'Test Description',
        ]);

        $this->assertDatabaseHas('myplugin_items', [
            'id' => $item->id,
            'name' => 'Test Item',
        ]);
    }

    public function test_can_access_plugin_page()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get('/myplugin');

        $response->assertOk();
    }
}
```

### Frontend Tests
```tsx
// __tests__/MyPlugin/ItemCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ItemCard } from '@/components/MyPlugin/ItemCard';

describe('ItemCard', () => {
  it('renders item information correctly', () => {
    const item = {
      id: 1,
      name: 'Test Item',
      description: 'Test Description',
      is_active: true,
    };

    render(<ItemCard item={item} />);

    expect(screen.getByText('Test Item')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
```

## 📦 Plugin Distribution

### 1. Package Structure
```
myplugin/
├── src/
│   └── Plugin.php
├── resources/
│   └── js/
├── database/
│   └── migrations/
├── config/
├── composer.json
├── package.json
└── README.md
```

### 2. Composer Configuration
```json
{
    "name": "modulo-cms/myplugin",
    "description": "A plugin for Modulo CMS",
    "type": "modulo-cms-plugin",
    "license": "MIT",
    "authors": [
        {
            "name": "Your Name",
            "email": "your.email@example.com"
        }
    ],
    "require": {
        "php": "^8.4",
        "laravel/framework": "^12.0",
        "inertiajs/inertia-laravel": "^2.0"
    },
    "autoload": {
        "psr-4": {
            "ModuloCMS\\MyPlugin\\": "src/"
        }
    },
    "extra": {
        "modulo-cms": {
            "plugin": "ModuloCMS\\MyPlugin\\Plugin"
        }
    }
}
```

### 3. Package.json for Frontend
```json
{
    "name": "@modulo-cms/myplugin",
    "version": "1.0.0",
    "description": "Frontend assets for MyPlugin",
    "main": "dist/index.js",
    "scripts": {
        "build": "vite build",
        "dev": "vite"
    },
    "dependencies": {
        "react": "^19.0.0",
        "@modulo-cms/ui": "^1.0.0"
    }
}
```

## 🔧 Plugin Management

### Installation
```bash
# Install via Composer
composer require modulo-cms/myplugin

# Install via npm (for frontend assets)
npm install @modulo-cms/myplugin
```

### Activation/Deactivation
```php
// Activate plugin
PluginManager::activate('myplugin');

// Deactivate plugin
PluginManager::deactivate('myplugin');

// Check if plugin is active
if (PluginManager::isActive('myplugin')) {
    // Plugin is active
}
```

### Configuration
```php
// Get plugin configuration
$config = config('myplugin');

// Set plugin configuration
config(['myplugin.feature_enabled' => true]);
```

## 🚀 Advanced Plugin Features

### 1. Custom Content Types
```php
// Register custom content type
ContentType::register('myplugin_item', [
    'name' => 'MyPlugin Item',
    'fields' => [
        'name' => [
            'type' => 'text',
            'label' => 'Name',
            'required' => true,
        ],
        'description' => [
            'type' => 'textarea',
            'label' => 'Description',
        ],
        'is_active' => [
            'type' => 'boolean',
            'label' => 'Active',
            'default' => true,
        ],
    ],
]);
```

### 2. Custom Fields
```php
// Register custom field type
FieldType::register('myplugin_custom', [
    'component' => 'MyPluginCustomField',
    'validation' => 'required|string|max:255',
    'sanitize' => 'trim|strip_tags',
]);
```

### 3. API Endpoints
```php
// Register API routes
Route::prefix('api/v1/myplugin')->group(function () {
    Route::get('/items', [MyPluginApiController::class, 'index']);
    Route::post('/items', [MyPluginApiController::class, 'store']);
    Route::get('/items/{id}', [MyPluginApiController::class, 'show']);
    Route::put('/items/{id}', [MyPluginApiController::class, 'update']);
    Route::delete('/items/{id}', [MyPluginApiController::class, 'destroy']);
});
```

## 📚 Resources

### Documentation
- [Laravel Plugin Development](https://laravel.com/docs/packages)
- [Inertia.js Documentation](https://inertiajs.com)
- [React Documentation](https://react.dev)

### Examples
- [Sample Plugin Repository](https://github.com/modulo-cms/sample-plugin)
- [Plugin Templates](https://github.com/modulo-cms/plugin-templates)

### Community
- [Plugin Development Forum](https://forum.modulo-cms.com)
- [Plugin Marketplace](https://plugins.modulo-cms.com)
- [Developer Discord](https://discord.gg/modulo-cms)

---

This guide will be updated as the plugin system evolves. Check the documentation for the latest information! 