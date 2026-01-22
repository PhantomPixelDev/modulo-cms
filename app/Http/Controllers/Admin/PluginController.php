<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PluginManager;
use Illuminate\Http\Request;
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
        $this->authorizeView();
        $this->pluginManager->discover();
        
        return Inertia::render('dashboard/DashboardContent', [
            'adminSection' => 'plugins',
            'plugins' => \App\Models\Plugin::all(),
        ]);
    }

    /**
     * Activate the specified plugin.
     */
    public function activate(string $slug)
    {
        $this->authorizeActivate();
        if ($this->pluginManager->activate($slug)) {
            return back()->with('success', 'Plugin activated successfully.');
        }

        return back()->with('error', 'Failed to activate plugin.');
    }

    /**
     * Deactivate the specified plugin.
     */
    public function deactivate(string $slug)
    {
        $this->authorizeDeactivate();
        if ($this->pluginManager->deactivate($slug)) {
            return back()->with('success', 'Plugin deactivated successfully.');
        }

        return back()->with('error', 'Failed to deactivate plugin.');
    }

    /**
     * Show the specified plugin settings.
     */
    public function settings(string $slug)
    {
        $this->authorizeView();
        $plugin = \App\Models\Plugin::where('slug', $slug)->firstOrFail();
        
        return Inertia::render('dashboard/DashboardContent', [
            'adminSection' => 'plugin-settings',
            'plugin' => $plugin,
        ]);
    }

    /**
     * Update the specified plugin settings.
     */
    public function updateSettings(Request $request, string $slug)
    {
        $this->authorizeEdit();
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        if ($this->pluginManager->updateSettings($slug, $validated['settings'])) {
            return back()->with('success', 'Plugin settings updated successfully.');
        }

        return back()->with('error', 'Failed to update plugin settings.');
    }

    /**
     * Uninstall the specified plugin.
     */
    public function destroy(string $slug)
    {
        $this->authorizeDelete();
        if ($this->pluginManager->uninstall($slug)) {
            return redirect()->route('dashboard.admin.plugins.index')
                ->with('success', 'Plugin uninstalled successfully.');
        }

        return back()->with('error', 'Failed to uninstall plugin.');
    }

    protected function authorizeView(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if ($user->can('view plugins') || $user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }

    protected function authorizeEdit(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if ($user->can('install plugins') || $user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }

    protected function authorizeActivate(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if ($user->can('activate plugins') || $user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }

    protected function authorizeDeactivate(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if ($user->can('deactivate plugins') || $user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }

    protected function authorizeDelete(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if ($user->can('delete plugins') || $user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }
}
