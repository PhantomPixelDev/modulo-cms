<?php

namespace App\Services;

use App\Http\Resources\ThemeResource;
use App\Models\SiteSetting;
use App\Models\Theme;
use Inertia\Inertia;
use Inertia\Response;

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
    public function render(string $templateName, array $data = []): Response
    {
        $theme = $this->themeManager->getActiveTheme();

        if (! $theme || $theme->template_engine !== 'react') {
            throw new \Exception('Active theme is not a React theme');
        }

        $componentPath = $this->resolveComponentPath($theme, $templateName);

        if (! $componentPath) {
            throw new \Exception("React component not found for template: {$templateName}");
        }

        // Prepare theme data using the standardized resource
        $themeData = (new ThemeResource($theme))->toArray(request());
        // Stylesheets and colours from theme.json; a child theme's win over its parent's.
        $themeData['styles'] = $this->themeManager->stylesheetUrls($theme);
        $themeData['colors'] = $this->themeColors($theme);

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
            // Strings from the theme's lang/{locale}.json, read on the client as t('theme.*')
            'themeTranslations' => $this->themeManager->getTranslations($theme),
        ]);

        // Ensure posts data structure is correct for React components
        if (isset($renderData['posts']) && ! isset($renderData['posts']['data'])) {
            $renderData['posts'] = ['data' => $renderData['posts']];
        }

        // Ensure pagination exists
        if (! isset($renderData['pagination'])) {
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
     * Resolve the component path for a template.
     *
     * A child theme renders with its own component when it ships one and
     * falls back to its parent's (and so on up) when it does not.
     */
    protected function resolveComponentPath(Theme $theme, string $templateName): ?string
    {
        $componentFile = $this->componentFileFor($theme, $templateName);

        if ($componentFile === null) {
            return null;
        }

        $owner = $this->themeManager->componentThemeFor($theme, $componentFile);

        return $this->convertToInertiaPath($owner->slug, $componentFile);
    }

    /**
     * The component file for a template, from the nearest theme in the
     * parent chain that configures it; by convention otherwise
     * ("posts" -> components/Posts.tsx).
     */
    protected function componentFileFor(Theme $theme, string $templateName): ?string
    {
        $seen = [];

        for ($current = $theme; $current !== null && ! in_array($current->id, $seen, true); $current = $current->parent) {
            $seen[] = $current->id;
            $templateConfig = ($current->templates ?? [])[$templateName] ?? null;

            if ($templateConfig === null) {
                continue;
            }

            if (is_array($templateConfig)) {
                // theme.json commonly stores { "component": "components/Index.tsx" }
                return isset($templateConfig['component']) && is_string($templateConfig['component']) ? $templateConfig['component'] : null;
            }

            break;
        }

        return 'components/'.ucfirst($templateName).'.tsx';
    }

    /**
     * @return array<string, string>
     */
    protected function themeColors(Theme $theme): array
    {
        $colors = [];
        $seen = [];

        for ($current = $theme; $current !== null && ! in_array($current->id, $seen, true); $current = $current->parent) {
            $seen[] = $current->id;
            $own = $current->config['colors'] ?? [];

            if (is_array($own)) {
                $colors += array_filter($own, fn ($value, $key) => is_string($key) && is_string($value), ARRAY_FILTER_USE_BOTH);
            }
        }

        return $colors;
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
            'name' => SiteSetting::get('site_name', config('app.name', 'Modulo CMS')),
            'tagline' => SiteSetting::get('site_tagline', 'Modern Content Management System'),
            'logo' => null, // TODO: Add site logo support
        ];
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
     * Get menu items for a specific location from database
     */
    protected function getMenuItems(string $location): array
    {
        try {
            return $this->menuService->menuArrayByLocation($location) ?: [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Check if a React template can be rendered
     * Only returns true if the template is explicitly registered in theme.json
     */
    public function canRender(string $templateName): bool
    {
        $theme = $this->themeManager->getActiveTheme();

        if (! $theme || $theme->template_engine !== 'react') {
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

        if (! $theme || $theme->template_engine !== 'react') {
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
