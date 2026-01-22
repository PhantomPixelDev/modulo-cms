<?php

namespace App\Services;

use App\Models\Post;
use App\Models\SiteSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SearchEnginePingingService
{
    /**
     * Ping search engines (IndexNow) when a post is published or updated.
     */
    public function ping(Post $post): void
    {
        if ($post->status !== 'published') {
            return;
        }

        $url = $this->getPostUrl($post);
        $this->pingIndexNow($url);
    }

    protected function getPostUrl(Post $post): string
    {
        $prefix = $post->postType?->route_prefix;
        $prefix = ($prefix === null || $prefix === '' || $prefix === '/') ? '' : '/' . ltrim($prefix, '/');
        $siteUrl = SiteSetting::get('site_url', config('app.url'));
        return rtrim($siteUrl, '/') . $prefix . '/' . ltrim((string)$post->slug, '/');
    }

    protected function pingIndexNow(string $url): void
    {
        $siteUrl = SiteSetting::get('site_url', config('app.url'));
        $host = parse_url($siteUrl, PHP_URL_HOST);
        $key = SiteSetting::get('indexnow_key');
        
        if (!$key) {
            Log::info('SearchEnginePingingService: IndexNow key not set. Skipping ping for URL: ' . $url);
            return;
        }

        try {
            $response = Http::timeout(5)
                ->retry(2, 250)
                ->post('https://api.indexnow.org/indexnow', [
                'host' => $host,
                'key' => $key,
                'keyLocation' => rtrim($siteUrl, '/') . '/' . $key . '.txt',
                'urlList' => [$url],
            ]);

            if ($response->successful()) {
                Log::info('SearchEnginePingingService: Successfully pinged IndexNow for URL: ' . $url);
            } else {
                Log::warning('SearchEnginePingingService: Failed to ping IndexNow for URL: ' . $url, [
                    'status' => $response->status(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('SearchEnginePingingService: Exception while pinging IndexNow: ' . $e->getMessage());
        }
    }
}
