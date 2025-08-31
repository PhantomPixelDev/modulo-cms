<?php

namespace App\Services;

use App\Models\Post;
use App\Models\PostType;
use App\Models\Taxonomy;
use App\Models\SitemapSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Carbon;

class SitemapBuilder
{
    protected string $settingsCacheKey = 'sitemap.settings';
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

    public function getXml(bool $forceRefresh = false): string
    {
        $settings = $this->getSettings();

        if ($settings->enable_cache && !$forceRefresh) {
            return Cache::remember('sitemap.xml', $settings->cache_ttl, function () use ($settings) {
                return $this->buildXml($settings);
            });
        }

        $xml = $this->buildXml($settings);
        if ($settings->enable_cache) {
            Cache::put('sitemap.xml', $xml, $settings->cache_ttl);
        }
        return $xml;
    }

    public function regenerate(): string
    {
        $settings = $this->getSettings();
        $xml = $this->buildXml($settings);
        if ($settings->enable_cache) {
            Cache::put('sitemap.xml', $xml, $settings->cache_ttl);
        }
        $settings->last_generated_at = now();
        $settings->save();
        return $xml;
    }

    protected function buildXml(SitemapSetting $settings): string
    {
        if (!Schema::hasTable('posts')) {
            return $this->wrapUrlset([
                $this->urlNode(url('/'), now())
            ]);
        }

        $urls = [];

        // Home page
        $urls[] = $this->urlNode(url('/'), now(), 'daily', '1.0');

        $included = $settings->included_post_type_ids;
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
                    $loc = url('/' . ltrim($prefix, '/'));
                    $lastmod = Post::where('post_type_id', $pt->id)
                        ->published()
                        ->orderByDesc('updated_at')
                        ->value('updated_at') ?? now();
                    $urls[] = $this->urlNode($loc, $lastmod, 'daily', '0.8');
                }
            }
        }

        // Published content (posts and pages)
        $postsQuery = Post::with('postType')
            ->whereHas('postType', function ($q) use ($includeAll, $included) {
                $q->where('is_public', true);
                if (!$includeAll) {
                    $q->whereIn('id', $included);
                }
            })
            ->published()
            ->orderByDesc('published_at')
            ->limit(5000);

        $posts = $postsQuery->get();
        foreach ($posts as $post) {
            $prefix = $post->postType?->route_prefix;
            $prefix = ($prefix === null || $prefix === '' || $prefix === '/') ? '' : '/' . ltrim($prefix, '/');
            $loc = url($prefix . '/' . ltrim((string) $post->slug, '/'));
            $lastmod = $post->updated_at ?? $post->published_at ?? now();
            $urls[] = $this->urlNode($loc, $lastmod, 'weekly', '0.7');
        }

        // Taxonomy archives if enabled
        if ($settings->include_taxonomies && Schema::hasTable('taxonomies')) {
            $taxonomies = Taxonomy::where('is_public', true)
                ->whereIn('slug', ['tags', 'categories'])
                ->get();
            foreach ($taxonomies as $tax) {
                $terms = $tax->terms()->orderBy('updated_at', 'desc')->limit(5000)->get();
                foreach ($terms as $term) {
                    $loc = url('/' . trim($tax->slug, '/') . '/' . $term->slug);
                    $lastmod = $term->updated_at ?? now();
                    $urls[] = $this->urlNode($loc, $lastmod, 'weekly', '0.5');
                }
            }
        }

        return $this->wrapUrlset($urls);
    }

    private function urlNode(string $loc, $lastmod = null, string $changefreq = null, string $priority = null): string
    {
        $locEsc = htmlspecialchars($loc, ENT_XML1 | ENT_COMPAT, 'UTF-8');
        $lastmodStr = $lastmod ? Carbon::parse($lastmod)->toAtomString() : null;
        $node = "  <url>\n";
        $node .= "    <loc>{$locEsc}</loc>\n";
        if ($lastmodStr) { $node .= "    <lastmod>{$lastmodStr}</lastmod>\n"; }
        if ($changefreq) { $node .= "    <changefreq>{$changefreq}</changefreq>\n"; }
        if ($priority) { $node .= "    <priority>{$priority}</priority>\n"; }
        $node .= "  </url>\n";
        return $node;
    }

    private function wrapUrlset(array $urlNodes): string
    {
        $urls = implode('', $urlNodes);
        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{$urls}</urlset>
XML;
    }
}
