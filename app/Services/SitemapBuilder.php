<?php

namespace App\Services;

use App\Models\Locale;
use App\Models\Post;
use App\Models\PostType;
use App\Models\SitemapSetting;
use App\Models\Taxonomy;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Carbon;

class SitemapBuilder
{
    protected string $settingsCacheKey = 'sitemap.settings';
    protected string $xmlCacheKeyPrefix = 'sitemap.xml';
    protected int $settingsTtl;

    public function __construct()
    {
        $this->settingsTtl = (int) env('SITEMAP_SETTINGS_CACHE_TTL', 600);
    }

    public function getSettings(): SitemapSetting
    {
        return Cache::remember($this->settingsCacheKey, $this->settingsTtl, function () {
            $settings = SitemapSetting::query()->first();
            if (!$settings) {
                $settings = SitemapSetting::create([
                    'included_post_type_ids' => null, // null = include all public by default
                    'include_taxonomies' => true,
                    'enable_cache' => true,
                    'cache_ttl' => 3600,
                    'last_generated_at' => null,
                ]);
            }
            return $settings;
        });
    }

    public function getXml(?string $locale = null, bool $forceRefresh = false): string
    {
        $settings = $this->getSettings();
        $locale = $this->normalizeLocale($locale);
        $config = $settings->getLocalizedConfig($locale);

        if ($settings->enable_cache && !$forceRefresh) {
            return Cache::remember($this->xmlCacheKey($locale), $settings->cache_ttl, function () use ($config, $locale) {
                return $this->buildXml($config, $locale);
            });
        }

        $xml = $this->buildXml($config, $locale);
        if ($settings->enable_cache) {
            Cache::put($this->xmlCacheKey($locale), $xml, $settings->cache_ttl);
        }
        return $xml;
    }

    public function regenerate(?string $locale = null): string
    {
        $settings = $this->getSettings();
        $locale = $this->normalizeLocale($locale);
        $config = $settings->getLocalizedConfig($locale);
        $xml = $this->buildXml($config, $locale);
        if ($settings->enable_cache) {
            Cache::put($this->xmlCacheKey($locale), $xml, $settings->cache_ttl);
        }
        $settings->last_generated_at = now();
        $settings->save();
        return $xml;
    }

    public function clearCachedXml(?string $locale = null): void
    {
        Cache::forget($this->xmlCacheKey($locale));
    }

    protected function buildXml(array $config, ?string $locale = null): string
    {
        if (!Schema::hasTable('posts')) {
            return $this->wrapUrlset([
                $this->urlNode($this->buildUrl('/', $locale), now())
            ], false);
        }

        $urls = [];
        $hasAlternates = false;

        // Home page
        $homeAlternates = $this->alternateLocaleUrls(fn ($code) => $this->buildUrl('/', $code));
        if ($homeAlternates) {
            $hasAlternates = true;
        }
        $urls[] = $this->urlNode(
            $this->buildUrl('/', $locale),
            now(),
            'daily',
            '1.0',
            $homeAlternates
        );

        $included = $config['included_post_type_ids'] ?? null;
        $includeAll = empty($included) || !is_array($included);

        // Post type archives (only public and selected)
        if (Schema::hasTable('post_types')) {
            $query = PostType::where('is_public', true);
            if (!$includeAll) {
                $query->whereIn('id', $included);
            }
            $postTypes = $query->get();
            foreach ($postTypes as $pt) {
                $prefix = $pt->route_prefix;
                if ($prefix && $prefix !== '/') {
                    $loc = $this->buildUrl('/' . ltrim($prefix, '/'), $locale);
                    $lastmod = Post::where('post_type_id', $pt->id)
                        ->published()
                        ->orderByDesc('updated_at')
                        ->value('updated_at') ?? now();
                    $urls[] = $this->urlNode($loc, $lastmod, 'daily', '0.8');
                }
            }
        }

        // Published content (posts and pages)
        $postsQuery = Post::with(['postType', 'translations'])
            ->whereHas('postType', function ($q) use ($includeAll, $included) {
                $q->where('is_public', true);
                if (!$includeAll) {
                    $q->whereIn('id', $included);
                }
            })
            ->published()
            ->orderByDesc('published_at')
            ->limit(5000);

        if ($locale) {
            $postsQuery->whereHas('translations', function ($query) use ($locale) {
                $query->where('locale', $locale);
            });
        }

        $posts = $postsQuery->get();
        foreach ($posts as $post) {
            $prefix = $post->postType?->route_prefix;
            $prefix = ($prefix === null || $prefix === '' || $prefix === '/') ? '' : '/' . ltrim($prefix, '/');
            $translation = $locale ? $post->translations->firstWhere('locale', $locale) : null;
            $slug = $translation?->slug ?: $post->slug;
            $loc = $this->buildUrl($prefix . '/' . ltrim((string) $slug, '/'), $locale);
            $lastmod = $post->updated_at ?? $post->published_at ?? now();
            $alternates = $this->buildPostAlternates($post, $prefix);
            if (!$hasAlternates && !empty($alternates)) {
                $hasAlternates = true;
            }
            $urls[] = $this->urlNode($loc, $lastmod, 'weekly', '0.7', $alternates);
        }

        // Taxonomy archives if enabled
        if (($config['include_taxonomies'] ?? true) && Schema::hasTable('taxonomies')) {
            $taxonomies = Taxonomy::where('is_public', true)
                ->get();
            foreach ($taxonomies as $tax) {
                $base = $tax->slug;
                $terms = $tax->terms()->orderBy('updated_at', 'desc')->limit(5000)->get();
                foreach ($terms as $term) {
                    $loc = $this->buildUrl('/' . trim($base, '/') . '/' . $term->slug, $locale);
                    $lastmod = $term->updated_at ?? now();
                    $urls[] = $this->urlNode($loc, $lastmod, 'weekly', '0.5');
                }
            }
        }

        // Custom URLs provided per locale
        if (!empty($config['custom_urls']) && is_array($config['custom_urls'])) {
            foreach ($config['custom_urls'] as $custom) {
                $entry = $this->normalizeCustomUrlEntry($custom, $locale);
                if (!$entry) {
                    continue;
                }
                $urls[] = $this->urlNode(
                    $entry['loc'],
                    $entry['lastmod'],
                    $entry['changefreq'],
                    $entry['priority']
                );
            }
        }

        return $this->wrapUrlset($urls, $hasAlternates);
    }

    private function urlNode(string $loc, $lastmod = null, string $changefreq = null, string $priority = null, array $alternates = []): string
    {
        $locEsc = htmlspecialchars($loc, ENT_XML1 | ENT_COMPAT, 'UTF-8');
        $lastmodStr = $lastmod ? Carbon::parse($lastmod)->toAtomString() : null;
        $node = "  <url>\n";
        $node .= "    <loc>{$locEsc}</loc>\n";
        if ($lastmodStr) { $node .= "    <lastmod>{$lastmodStr}</lastmod>\n"; }
        if ($changefreq) { $node .= "    <changefreq>{$changefreq}</changefreq>\n"; }
        if ($priority) { $node .= "    <priority>{$priority}</priority>\n"; }
        foreach ($alternates as $code => $alternateUrl) {
            $altEsc = htmlspecialchars($alternateUrl, ENT_XML1 | ENT_COMPAT, 'UTF-8');
            $rel = htmlspecialchars($code, ENT_XML1 | ENT_COMPAT, 'UTF-8');
            $node .= "    <xhtml:link rel=\"alternate\" hreflang=\"{$rel}\" href=\"{$altEsc}\" />\n";
        }
        $node .= "  </url>\n";
        return $node;
    }

    private function wrapUrlset(array $urlNodes, bool $includeAlternateNamespace = false): string
    {
        $urls = implode('', $urlNodes);
        $namespace = $includeAlternateNamespace
            ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
            : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
{$namespace}
{$urls}</urlset>
XML;
    }

    protected function buildUrl(string $path, ?string $locale = null): string
    {
        $path = '/' . ltrim($path, '/');
        if ($locale) {
            return url('/' . trim($locale, '/') . $path);
        }

        return url($path);
    }

    protected function xmlCacheKey(?string $locale = null): string
    {
        return $this->xmlCacheKeyPrefix . '.' . ($locale ?: 'default');
    }

    protected function normalizeLocale(?string $locale): ?string
    {
        if (!$locale || !Schema::hasTable('locales')) {
            return $locale;
        }

        return Locale::isValidCode($locale) ? $locale : null;
    }

    protected function buildPostAlternates(Post $post, string $prefix): array
    {
        if (!Schema::hasTable('locales')) {
            return [];
        }

        $alternates = [];
        foreach ($post->translations as $translation) {
            if (!$translation->slug) {
                continue;
            }
            $alternates[$translation->locale] = $this->buildUrl(
                $prefix . '/' . ltrim($translation->slug, '/'),
                $translation->locale
            );
        }

        return $alternates;
    }

    protected function alternateLocaleUrls(callable $builder): array
    {
        if (!Schema::hasTable('locales')) {
            return [];
        }

        return Locale::getActive()->mapWithKeys(function ($locale) use ($builder) {
            return [$locale->code => $builder($locale->code)];
        })->toArray();
    }

    protected function normalizeCustomUrlEntry(mixed $entry, ?string $locale = null): ?array
    {
        if (is_string($entry)) {
            $entry = ['loc' => $entry];
        }

        if (!is_array($entry) || empty($entry['loc'])) {
            return null;
        }

        $loc = $entry['loc'];
        if (!str_starts_with($loc, 'http://') && !str_starts_with($loc, 'https://')) {
            $loc = $this->buildUrl($loc, $locale);
        }

        return [
            'loc' => $loc,
            'lastmod' => $entry['lastmod'] ?? null,
            'changefreq' => $entry['changefreq'] ?? null,
            'priority' => $entry['priority'] ?? null,
        ];
    }
}
