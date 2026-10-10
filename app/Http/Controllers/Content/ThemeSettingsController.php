<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Theme;
use App\Services\ThemeManager;
use App\Services\ThemeSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ThemeSettingsController extends Controller
{
    public function index(ThemeManager $manager): RedirectResponse|Response
    {
        $theme = $manager->getActiveTheme();
        abort_unless(auth()->user()?->can('customize themes'), 403);

        return $theme
            ? redirect()->route('dashboard.admin.themes.settings.edit', $theme)
            : Inertia::render('Dashboard', ['adminSection' => 'theme-settings', 'themeSettings' => null]);
    }

    public function edit(Theme $theme, ThemeSettings $settings): Response
    {
        $this->authorize('customize', $theme);
        abort_unless($theme->is_installed, 404);

        return Inertia::render('Dashboard', [
            'adminSection' => 'theme-settings',
            'themeSettings' => [
                'id' => $theme->id, 'name' => $theme->name, 'active' => $theme->is_active,
                'fields' => $settings->fields($theme), 'values' => $settings->values($theme),
            ],
        ]);
    }

    public function update(Request $request, Theme $theme, ThemeSettings $settings, ThemeManager $manager): RedirectResponse
    {
        $this->authorize('customize', $theme);
        abort_unless($theme->is_installed, 404);
        $theme->update(['settings' => $settings->validate($theme, $request->all())]);
        $manager->clearCache();

        return back()->with('success', __('dashboard.theme_settings.saved'));
    }

    public function reset(Theme $theme, ThemeManager $manager): RedirectResponse
    {
        $this->authorize('customize', $theme);
        abort_unless($theme->is_installed, 404);
        $theme->update(['settings' => null]);
        $manager->clearCache();

        return back()->with('success', __('dashboard.theme_settings.reset_done'));
    }
}
