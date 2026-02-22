<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Locale;
use App\Models\PostType;
use App\Services\SitemapBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class SitemapController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorizeView();
        $builder = new SitemapBuilder();
        $settings = $builder->getSettings();
        $postTypes = PostType::orderBy('menu_position')->get(['id', 'name', 'label', 'route_prefix', 'is_public']);
        $locales = Schema::hasTable('locales') ? Locale::getActive() : collect();
        $requestedLocale = $request->query('locale');
        if ($requestedLocale && (!Schema::hasTable('locales') || !Locale::isValidCode($requestedLocale))) {
            $requestedLocale = null;
        }
        $defaultLocale = Schema::hasTable('locales') ? Locale::getDefault()?->code : null;
        $currentLocale = $requestedLocale ?? $defaultLocale ?? config('app.fallback_locale', 'en');

        return Inertia::render('Dashboard', [
            'adminSection' => 'sitemap',
            'sitemapSettings' => $settings->getLocalizedConfig($currentLocale),
            'postTypes' => $postTypes,
            'locales' => $locales,
            'currentLocale' => $currentLocale,
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
            'locale' => 'nullable|string',
            'custom_urls' => 'nullable|array',
            'custom_urls.*.loc' => 'nullable|string',
            'custom_urls.*.lastmod' => 'nullable|date',
            'custom_urls.*.changefreq' => 'nullable|string',
            'custom_urls.*.priority' => 'nullable|numeric',
        ]);

        $locale = $data['locale'] ?? null;
        if ($locale && (!Schema::hasTable('locales') || !Locale::isValidCode($locale))) {
            $locale = null;
        }

        $builder = new SitemapBuilder();
        $settings = $builder->getSettings();

        $globalAttributes = collect($data)->only(['enable_cache', 'cache_ttl']);
        if ($globalAttributes->isNotEmpty()) {
            $settings->fill($globalAttributes->toArray());
            $settings->save();
        }

        $localizedAttributes = collect($data)->only(['included_post_type_ids', 'include_taxonomies', 'custom_urls'])->toArray();
        if ($locale) {
            $settings->setLocalizedConfig($locale, $localizedAttributes);
        } else {
            $settings->fill($localizedAttributes);
            $settings->save();
        }

        // Invalidate cached settings/xml so UI uses fresh values
        Cache::forget('sitemap.settings');
        $builder->clearCachedXml($locale);
        if (!$locale && Schema::hasTable('locales')) {
            foreach (Locale::getActive() as $activeLocale) {
                $builder->clearCachedXml($activeLocale->code);
            }
        }

        return back()->with('success', 'Sitemap settings updated');
    }

    public function regenerate(Request $request, SitemapBuilder $builder)
    {
        $this->authorizeEdit();
        $locale = $request->input('locale');
        if ($locale && (!Schema::hasTable('locales') || !Locale::isValidCode($locale))) {
            $locale = null;
        }
        $builder->regenerate($locale);
        return back()->with('success', 'Sitemap regenerated');
    }

    protected function authorizeView(): void
    {
        // Gate by permission if available; otherwise allow admins by role
        $user = auth()->user();
        if (!$user) abort(403);
        if (method_exists($user, 'can') && $user->can('view sitemap')) return;
        if ($user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }

    protected function authorizeEdit(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if (method_exists($user, 'can') && $user->can('edit sitemap')) return;
        if ($user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }
}
