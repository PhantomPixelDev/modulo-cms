<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PostType;
use App\Models\SitemapSetting;
use App\Services\SitemapBuilder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SitemapController extends Controller
{
    public function index(): Response
    {
        $this->authorizeView();
        $settings = (new SitemapBuilder())->getSettings();
        $postTypes = PostType::orderBy('menu_position')->get(['id', 'name', 'label', 'route_prefix', 'is_public']);

        return Inertia::render('Dashboard', [
            'adminSection' => 'sitemap',
            'sitemapSettings' => $settings,
            'postTypes' => $postTypes,
        ]);
    }

    public function update(Request $request)
    {
        $this->authorizeEdit();

        $data = $request->validate([
            'included_post_type_ids' => 'nullable|array',
            'included_post_type_ids.*' => 'integer|exists:post_types,id',
            'include_taxonomies' => 'required|boolean',
            'enable_cache' => 'required|boolean',
            'cache_ttl' => 'required|integer|min:60|max:86400',
        ]);

        $settings = (new SitemapBuilder())->getSettings();
        $settings->fill($data);
        $settings->save();

        return back()->with('success', 'Sitemap settings updated');
    }

    public function regenerate(SitemapBuilder $builder)
    {
        $this->authorizeEdit();
        $builder->regenerate();
        return back()->with('success', 'Sitemap regenerated');
    }

    protected function authorizeView(): void
    {
        // Gate by permission if available; otherwise allow admins by role
        $user = auth()->user();
        if (!$user) abort(403);
        if (method_exists($user, 'can') && $user->can('view settings')) return;
        if ($user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }

    protected function authorizeEdit(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if (method_exists($user, 'can') && $user->can('edit settings')) return;
        if ($user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }
}
