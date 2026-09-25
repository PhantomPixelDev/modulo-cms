<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Http\Requests\InstallThemeRequest;
use App\Http\Requests\UpdateThemeRequest;
use App\Models\Theme;
use App\Services\Plugins\PluginRegistry;
use App\Services\Plugins\PluginRequirements;
use App\Services\ThemeInstaller;
use App\Services\ThemeManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Throwable;

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
        $this->authorize('viewAny', Theme::class);
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
    public function install(InstallThemeRequest $request)
    {
        $this->authorize('install', Theme::class);

        $discoveredThemes = $this->themeManager->discoverThemes();
        $themeToInstall = $discoveredThemes->firstWhere('config.slug', $request->validated('slug'));

        if (! $themeToInstall) {
            return back()->withErrors(['theme' => 'Theme not found']);
        }

        try {
            $theme = $this->themeManager->installTheme($themeToInstall, Auth::id());
            $this->themeManager->publishAssets($theme);

            return back()->with('success', "Theme '{$theme->name}' installed successfully");
        } catch (\Exception $e) {
            return back()->withErrors(['theme' => 'Failed to install theme: '.$e->getMessage()]);
        }
    }

    /**
     * Themes in the registry, for the Browse section. JSON, fetched by the
     * page, so the themes screen never waits on the network.
     */
    public function registry(PluginRegistry $registry, PluginRequirements $requirements): JsonResponse
    {
        $this->authorize('viewAny', Theme::class);

        try {
            $entries = $registry->themes(force: request()->boolean('refresh'));
        } catch (Throwable $e) {
            return response()->json(['themes' => [], 'error' => $e->getMessage()]);
        }

        $installed = Theme::pluck('version', 'slug');

        return response()->json([
            'error' => null,
            'themes' => collect($entries)->map(function (array $entry) use ($installed, $requirements) {
                $latest = is_array($entry['latest'] ?? null) ? $entry['latest'] : [];
                $parent = is_string($entry['parent'] ?? null) ? $entry['parent'] : null;
                $unmet = $requirements->unmet($latest, needActive: false);

                if ($parent !== null && ! Theme::where('slug', $parent)->where('is_installed', true)->exists()) {
                    $unmet[] = "the {$parent} theme";
                }

                return [
                    'slug' => $entry['slug'],
                    'name' => (string) ($entry['name'] ?? $entry['slug']),
                    'description' => is_string($entry['description'] ?? null) ? $entry['description'] : null,
                    'author' => is_string($entry['author'] ?? null) ? $entry['author'] : null,
                    'screenshot' => is_string($entry['screenshot'] ?? null) && str_starts_with($entry['screenshot'], 'https://') ? $entry['screenshot'] : null,
                    'parent' => $parent,
                    'version' => (string) ($latest['version'] ?? ''),
                    'installed_version' => $installed[$entry['slug']] ?? null,
                    'unmet' => $unmet,
                ];
            })->values(),
        ]);
    }

    /**
     * Install (or update) a child theme from the registry.
     */
    public function installFromRegistry(Request $request, ThemeInstaller $installer): RedirectResponse
    {
        $this->authorize('install', Theme::class);

        $slug = (string) $request->validate(['slug' => ['required', 'string', 'regex:/^[a-z0-9-]+$/']])['slug'];

        try {
            $result = $installer->install($slug);
        } catch (Throwable $e) {
            return back()->with('error', 'Could not install "'.$slug.'": '.$e->getMessage());
        }

        return back()->with('success', sprintf('Theme "%s" %s %s.', $slug, $result['version'], $result['updated'] ? 'updated' : 'installed'));
    }

    /**
     * Activate a theme
     */
    public function activate(string $slug)
    {
        // Find the theme to authorize activation; fallback to manager if not installed yet
        $themeModel = Theme::where('slug', $slug)->first();
        if ($themeModel) {
            $this->authorize('activate', $themeModel);
        } else {
            // If not installed, require install/activate permissions via install gate
            $this->authorize('install', Theme::class);
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
            return redirect()->route('dashboard.admin.themes.index')->withErrors(['theme' => 'Failed to activate theme: '.$e->getMessage()]);
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
    public function update(UpdateThemeRequest $request, string $id)
    {
        $theme = Theme::findOrFail($id);
        $this->authorize('update', $theme);

        try {
            $theme->update($request->validated());

            return back()->with('success', 'Theme settings updated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['theme' => 'Failed to update theme: '.$e->getMessage()]);
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

        if (Theme::where('parent_theme_id', $theme->id)->exists()) {
            return back()->with('error', "Other installed themes build on '{$theme->name}'; uninstall them first.");
        }

        try {
            $success = $this->themeManager->uninstallTheme($theme->slug);

            if ($success) {
                return back()->with('success', 'Theme uninstalled successfully');
            } else {
                return back()->withErrors(['theme' => 'Failed to uninstall theme']);
            }
        } catch (\Exception $e) {
            return back()->withErrors(['theme' => 'Failed to uninstall theme: '.$e->getMessage()]);
        }
    }

    /**
     * Discover themes (alias for discoverAll for route compatibility)
     */
    public function discover()
    {
        $this->authorize('install', Theme::class);
        try {
            $installedThemes = $this->themeManager->installAllThemes(Auth::id());
            $this->themeManager->publishAllAssets();

            $count = $installedThemes->count();

            return back()->with('success', "Discovered and installed {$count} themes");
        } catch (\Exception $e) {
            return back()->withErrors(['theme' => 'Failed to discover themes: '.$e->getMessage()]);
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
            return back()->withErrors(['theme' => 'Failed to publish assets: '.$e->getMessage()]);
        }
    }

    /**
     * Clear theme caches (active theme + installed themes list)
     */
    public function clearCache()
    {
        $this->authorize('viewAny', Theme::class);
        $this->themeManager->clearCache();

        return back()->with('success', 'Theme cache cleared');
    }
}
