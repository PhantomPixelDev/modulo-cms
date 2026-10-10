<?php

namespace App\Services;

use App\Models\Locale;
use App\Models\Menu;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Cache;

/** Invalidate public data without flushing sessions, locks, queues or recovery records. */
class WebsiteCache
{
    public function clear(): void
    {
        SiteSetting::clearCache();
        app(ThemeManager::class)->clearCache();
        app(PostService::class)->flushCache();
        app(PostTypeService::class)->clearCaches();
        Menu::query()->each(fn (Menu $menu) => app(MenuService::class)->forgetMenu($menu));
        Cache::forget('sitemap.settings');
        $sitemap = app(SitemapBuilder::class);
        $sitemap->clearCachedXml();
        foreach (Locale::getActive() as $locale) {
            /** @var Locale $locale */
            $sitemap->clearCachedXml($locale->code);
        }
    }
}
