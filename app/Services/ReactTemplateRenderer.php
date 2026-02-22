<?php

namespace App\Services;

use App\Models\Theme;
use App\Http\Resources\ThemeResource;
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

        // Prepare theme data using the standardized resource
        $themeData = (new ThemeResource($theme))->toArray(request());
        $themeTranslations = $this->themeManager->getTranslations($theme, app()->getLocale());
        
        // Merge with template data - ensure all data is properly structured
        $siteData = $this->getSiteData();
        $menuData = $this->getMenuData();

        if (config('theme.debug')) {
            \Log::debug('ReactRenderer:dataPrep', [
                'siteDataKeys' => array_keys($siteData),
                'menuDataKeys' => array_keys($menuData),
                'inputDataKeys' => array_keys($data),
                'menuData' => $menuData,
            ]);
        }
        
        $renderData = array_merge($data, [
            'theme' => $themeData,
            'site' => $siteData,
            'menus' => $menuData,
            'themeTranslations' => $themeTranslations,
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
            // Fallback: try to find a component based on template name
            $componentName = ucfirst($templateName);
            return $this->convertToInertiaPath($theme->slug, "components/{$componentName}");
        }

        $templateConfig = $templates[$templateName];
        
        // Handle both old string format and new object format
        if (is_string($templateConfig)) {
            // For React themes, convert string template names to component paths automatically
            // e.g., "posts" -> "components/Posts", "home" -> "components/Home"
            $componentName = ucfirst($templateName);
            return $this->convertToInertiaPath($theme->slug, "components/{$componentName}");
        }

        if (is_array($templateConfig) && isset($templateConfig['component'])) {
            // theme.json commonly stores templates as { "component": "components/Index.tsx" }
            // Convert theme component path to Inertia component path
            // components/Layout.tsx -> Themes/ModernReact/Layout
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
     * Get site configuration data
     */
    protected function getSiteData(): array
    {
        return [
            'name' => \App\Models\SiteSetting::get('site_name', config('app.name', 'Modulo CMS')),
            'tagline' => \App\Models\SiteSetting::get('site_tagline', 'Modern Content Management System'),
            'logo' => $this->resolveSiteLogo(),
        ];
    }

    /**
     * Resolve site logo URL from common setting keys.
     */
    protected function resolveSiteLogo(): ?string
    {
        foreach (['site_logo', 'site_logo_url', 'general.site_logo'] as $key) {
            $value = \App\Models\SiteSetting::get($key);
            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }

    /**
     * Get menu data for the theme
     */
    protected function getMenuData(): array
    {
        try {
            $menus = [
                'header' => $this->menuService->menuArrayBySlug('main-navigation')
                    ?: $this->menuService->menuArrayByLocation('header'),
                'footer' => $this->menuService->menuArrayBySlug('footer-links')
                    ?: $this->menuService->menuArrayByLocation('footer'),
            ];

            $theme = $this->themeManager->getActiveTheme();
            if ($theme && is_array($theme->menus ?? null)) {
                foreach (array_keys($theme->menus) as $location) {
                    if (isset($menus[$location])) {
                        continue;
                    }

                    $menus[$location] = $this->menuService->menuArrayByLocation($location) ?: [];
                }
            }

            return $menus;
        } catch (\Throwable $e) {
            return [
                'header' => [],
                'footer' => [],
            ];
        }
    }

    /**
     * Check if a React template can be rendered
     * Only returns true if the template is explicitly registered in theme.json
     */
    public function canRender(string $templateName): bool
    {
        $theme = $this->themeManager->getActiveTheme();
        
        if (!$theme || $theme->template_engine !== 'react') {
            return false;
        }

        $templates = $theme->templates ?? [];
        
        // Only return true if the template is explicitly defined in theme.json
        return isset($templates[$templateName]);
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
            // Accept both legacy {type: 'react', component: ...} and current {component: ...}
            if (is_array($config) && isset($config['component'])) {
                $templates[] = $name;
            }
        }

        return $templates;
    }
}
