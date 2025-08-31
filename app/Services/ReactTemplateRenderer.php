<?php

namespace App\Services;

use App\Models\Theme;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use App\Services\MenuService;

class ReactTemplateRenderer
{
    protected ThemeManager $themeManager;
    protected MenuService $menuService;

    public function __construct(ThemeManager $themeManager, MenuService $menuService)
    {
        $this->themeManager = $themeManager;
        $this->menuService = $menuService;
    }

    /**
     * Render a React template using Inertia.js
     */
    public function render(string $templateName, array $data = []): \Inertia\Response
    {
        $theme = $this->themeManager->getActiveTheme();
        
        if (!$theme || $theme->template_engine !== 'react') {
            throw new \Exception("Active theme is not a React theme");
        }

        $componentPath = $this->resolveComponentPath($theme, $templateName);
        
        if (!$componentPath) {
            throw new \Exception("React component not found for template: {$templateName}");
        }

        // Prepare theme data
        $themeData = $this->getThemeData($theme);
        
        // Merge with template data - ensure all data is properly structured
        $renderData = array_merge($data, [
            'theme' => $themeData,
            'site' => $this->getSiteData(),
            'menus' => $this->getMenuData(),
        ]);
        
        // Ensure posts data structure is correct for React components
        if (isset($renderData['posts']) && !isset($renderData['posts']['data'])) {
            $renderData['posts'] = ['data' => $renderData['posts']];
        }
        
        // Ensure pagination exists
        if (!isset($renderData['pagination'])) {
            $renderData['pagination'] = [
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 12,
                'total' => 0,
                'prev_page_url' => null,
                'next_page_url' => null,
            ];
        }

        return Inertia::render($componentPath, $renderData);
    }

    /**
     * Resolve the component path for a template
     */
    protected function resolveComponentPath(Theme $theme, string $templateName): ?string
    {
        $templates = $theme->templates ?? [];
        
        if (!isset($templates[$templateName])) {
            return null;
        }

        $templateConfig = $templates[$templateName];
        
        // Handle both old string format and new object format
        if (is_string($templateConfig)) {
            // Legacy blade template - not supported for React rendering
            return null;
        }

        if (is_array($templateConfig) && 
            isset($templateConfig['type']) && 
            $templateConfig['type'] === 'react' &&
            isset($templateConfig['component'])) {
            
            // Convert theme component path to Inertia component path
            // themes/modern-react/components/Layout.tsx -> Themes/ModernReact/Layout
            return $this->convertToInertiaPath($theme->slug, $templateConfig['component']);
        }

        return null;
    }

    /**
     * Convert theme component path to Inertia component path
     */
    protected function convertToInertiaPath(string $themeSlug, string $componentPath): string
    {
        // Remove components/ prefix and .tsx extension
        $componentPath = str_replace(['components/', '.tsx'], '', $componentPath);
        
        // Convert theme slug to PascalCase
        $themeName = str_replace(['-', '_'], ' ', $themeSlug);
        $themeName = str_replace(' ', '', ucwords($themeName));
        
        // Handle partials directory
        $componentPath = str_replace('partials/', 'partials/', $componentPath);
        
        // Build Inertia path: Themes/ModernReact/Layout
        return "Themes/{$themeName}/{$componentPath}";
    }

    /**
     * Prepare theme configuration data
     */
    protected function getThemeData(Theme $theme): array
    {
        $customizer = $theme->customizer ?? [];
        $themeData = [
            'name' => $theme->name ?? 'Unknown Theme',
            'slug' => $theme->slug ?? 'unknown',
            'version' => $theme->version ?? '1.0.0',
            'colors' => [
                'primary' => '#3b82f6',
                'secondary' => '#64748b',
            ],
            'typography' => [
                'font_family' => 'Inter, sans-serif',
            ],
            'layout' => [
                'container_width' => '1200px',
            ],
        ];

        // Process customizer settings into theme data
        foreach ($customizer as $section => $settings) {
            if (is_array($settings)) {
                $themeData[$section] = $themeData[$section] ?? [];
                foreach ($settings as $key => $config) {
                    $themeData[$section][$key] = $config['default'] ?? $themeData[$section][$key] ?? null;
                }
            }
        }

        return $themeData;
    }

    /**
     * Get site configuration data
     */
    protected function getSiteData(): array
    {
        return [
            'name' => config('app.name', 'Modulo CMS'),
            'tagline' => 'Modern Content Management System',
            'logo' => null, // TODO: Add site logo support
        ];
    }

    /**
     * Get menu data for the theme
     */
    protected function getMenuData(): array
    {
        $theme = $this->themeManager->getActiveTheme();
        $menus = [];

        if ($theme && isset($theme->menus)) {
            foreach ($theme->menus as $location => $label) {
                $menus[$location] = $this->getMenuItems($location);
            }
        }

        // Ensure we always return a valid structure
        return $menus ?: ['primary' => [], 'footer' => []];
    }

    /**
     * Get menu items for a specific location from database
     */
    protected function getMenuItems(string $location): array
    {
        try {
            $menuData = $this->menuService->menuArrayByLocation($location);
            return $menuData['items'] ?? [];
        } catch (\Throwable $e) {
            // Fallback to default menu items if database query fails
            return $this->getDefaultMenuItems($location);
        }
    }
    
    /**
     * Get default menu items as fallback
     */
    protected function getDefaultMenuItems(string $location): array
    {
        if ($location === 'primary') {
            return [
                [
                    'id' => 1,
                    'label' => 'Home',
                    'url' => '/',
                    'target' => '_self',
                    'children' => []
                ],
                [
                    'id' => 2,
                    'label' => 'Posts',
                    'url' => '/posts',
                    'target' => '_self',
                    'children' => []
                ],
                [
                    'id' => 3,
                    'label' => 'News',
                    'url' => '/news',
                    'target' => '_self',
                    'children' => []
                ],
                [
                    'id' => 4,
                    'label' => 'About',
                    'url' => '/about',
                    'target' => '_self',
                    'children' => []
                ]
            ];
        }
        
        if ($location === 'footer') {
            return [
                [
                    'id' => 5,
                    'label' => 'Privacy Policy',
                    'url' => '/privacy',
                    'target' => '_self',
                    'children' => []
                ],
                [
                    'id' => 6,
                    'label' => 'Terms of Service',
                    'url' => '/terms',
                    'target' => '_self',
                    'children' => []
                ]
            ];
        }
        
        return [];
    }

    /**
     * Check if a React template can be rendered
     */
    public function canRender(string $templateName): bool
    {
        $theme = $this->themeManager->getActiveTheme();
        
        if (!$theme || $theme->template_engine !== 'react') {
            return false;
        }

        return $this->resolveComponentPath($theme, $templateName) !== null;
    }

    /**
     * Check if the active theme is a React theme
     */
    public function isReactTheme(): bool
    {
        $theme = $this->themeManager->getActiveTheme();
        return $theme && $theme->template_engine === 'react';
    }

    /**
     * Get available React templates for the active theme
     */
    public function getAvailableTemplates(): array
    {
        $theme = $this->themeManager->getActiveTheme();
        
        if (!$theme || $theme->template_engine !== 'react') {
            return [];
        }

        $templates = [];
        foreach ($theme->templates ?? [] as $name => $config) {
            if (is_array($config) && 
                isset($config['type']) && 
                $config['type'] === 'react') {
                $templates[] = $name;
            }
        }

        return $templates;
    }
}
