<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePluginSettingsRequest;
use App\Models\Plugin;
use App\Services\PluginManager;
use App\Services\Plugins\PluginInstaller;
use App\Services\Plugins\PluginRegistry;
use App\Services\Plugins\PluginRequirements;
use App\Services\Plugins\PluginSettingsSchema;
use App\Services\UpdateCenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Throwable;

class PluginController extends Controller
{
    protected PluginManager $pluginManager;

    public function __construct(PluginManager $pluginManager, protected PluginSettingsSchema $schema)
    {
        $this->pluginManager = $pluginManager;
    }

    /**
     * Display a listing of the plugins.
     */
    public function index()
    {
        $this->authorizePermission('view plugins');

        $requirements = app(PluginRequirements::class);

        return Inertia::render('Dashboard', [
            'adminSection' => 'plugins',
            'plugins' => Plugin::orderBy('name')->get()->map(fn (Plugin $plugin) => $plugin->toArray() + [
                // What stops an inactive plugin from being switched on.
                'unmet' => $plugin->is_active ? [] : $requirements->unmet([
                    'requires' => $plugin->requires,
                    'min_core_version' => $plugin->min_core_version,
                ]),
                'dependents' => $plugin->is_active ? $requirements->dependents($plugin->slug) : [],
            ]),
        ]);
    }

    /**
     * The registry's plugins, for the Browse tab. JSON so the page itself
     * never waits on the network.
     */
    public function registry(PluginRegistry $registry, PluginRequirements $requirements): JsonResponse
    {
        $this->authorizePermission('view plugins');

        try {
            $entries = $registry->all(force: request()->boolean('refresh'));
        } catch (Throwable $e) {
            return response()->json(['plugins' => [], 'error' => $e->getMessage()]);
        }

        $installed = Plugin::pluck('version', 'slug');

        return response()->json([
            'error' => null,
            'plugins' => collect($entries)->map(function (array $entry) use ($installed, $requirements) {
                $latest = is_array($entry['latest'] ?? null) ? $entry['latest'] : [];

                return [
                    'slug' => $entry['slug'],
                    'name' => (string) ($entry['name'] ?? $entry['slug']),
                    'description' => is_string($entry['description'] ?? null) ? $entry['description'] : null,
                    'author' => is_string($entry['author'] ?? null) ? $entry['author'] : null,
                    'homepage' => is_string($entry['homepage'] ?? null) && str_starts_with($entry['homepage'], 'https://') ? $entry['homepage'] : null,
                    'version' => (string) ($latest['version'] ?? ''),
                    'installed_version' => $installed[$entry['slug']] ?? null,
                    'unmet' => $requirements->unmet($latest, needActive: false),
                ];
            })->values(),
        ]);
    }

    /**
     * Install (or update) a plugin from the registry. It arrives inactive.
     */
    public function install(Request $request, PluginInstaller $installer): RedirectResponse
    {
        $this->authorizePermission('install plugins');

        $slug = (string) $request->validate(['slug' => ['required', 'string', 'regex:/^[a-z0-9-]+$/']])['slug'];

        try {
            $result = $installer->install($slug);
        } catch (Throwable $e) {
            return back()->with('error', 'Could not install "'.$slug.'": '.$e->getMessage());
        }

        app(UpdateCenter::class)->forgetPending();

        return back()->with('success', sprintf(
            '%s %s %s. %s',
            Plugin::where('slug', $slug)->value('name') ?? $slug,
            $result['version'],
            $result['updated'] ? 'updated' : 'installed',
            $result['updated'] ? '' : 'Activate it to start using it.',
        ));
    }

    /**
     * Sync filesystem plugins into DB (explicit action, not on every page load).
     */
    public function discover()
    {
        $this->authorizePermission('install plugins');

        // Also brings back plugins that were uninstalled earlier
        $this->pluginManager->rediscover();

        return back()->with('success', 'Plugins synced from filesystem.');
    }

    /**
     * Activate the specified plugin.
     */
    public function activate(string $slug)
    {
        $this->authorizePermission('activate plugins');

        if ($this->pluginManager->activate($slug)) {
            return back()->with('success', 'Plugin activated successfully.');
        }

        return back()->with('error', $this->pluginManager->getLastError() ?? 'Failed to activate plugin.');
    }

    /**
     * Deactivate the specified plugin.
     */
    public function deactivate(string $slug)
    {
        $this->authorizePermission('deactivate plugins');

        if ($this->pluginManager->deactivate($slug)) {
            return back()->with('success', 'Plugin deactivated successfully.');
        }

        return back()->with('error', $this->pluginManager->getLastError() ?? 'Failed to deactivate plugin.');
    }

    /**
     * Show the specified plugin settings.
     */
    public function settings(string $slug)
    {
        $this->authorizePermission('view plugins');

        $plugin = Plugin::where('slug', $slug)->firstOrFail();

        return Inertia::render('Dashboard', [
            'adminSection' => 'plugin-settings',
            'plugin' => $plugin,
            // A form described by the plugin; empty means the plain key/value editor
            'settingsSchema' => $this->schema->fields($slug),
        ]);
    }

    /**
     * Update the specified plugin settings.
     */
    public function updateSettings(UpdatePluginSettingsRequest $request, string $slug)
    {
        $this->authorizePermission('install plugins');
        $request->validate($this->schema->rules($slug), [], $this->schema->attributes($slug));

        if ($this->pluginManager->updateSettings($slug, (array) $request->input('settings'))) {
            return back()->with('success', __('dashboard.plugins.settings.messages.updated'));
        }

        return back()->with('error', $this->pluginManager->getLastError() ?? 'Failed to update plugin settings.');
    }

    /**
     * Uninstall the specified plugin.
     */
    public function destroy(Request $request, string $slug)
    {
        $this->authorizePermission('delete plugins');

        if ($this->pluginManager->uninstall($slug, deleteData: $request->boolean('delete_data'))) {
            return redirect()->route('dashboard.admin.plugins.index')
                ->with('success', 'Plugin uninstalled successfully.');
        }

        return back()->with('error', $this->pluginManager->getLastError() ?? 'Failed to uninstall plugin.');
    }

    protected function authorizePermission(string $permission): void
    {
        $user = auth()->user();

        abort_unless(
            $user && ($user->can($permission) || $user->hasRole(['admin', 'super-admin'])),
            403
        );
    }
}
