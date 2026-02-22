<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdatePluginSettingsRequest;
use App\Models\Plugin;
use App\Services\PluginManager;
use Inertia\Inertia;

class PluginController extends Controller
{
    protected PluginManager $pluginManager;

    public function __construct(PluginManager $pluginManager)
    {
        $this->pluginManager = $pluginManager;
    }

    /**
     * Display a listing of the plugins.
     */
    public function index()
    {
        $this->authorizePermission('view plugins');

        return Inertia::render('Dashboard', [
            'adminSection' => 'plugins',
            'plugins' => Plugin::orderBy('name')->get(),
        ]);
    }

    /**
     * Sync filesystem plugins into DB (explicit action, not on every page load).
     */
    public function discover()
    {
        $this->authorizePermission('install plugins');

        $this->pluginManager->discover();

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
        ]);
    }

    /**
     * Update the specified plugin settings.
     */
    public function updateSettings(UpdatePluginSettingsRequest $request, string $slug)
    {
        $this->authorizePermission('install plugins');

        if ($this->pluginManager->updateSettings($slug, $request->validated('settings'))) {
            return back()->with('success', 'Plugin settings updated successfully.');
        }

        return back()->with('error', $this->pluginManager->getLastError() ?? 'Failed to update plugin settings.');
    }

    /**
     * Uninstall the specified plugin.
     */
    public function destroy(string $slug)
    {
        $this->authorizePermission('delete plugins');

        if ($this->pluginManager->uninstall($slug)) {
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
