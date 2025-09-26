<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Theme;
use App\Services\ThemeManager;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class ThemeController extends Controller
{
    protected ThemeManager $themeManager;

    public function __construct(ThemeManager $themeManager)
    {
        $this->themeManager = $themeManager;
        // Policies enforce authorization for theme actions
    }

    /**
     * Display a listing of themes
     */
    public function index()
    {
        $this->authorize('viewAny', \App\Models\Theme::class);
        $installedThemes = $this->themeManager->getInstalledThemes();
        $discoveredThemes = $this->themeManager->discoverThemes();
        $activeTheme = $this->themeManager->getActiveTheme();

        return Inertia::render('Dashboard', [
            'adminSection' => 'themes',
            'themes' => $installedThemes,
            'discoveredThemes' => $discoveredThemes,
            'activeTheme' => $activeTheme,
        ]);
    }

    /**
     * Install discovered themes
     */
    public function install(Request $request)
    {
        $this->authorize('install', \App\Models\Theme::class);
        $request->validate([
            'slug' => 'required|string',
        ]);

        $discoveredThemes = $this->themeManager->discoverThemes();
        $themeToInstall = $discoveredThemes->firstWhere('config.slug', $request->slug);

        if (!$themeToInstall) {
            return back()->withErrors(['theme' => 'Theme not found']);
        }

        try {
            $theme = $this->themeManager->installTheme($themeToInstall, Auth::id());
            $this->themeManager->publishAssets($theme);

            return back()->with('success', "Theme '{$theme->name}' installed successfully");
        } catch (\Exception $e) {
            return back()->withErrors(['theme' => 'Failed to install theme: ' . $e->getMessage()]);
        }
    }

    /**
     * Activate a theme
     */
    public function activate(Request $request, string $slug)
    {
        // Find the theme to authorize activation; fallback to manager if not installed yet
        $themeModel = \App\Models\Theme::where('slug', $slug)->first();
        if ($themeModel) {
            $this->authorize('activate', $themeModel);
        } else {
            // If not installed, require install/activate permissions via install gate
            $this->authorize('install', \App\Models\Theme::class);
        }
        try {
            $success = $this->themeManager->activateTheme($slug);

            if ($success) {
                // Redirect to themes index so Inertia refreshes props (themes, activeTheme)
                return redirect()->route('dashboard.admin.themes.index')->with('success', 'Theme activated successfully');
            } else {
                return redirect()->route('dashboard.admin.themes.index')->withErrors(['theme' => 'Failed to activate theme']);
            }
        } catch (\Exception $e) {
            return redirect()->route('dashboard.admin.themes.index')->withErrors(['theme' => 'Failed to activate theme: ' . $e->getMessage()]);
        }
    }

    /**
     * Display theme details
     */
    public function show(string $id)
    {
        $theme = Theme::findOrFail($id);
        $this->authorize('view', $theme);

        return Inertia::render('Dashboard', [
            'adminSection' => 'themes.show',
            'theme' => $theme,
            'themeConfig' => $theme->config,
            'themeAssets' => $this->themeManager->getAssets(),
        ]);
    }

    /**
     * Update theme settings
     */
    public function update(Request $request, string $id)
    {
        $theme = Theme::findOrFail($id);
        $this->authorize('update', $theme);

        $request->validate([
            'customizer' => 'sometimes|array',
        ]);

        try {
            $theme->update($request->only(['customizer']));

            return back()->with('success', 'Theme settings updated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['theme' => 'Failed to update theme: ' . $e->getMessage()]);
        }
    }

    /**
     * Uninstall a theme
     */
    public function destroy(string $id)
    {
        $theme = Theme::findOrFail($id);
        $this->authorize('delete', $theme);

        if ($theme->is_active) {
            return back()->withErrors(['theme' => 'Cannot uninstall active theme']);
        }

        try {
            $success = $this->themeManager->uninstallTheme($theme->slug);

            if ($success) {
                return back()->with('success', 'Theme uninstalled successfully');
            } else {
                return back()->withErrors(['theme' => 'Failed to uninstall theme']);
            }
        } catch (\Exception $e) {
            return back()->withErrors(['theme' => 'Failed to uninstall theme: ' . $e->getMessage()]);
        }
    }

    /**
     * Discover and install all themes
     */
    public function discoverAll()
    {
        $this->authorize('install', \App\Models\Theme::class);
        try {
            $installedThemes = $this->themeManager->installAllThemes(Auth::id());
            $this->themeManager->publishAllAssets();

            $count = $installedThemes->count();
            return back()->with('success', "Discovered and installed {$count} themes");
        } catch (\Exception $e) {
            return back()->withErrors(['theme' => 'Failed to discover themes: ' . $e->getMessage()]);
        }
    }

    /**
     * Publish theme assets
     */
    public function publishAssets(string $id)
    {
        $theme = Theme::findOrFail($id);
        $this->authorize('publishAssets', $theme);

        try {
            $success = $this->themeManager->publishAssets($theme);

            if ($success) {
                return back()->with('success', 'Theme assets published successfully');
            } else {
                return back()->withErrors(['theme' => 'Failed to publish theme assets']);
            }
        } catch (\Exception $e) {
            return back()->withErrors(['theme' => 'Failed to publish assets: ' . $e->getMessage()]);
        }
    }

    /**
     * Get theme customizer settings
     */
    public function customizer(string $id)
    {
        $theme = Theme::findOrFail($id);
        $this->authorize('customize', $theme);

        return Inertia::render('Dashboard', [
            'adminSection' => 'themes.customizer',
            'theme' => $theme,
            'customizerSettings' => $this->themeManager->getCustomizerSettings(),
            'availableMenus' => $this->themeManager->getAvailableMenus(),
            'widgetAreas' => $this->themeManager->getWidgetAreas(),
        ]);
    }
}
