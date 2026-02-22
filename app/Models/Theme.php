<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\File;

class Theme extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'parent_theme_id',
        'version',
        'description',
        'author',
        'author_url',
        'screenshot',
        'tags',
        'supports',
        'template_engine',
        'templates',
        'partials',
        'assets',
        'menus',
        'widget_areas',
        'directory_path',
        'is_active',
        'is_installed',
        'installed_at',
        'installed_by',
    ];

    protected $casts = [
        'tags' => 'array',
        'supports' => 'array',
        'templates' => 'array',
        'partials' => 'array',
        'assets' => 'array',
        'menus' => 'array',
        'widget_areas' => 'array',
        'is_active' => 'boolean',
        'is_installed' => 'boolean',
        'installed_at' => 'datetime',
    ];

    /**
     * Get the user who installed this theme
     */
    public function installer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installed_by');
    }

    /**
     * Get the parent theme
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Theme::class, 'parent_theme_id');
    }

    /**
     * Get child themes
     */
    public function children()
    {
        return $this->hasMany(Theme::class, 'parent_theme_id');
    }

    /**
     * Scope to get only active themes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only installed themes
     */
    public function scopeInstalled($query)
    {
        return $query->where('is_installed', true);
    }

    /**
     * Get the full path to the theme directory
     */
    public function getFullPathAttribute(): string
    {
        return resource_path('themes/' . $this->directory_path);
    }

    /**
     * Get the theme.json configuration
     */
    public function getConfigAttribute(): ?array
    {
        $configPath = $this->full_path . '/theme.json';
        
        if (File::exists($configPath)) {
            return json_decode(File::get($configPath), true);
        }
        
        return null;
    }

    /**
     * Get a specific template path
     */
    public function getTemplatePath(string $template): ?string
    {
        $templates = $this->templates ?? [];

        // Prefer explicit mapping from theme.json stored in DB
        if (isset($templates[$template])) {
            $templateConfig = $templates[$template];
            
            // Handle React template configuration (array format)
            if (is_array($templateConfig)) {
                if ($this->template_engine === 'react' && isset($templateConfig['component'])) {
                    return $templateConfig['component']; // Return component name for React
                }
                if (isset($templateConfig['path'])) {
                    return $this->full_path . '/' . $templateConfig['path'];
                }
            }
            
            // Handle Blade template configuration (string format)
            if (is_string($templateConfig)) {
                return $this->full_path . '/' . $templateConfig;
            }
        }

        // Fallback: conventional location inside templates directory
        $conventional = $this->full_path . '/templates/' . $template . '.blade.php';
        if (\Illuminate\Support\Facades\File::exists($conventional)) {
            return $conventional;
        }

        return null;
    }

    /**
     * Get a specific partial path
     */
    public function getPartialPath(string $partial): ?string
    {
        $partials = $this->partials ?? [];

        // Prefer explicit mapping from theme.json stored in DB
        if (isset($partials[$partial])) {
            return $this->full_path . '/' . $partials[$partial];
        }

        // Fallback: conventional location inside partials directory
        $conventional = $this->full_path . '/partials/' . $partial . '.blade.php';
        if (\Illuminate\Support\Facades\File::exists($conventional)) {
            return $conventional;
        }

        return null;
    }

    /**
     * Get asset URL with security validation
     */
    public function getAssetUrl(string $type, ?string $asset = null): string|array|null
    {
        $assets = $this->assets ?? [];
        
        if ($asset && isset($assets[$type]) && is_array($assets[$type])) {
            if (in_array($asset, $assets[$type])) {
                // Prevent directory traversal
                $sanitizedAsset = $this->sanitizeAssetPath($asset);
                return asset('themes/' . $this->directory_path . '/' . $sanitizedAsset) . '?v=' . urlencode($this->version);
            }
        } elseif (isset($assets[$type])) {
            if (is_string($assets[$type])) {
                $sanitizedPath = $this->sanitizeAssetPath($assets[$type]);
                return asset('themes/' . $this->directory_path . '/' . $sanitizedPath) . '?v=' . urlencode($this->version);
            } elseif (is_array($assets[$type])) {
                return collect($assets[$type])->map(function ($assetPath) {
                    $sanitizedPath = $this->sanitizeAssetPath($assetPath);
                    return asset('themes/' . $this->directory_path . '/' . $sanitizedPath) . '?v=' . urlencode($this->version);
                })->toArray();
            }
        }
        
        return null;
    }

    /**
     * Sanitize asset path to prevent directory traversal
     */
    protected function sanitizeAssetPath(string $path): string
    {
        // Remove directory traversal attempts
        $path = str_replace(['../', '..\\', '../', '..\\'], '', $path);
        
        // Remove leading slashes
        $path = ltrim($path, '/\\');
        
        // Ensure path doesn't start with forbidden patterns
        $forbidden = ['/', '\\', 'http://', 'https://', 'file://', 'data:'];
        foreach ($forbidden as $pattern) {
            if (stripos($path, $pattern) === 0) {
                throw new \InvalidArgumentException('Invalid asset path: ' . $path);
            }
        }
        
        return $path;
    }

    /**
     * Check if theme supports a feature
     */
    public function supports(string $feature): bool
    {
        $supports = $this->supports ?? [];
        return isset($supports[$feature]) && $supports[$feature];
    }


    /**
     * Check if theme files exist
     */
    public function filesExist(): bool
    {
        return File::exists($this->full_path . '/theme.json');
    }
}
