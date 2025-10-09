# Theme System Guide

Complete guide to creating, managing, and customizing themes in Modulo CMS.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Creating Themes](#creating-themes)
3. [Theme Structure](#theme-structure)
4. [CLI Commands](#cli-commands)
5. [Theme Configuration](#theme-configuration)
6. [Template Types](#template-types)
7. [Child Themes](#child-themes)
8. [Best Practices](#best-practices)

---

## Quick Start

### Create a New Theme

```bash
# All themes are React-based
php artisan theme:make "My Theme"
```

### Install and Activate

```bash
php artisan theme:install my-theme
php artisan theme:activate my-theme
```

### List All Themes

```bash
php artisan theme:list
```

---

## Creating Themes

### Using the Scaffold Generator

The easiest way to create a theme is using the generator:

```bash
php artisan theme:make "Beautiful Theme"
```

This creates a complete theme structure at `resources/themes/beautiful-theme/`:

```
beautiful-theme/
├── theme.json          # Theme configuration
├── README.md           # Documentation
├── assets/
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript files
│   └── images/        # Images and icons
└── components/        # React components (or templates/ for Blade)
    ├── Layout.tsx
    ├── Post.tsx
    ├── Posts.tsx
    ├── Page.tsx
    └── Index.tsx
```

### Manual Creation

1. Create directory in `resources/themes/{slug}/`
2. Add `theme.json` configuration
3. Create template files
4. Add assets
5. Install via CLI

---

## Theme Structure

### Required Files

**`theme.json`** - Theme configuration file
```json
{
  "name": "My Theme",
  "slug": "my-theme",
  "version": "1.0.0",
  "template_engine": "react",
  "templates": {
    "post": {
      "type": "react",
      "component": "components/Post.tsx"
    }
  }
}
```

### Directory Structure

#### React Theme
```
my-theme/
├── theme.json
├── components/
│   ├── Layout.tsx       # Main layout wrapper
│   ├── Header.tsx       # Site header
│   ├── Footer.tsx       # Site footer
│   ├── Post.tsx         # Single post template
│   ├── Posts.tsx        # Post list/archive
│   ├── Page.tsx         # Single page template
│   ├── Index.tsx        # Homepage
│   └── partials/
│       ├── Navigation.tsx
│       └── Sidebar.tsx
└── assets/
    ├── css/
    │   └── theme.css
    ├── js/
    │   └── theme.js
    └── images/
```

## CLI Commands

### `theme:make`
Create a new React theme scaffold

```bash
php artisan theme:make "Theme Name"
```

All themes are React-based using Inertia.js and TypeScript.

---

### `theme:list`
List all themes

```bash
php artisan theme:list                 # Show all themes
php artisan theme:list --installed     # Only installed
php artisan theme:list --available     # Only uninstalled
```

**Output:**
```
Installed Themes:
┌──────────────┬──────────────┬─────────┬──────────┬────────┐
│ Name         │ Slug         │ Version │ Status   │ Engine │
├──────────────┼──────────────┼─────────┼──────────┼────────┤
│ Modern React │ modern-react │ 1.0.0   │ ✓ Active │ react  │
└──────────────┴──────────────┴─────────┴──────────┴────────┘
```

---

### `theme:install`
Install a theme from the themes directory

```bash
php artisan theme:install my-theme
```

**What it does:**
1. Validates theme configuration
2. Creates database record
3. Publishes assets to `/public/themes/`
4. Optionally activates the theme

---

### `theme:activate`
Activate an installed theme

```bash
php artisan theme:activate my-theme
```

**Note:** Only one theme can be active at a time. Activating a theme deactivates all others.

---

### `theme:uninstall`
Uninstall a theme

```bash
php artisan theme:uninstall my-theme
php artisan theme:uninstall my-theme --force  # Skip confirmation
```

**Safety:**
- Cannot uninstall active theme
- Requires confirmation (unless --force)
- Removes published assets
- Theme files remain in `resources/themes/`

---

### `theme:publish-assets`
Publish theme assets to public directory

```bash
php artisan theme:publish-assets my-theme  # Publish single theme
php artisan theme:publish-assets           # Publish all themes
```

**Features:**
- Intelligent change detection (only publishes if changed)
- Hash-based comparison
- Automatic versioning

---

### `theme:update`
Update themes to latest version

```bash
php artisan theme:update my-theme  # Update single theme
php artisan theme:update           # Update all themes
```

**Process:**
1. Compares filesystem version with database
2. Re-installs if newer version found
3. Republishes assets
4. Clears caches

---

## Theme Configuration

### `theme.json` Reference

```json
{
  "name": "My Theme",
  "slug": "my-theme",
  "version": "1.0.0",
  "description": "A beautiful theme for Modulo CMS",
  "author": "Your Name",
  "author_url": "https://yoursite.com",
  "screenshot": "screenshot.png",
  "tags": ["modern", "minimal", "responsive"],
  
  "supports": {
    "post_thumbnails": true,
    "menus": true,
    "widgets": true,
    "custom_logo": true,
    "responsive": true
  },
  
  "templates": {
    "layout": {
      "component": "components/Layout.tsx"
    },
    "post": {
      "component": "components/Post.tsx"
    },
    "posts": {
      "component": "components/Posts.tsx"
    },
    "page": {
      "component": "components/Page.tsx"
    },
    "index": {
      "component": "components/Index.tsx"
    }
  },
  
  "menus": {
    "primary": "Primary Navigation",
    "footer": "Footer Links"
  },
  
  "customizer": {
    "colors": {
      "primary": {
        "label": "Primary Color",
        "type": "color",
        "default": "#3b82f6"
      }
    },
    "typography": {
      "font_family": {
        "label": "Font Family",
        "type": "select",
        "default": "inter",
        "options": [
          {"value": "inter", "label": "Inter"},
          {"value": "roboto", "label": "Roboto"}
        ]
      }
    }
  }
}
```

### Field Descriptions

**Required Fields:**
- `name` - Display name of the theme
- `slug` - Unique identifier (lowercase, hyphens only)
- `version` - Semantic version (e.g., 1.0.0)

**Optional Fields:**
- `description` - Brief description
- `author` - Theme author name
- `author_url` - Author website
- `screenshot` - Preview image filename
- `tags` - Array of keywords
- `supports` - Feature flags
- `menus` - Menu locations
- `customizer` - Theme settings

---

## Template Types

### React Templates

React templates use TSX/JSX components with Inertia.js.

**Example Post Template:**
```tsx
import React from 'react';

interface PostProps {
    post: {
        id: number;
        title: string;
        content: string;
        author: {
            name: string;
        };
        published_at: string;
    };
}

export default function Post({ post }: PostProps) {
    return (
        <article className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            
            <div className="text-gray-600 mb-6">
                By {post.author.name} on {post.published_at}
            </div>
            
            <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
            />
        </article>
    );
}
```

**Available Props:**
- `post` - Single post data
- `posts` - Post collection
- `page` - Page data
- `site` - Site configuration
- `theme` - Theme settings
- `menus` - Menu data

---

**Available Variables:**
- `$post` - Single post
- `$posts` - Post collection
- `$page` - Page data
- `$site_name` - Site name
- `$theme` - Theme settings

---

## Child Themes

Child themes allow you to customize an existing theme without modifying the original.

### Creating a Child Theme

1. **Create child theme directory:**
```bash
mkdir resources/themes/my-child-theme
```

2. **Create theme.json with parent:**
```json
{
  "name": "My Child Theme",
  "slug": "my-child-theme",
  "parent_theme": "modern-react",
  "version": "1.0.0",
  "template_engine": "react",
  "templates": {
    "post": {
      "type": "react",
      "component": "components/Post.tsx"
    }
  }
}
```

3. **Override specific templates:**
Only include templates you want to override. Parent theme templates are used for everything else.

### Benefits
- Maintain customizations across parent updates
- Override only what you need
- Easier to update parent theme

---

## Best Practices

### 1. **Semantic Versioning**
Use proper version numbers:
- **1.0.0** - Initial release
- **1.0.1** - Bug fixes
- **1.1.0** - New features (backward compatible)
- **2.0.0** - Breaking changes

### 2. **Asset Organization**
```
assets/
├── css/
│   ├── theme.css          # Main stylesheet
│   ├── components.css     # Component styles
│   └── utilities.css      # Utility classes
├── js/
│   ├── theme.js           # Main script
│   └── components/        # JS modules
└── images/
    ├── logo.svg
    └── icons/
```

### 3. **Responsive Design**
Always design mobile-first and test on multiple devices.

### 4. **Performance**
- Minimize CSS/JS files
- Optimize images
- Use lazy loading
- Implement caching headers

### 5. **Accessibility**
- Use semantic HTML
- Add ARIA labels
- Ensure keyboard navigation
- Test with screen readers

### 6. **Documentation**
Include README.md with:
- Installation instructions
- Configuration options
- Customization guide
- Changelog

---

## Troubleshooting

### Theme Not Installing
**Problem:** Validation errors
**Solution:** Check theme.json syntax and required fields

### Assets Not Loading
**Problem:** 404 errors for CSS/JS
**Solution:** Run `php artisan theme:publish-assets`

### Templates Not Found
**Problem:** White screen or 500 errors
**Solution:** Verify template paths in theme.json

### Cache Issues
**Problem:** Changes not appearing
**Solution:** 
```bash
php artisan cache:clear
php artisan view:clear
php artisan config:clear
```

---

## Examples

### Minimal React Theme

**theme.json:**
```json
{
  "name": "Minimal",
  "slug": "minimal",
  "version": "1.0.0",
  "template_engine": "react",
  "templates": {
    "post": {"type": "react", "component": "components/Post.tsx"},
    "posts": {"type": "react", "component": "components/Posts.tsx"}
  }
}
```

### Minimal Blade Theme

**theme.json:**
```json
{
  "name": "Classic",
  "slug": "classic",
  "version": "1.0.0",
  "template_engine": "blade",
  "templates": {
    "post": "templates/post.blade.php",
    "posts": "templates/posts.blade.php"
  }
}
```

---

## Additional Resources

- [Laravel Blade Documentation](https://laravel.com/docs/blade)
- [React Documentation](https://react.dev)
- [Inertia.js Documentation](https://inertiajs.com)
- [Tailwind CSS](https://tailwindcss.com)

---

## Support

For issues or questions:
1. Check this documentation
2. Review theme validation errors
3. Check application logs
4. Create an issue on GitHub

---

**Happy theming! 🎨**
