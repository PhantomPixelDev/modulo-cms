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
        'version',
        'description',
        'author',
        'author_url',
        'screenshot',
        'tags',
        'supports',
        'templates',
        'partials',
        'assets',
        'customizer',
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
        'customizer' => 'array',
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
            return $this->full_path . '/' . $templates[$template];
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
     * Get asset URL
     */
    public function getAssetUrl(string $type, string $asset = null): string|array|null
    {
        $assets = $this->assets ?? [];
        
        if ($asset && isset($assets[$type]) && is_array($assets[$type])) {
            if (in_array($asset, $assets[$type])) {
                return asset('themes/' . $this->directory_path . '/' . $asset);
            }
        } elseif (isset($assets[$type])) {
            if (is_string($assets[$type])) {
                return asset('themes/' . $this->directory_path . '/' . $assets[$type]);
            } elseif (is_array($assets[$type])) {
                return collect($assets[$type])->map(function ($assetPath) {
                    return asset('themes/' . $this->directory_path . '/' . $assetPath);
                })->toArray();
            }
        }
        
        return null;
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
     * Get customizer setting
     */
    public function getCustomizerSetting(string $section, string $setting = null)
    {
        $customizer = $this->customizer ?? [];
        
        if ($setting) {
            return $customizer[$section][$setting] ?? null;
        }
        
        return $customizer[$section] ?? null;
    }

    /**
     * Activate this theme (deactivates others)
     */
    public function activate(): bool
    {
        // Deactivate all other themes
        static::where('id', '!=', $this->id)->update(['is_active' => false]);
        
        // Activate this theme
        return $this->update(['is_active' => true]);
    }

    /**
     * Check if theme files exist
     */
    public function filesExist(): bool
    {
        return File::exists($this->full_path . '/theme.json');
    }
}
