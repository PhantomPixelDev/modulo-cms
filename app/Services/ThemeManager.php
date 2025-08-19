<?php

namespace App\Services;

use App\Models\Theme;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class ThemeManager
{
    protected string $themesPath;
    protected ?Theme $activeTheme = null;

    public function __construct()
    {
        $this->themesPath = resource_path('themes');
    }

    /**
     * Get the currently active theme
     */
    public function getActiveTheme(): ?Theme
    {
        if ($this->activeTheme === null) {
            // Avoid querying when migrations haven't run (e.g., in simple tests)
            if (! Schema::hasTable('themes')) {
                return null;
            }

            $this->activeTheme = Cache::remember('active_theme', 3600, function () {
                return Theme::active()->first();
            });
        }

        return $this->activeTheme;
    }

    /**
     * Scan themes directory and discover new themes
     */
    public function discoverThemes(): Collection
    {
        $discovered = collect();
        
        if (!File::exists($this->themesPath)) {
            File::makeDirectory($this->themesPath, 0755, true);
            return $discovered;
        }

        $directories = File::directories($this->themesPath);

        foreach ($directories as $directory) {
            $themeJsonPath = $directory . '/theme.json';
            
            if (File::exists($themeJsonPath)) {
                try {
                    $config = json_decode(File::get($themeJsonPath), true);
                    
                    if ($config && isset($config['slug'])) {
                        $discovered->push([
                            'directory' => basename($directory),
                            'config' => $config,
                            'path' => $directory
                        ]);
                    }
                } catch (\Exception $e) {
                    // Skip invalid theme.json files
                    continue;
                }
            }
        }

        return $discovered;
    }

    /**
     * Install a theme from discovery
     */
    public function installTheme(array $themeData, int $userId = null): Theme
    {
        $config = $themeData['config'];
        
        $theme = Theme::updateOrCreate(
            ['slug' => $config['slug']],
            [
                'name' => $config['name'],
                'version' => $config['version'] ?? '1.0.0',
                'description' => $config['description'] ?? null,
                'author' => $config['author'] ?? null,
                'author_url' => $config['author_url'] ?? null,
                'screenshot' => $config['screenshot'] ?? null,
                'tags' => $config['tags'] ?? [],
                'supports' => $config['supports'] ?? [],
                'templates' => $config['templates'] ?? [],
                'partials' => $config['partials'] ?? [],
                'assets' => $config['assets'] ?? [],
                'customizer' => $config['customizer'] ?? [],
                'menus' => $config['menus'] ?? [],
                'widget_areas' => $config['widget_areas'] ?? [],
                'directory_path' => $themeData['directory'],
                'is_installed' => true,
                'installed_at' => now(),
                'installed_by' => $userId,
            ]
        );

        // Clear cache
        Cache::forget('active_theme');
        Cache::forget('installed_themes');

        return $theme;
    }

    /**
     * Install all discovered themes
     */
    public function installAllThemes(int $userId = null): Collection
    {
        $discovered = $this->discoverThemes();
        $installed = collect();

        foreach ($discovered as $themeData) {
            try {
                $theme = $this->installTheme($themeData, $userId);
                $installed->push($theme);
            } catch (\Exception $e) {
                // Log error but continue with other themes
                \Log::error("Failed to install theme {$themeData['config']['slug']}: " . $e->getMessage());
            }
        }

        return $installed;
    }

    /**
     * Activate a theme
     */
    public function activateTheme(string $slug): bool
    {
        $theme = Theme::where('slug', $slug)->where('is_installed', true)->first();
        
        if (!$theme || !$theme->filesExist()) {
            return false;
        }

        $activated = $theme->activate();
        
        if ($activated) {
            // Reset in-memory and cached theme state so UI reflects immediately
            $this->activeTheme = null;
            Cache::forget('active_theme');
            Cache::forget('installed_themes');
        }

        return $activated;
    }

    /**
     * Get template content for rendering
     */
    public function getTemplate(string $template): ?string
    {
        $activeTheme = $this->getActiveTheme();
        
        if (!$activeTheme) {
            return null;
        }

        $templatePath = $activeTheme->getTemplatePath($template);
        
        if ($templatePath && File::exists($templatePath)) {
            return File::get($templatePath);
        }

        return null;
    }

    /**
     * Get partial content for rendering
     */
    public function getPartial(string $partial): ?string
    {
        $activeTheme = $this->getActiveTheme();
        
        if (!$activeTheme) {
            return null;
        }

        $partialPath = $activeTheme->getPartialPath($partial);
        
        if ($partialPath && File::exists($partialPath)) {
            return File::get($partialPath);
        }

        return null;
    }

    /**
     * Get theme assets for inclusion in HTML
     */
    public function getAssets(): array
    {
        $activeTheme = $this->getActiveTheme();
        
        if (!$activeTheme) {
            return ['css' => [], 'js' => []];
        }

        $assets = $activeTheme->assets ?? [];
        
        return [
            'css' => $activeTheme->getAssetUrl('css') ?? [],
            'js' => $activeTheme->getAssetUrl('js') ?? [],
            'images' => $assets['images'] ?? []
        ];
    }

    /**
     * Render template with data using Blade engine when possible
     */
    public function renderTemplate(string $template, array $data = []): ?string
    {
        $activeTheme = $this->getActiveTheme();

        // Prefer physical blade file defined in theme.json -> templates for active theme
        if ($activeTheme) {
            $templatePath = $activeTheme->getTemplatePath($template);
            if ($templatePath && File::exists($templatePath)) {
                try {
                    \Log::info('ThemeManager:renderTemplate:activePath', ['template' => $template, 'path' => $templatePath]);
                    return \View::file($templatePath, $data)->render();
                } catch (\Throwable $e) {
                    \Log::error("ThemeManager renderTemplate error for '{$template}' (active theme): " . $e->getMessage());
                }
            }
        }

        // Filesystem fallback: use default theme blade file if present, regardless of DB state
        $defaultPath = resource_path('themes/default/templates/' . $template . '.blade.php');
        if (File::exists($defaultPath)) {
            try {
                \Log::info('ThemeManager:renderTemplate:defaultPath', ['template' => $template, 'path' => $defaultPath]);
                return \View::file($defaultPath, $data)->render();
            } catch (\Throwable $e) {
                \Log::error("ThemeManager renderTemplate error for '{$template}' (default fs fallback): " . $e->getMessage());
            }
        }

        // Last resort: return raw file contents from active theme mapping (no Blade processing)
        if ($activeTheme) {
            $raw = $this->getTemplate($template);
            if ($raw !== null) return $raw;
        }

        return null;
    }

    /**
     * Get theme customizer settings
     */
    public function getCustomizerSettings(): array
    {
        $activeTheme = $this->getActiveTheme();
        
        if (!$activeTheme || !$activeTheme->config) {
            return [];
        }
        
        return $activeTheme->config['customizer'] ?? [];
    }

    /**
     * Get template file path for active theme
     */
    public function getTemplatePath(string $template): string
    {
        $activeTheme = $this->getActiveTheme();
        
        if (!$activeTheme) {
            return '';
        }
        
        $templateFile = $template . '.blade.php';
        return $activeTheme->directory_path . '/templates/' . $templateFile;
    }

    /**
     * Get asset URL for active theme
     */
    public function getAssetUrl(string $asset): string
    {
        $activeTheme = $this->getActiveTheme();
        
        if (!$activeTheme) {
            return '';
        }
        
        return '/themes/' . $activeTheme->slug . '/assets/' . $asset;
    }

    /**
     * Get available menus for theme
     */
    public function getAvailableMenus(): array
    {
        $activeTheme = $this->getActiveTheme();
        
        if (!$activeTheme || !$activeTheme->config) {
            return [];
        }
        
        return $activeTheme->config['menus'] ?? [];
    }

    /**
     * Get available widget areas for the active theme
     */
    public function getWidgetAreas(): array
    {
        $activeTheme = $this->getActiveTheme();
        
        if (!$activeTheme) {
            return [];
        }

        return $activeTheme->widget_areas ?? [];
    }

    /**
     * Check if active theme supports a feature
     */
    public function supports(string $feature): bool
    {
        $activeTheme = $this->getActiveTheme();
        
        if (!$activeTheme) {
            return false;
        }

        return $activeTheme->supports($feature);
    }

    /**
     * Copy theme assets to public directory
     */
    public function publishAssets(Theme $theme): bool
    {
        // Source is inside resources/themes/<directory>/assets
        $sourcePath = resource_path('themes/' . $theme->directory_path . '/assets');
        // Target must match URLs generated by Theme model (uses directory_path)
        $targetPath = public_path('themes/' . $theme->directory_path . '/assets');

        if (!File::exists($sourcePath)) {
            return true; // No assets to publish
        }

        try {
            // Ensure target directory exists
            $targetDir = dirname($targetPath);
            if (!File::exists($targetDir)) {
                File::makeDirectory($targetDir, 0755, true);
            }

            if (File::exists($targetPath)) {
                File::deleteDirectory($targetPath);
            }

            File::copyDirectory($sourcePath, $targetPath);
            return true;
        } catch (\Exception $e) {
            \Log::error("Failed to publish assets for theme {$theme->slug}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Publish assets for all installed themes
     */
    public function publishAllAssets(): bool
    {
        $themes = Theme::installed()->get();
        $success = true;

        foreach ($themes as $theme) {
            if (!$this->publishAssets($theme)) {
                $success = false;
            }
        }

        return $success;
    }

    /**
     * Get all installed themes
     */
    public function getInstalledThemes(): Collection
    {
        return Cache::remember('installed_themes', 3600, function () {
            return Theme::installed()->orderBy('name')->get();
        });
    }

    /**
     * Uninstall a theme
     */
    public function uninstallTheme(string $slug): bool
    {
        $theme = Theme::where('slug', $slug)->first();
        
        if (!$theme) {
            return false;
        }

        // Cannot uninstall active theme
        if ($theme->is_active) {
            return false;
        }

        // Remove published assets
        $assetsPath = public_path('themes/' . $theme->directory_path);
        if (File::exists($assetsPath)) {
            File::deleteDirectory($assetsPath);
        }

        // Delete theme record
        $theme->delete();

        // Clear cache
        Cache::forget('installed_themes');

        return true;
    }
}
