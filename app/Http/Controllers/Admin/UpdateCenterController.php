<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plugin;
use App\Services\Plugins\PluginInstaller;
use App\Services\UpdateCenter;
use App\Support\InstallChannel;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

/**
 * The admin Updates page: core release status (with the commands that apply
 * it on this install) and one-click plugin updates from the registry.
 */
class UpdateCenterController extends Controller
{
    public function __construct(protected UpdateCenter $center) {}

    public function index(): Response
    {
        $this->authorizeView();

        return Inertia::render('Dashboard', [
            'adminSection' => 'updates',
            'updateCenter' => $this->center->summary() + [
                'channel' => InstallChannel::detect(),
                'canUpdatePlugins' => $this->canInstallPlugins(),
            ],
        ]);
    }

    public function check(): RedirectResponse
    {
        $this->authorizeView();

        $result = $this->center->refresh();

        if ($result['core']['error'] !== null || $result['plugin_error'] !== null) {
            return back()->with('warning', trim('Checked, with problems. '.implode(' ', array_filter([
                $result['core']['error'] !== null ? 'Core: '.$result['core']['error'] : null,
                $result['plugin_error'] !== null ? 'Plugins: '.$result['plugin_error'] : null,
            ]))));
        }

        return back()->with('success', 'Update check complete.');
    }

    public function updatePlugin(string $slug, PluginInstaller $installer): RedirectResponse
    {
        abort_unless($this->canInstallPlugins(), 403);

        $plugin = Plugin::where('slug', $slug)->firstOrFail();

        try {
            $result = $installer->install($slug);
        } catch (Throwable $e) {
            return back()->with('error', "Could not update {$plugin->name}: ".$e->getMessage());
        }

        $this->center->forgetPending();

        return back()->with('success', "{$plugin->name} updated to {$result['version']}.");
    }

    public function updateAllPlugins(PluginInstaller $installer): RedirectResponse
    {
        abort_unless($this->canInstallPlugins(), 403);

        $updated = [];
        $failed = [];

        foreach ($this->center->pluginUpdates() as $update) {
            try {
                $installer->install($update['slug']);
                $updated[] = $update['name'];
            } catch (Throwable $e) {
                // One bad package must not block the rest.
                $failed[] = $update['name'].' ('.$e->getMessage().')';
            }
        }

        $this->center->forgetPending();

        if ($failed !== []) {
            return back()->with('error', 'Some plugins could not be updated: '.implode('; ', $failed));
        }

        return back()->with('success', $updated === [] ? 'Every plugin is up to date.' : 'Updated '.implode(', ', $updated).'.');
    }

    protected function authorizeView(): void
    {
        $user = auth()->user();

        abort_unless($user !== null && ($user->can('edit settings') || $user->hasRole(['admin', 'super-admin'])), 403);
    }

    protected function canInstallPlugins(): bool
    {
        $user = auth()->user();

        return $user !== null && ($user->can('install plugins') || $user->hasRole(['admin', 'super-admin']));
    }
}
