<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Services\SiteSettingsService;
use Illuminate\Http\Response;

class FeedController extends Controller
{
    /**
     * Display the RSS feed.
     */
    public function index(): Response
    {
        $settings = app(SiteSettingsService::class);
        $limit = $settings->get('feed_limit', 10);
        $siteName = $settings->siteName();
        $siteTagline = $settings->get('site_tagline', '');
        $siteUrl = $settings->get('site_url', config('app.url', 'http://localhost'));

        $posts = Post::with(['author', 'postType'])
            ->published()
            ->whereHas('postType', function ($q) {
                $q->where('is_public', true);
            })
            ->orderBy('published_at', 'desc')
            ->limit($limit)
            ->get();

        $xml = $this->buildRss($posts, $siteName, $siteTagline, $siteUrl, $settings);

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }

    protected function buildRss($posts, $siteName, $siteTagline, $siteUrl, $settings): string
    {
        $now = now()->toRfc2822String();
        $itemsXml = '';

        foreach ($posts as $post) {
            $url = htmlspecialchars($settings->formatPostUrl($post), ENT_XML1, 'UTF-8');
            $pubDate = $post->published_at ? $post->published_at->toRfc2822String() : $post->created_at->toRfc2822String();
            $author = htmlspecialchars($post->author?->name ?? 'Admin', ENT_XML1, 'UTF-8');
            $title = htmlspecialchars($post->title ?? '', ENT_XML1, 'UTF-8');
            $excerpt = htmlspecialchars($post->excerpt ?? '', ENT_XML1, 'UTF-8');

            $itemsXml .= "
        <item>
            <title>{$title}</title>
            <link>{$url}</link>
            <description>{$excerpt}</description>
            <author>{$author}</author>
            <pubDate>{$pubDate}</pubDate>
            <guid isPermaLink=\"false\">{$post->id}</guid>
        </item>";
        }

        $safeSiteName = htmlspecialchars($siteName, ENT_XML1, 'UTF-8');
        $safeSiteUrl = htmlspecialchars($siteUrl, ENT_XML1, 'UTF-8');
        $safeSiteTagline = htmlspecialchars($siteTagline, ENT_XML1, 'UTF-8');

        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<rss version=\"2.0\" xmlns:content=\"http://purl.org/rss/1.0/modules/content/\" xmlns:wfw=\"http://wellformedweb.org/CommentAPI/\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:atom=\"http://www.w3.org/2000/svg\" xmlns:sy=\"http://purl.org/rss/1.0/modules/syndication/\" xmlns:slash=\"http://purl.org/rss/1.0/modules/slash/\">
    <channel>
        <title>{$safeSiteName}</title>
        <link>{$safeSiteUrl}</link>
        <description>{$safeSiteTagline}</description>
        <lastBuildDate>{$now}</lastBuildDate>
        <language>".app()->getLocale()."</language>
        {$itemsXml}
    </channel>
</rss>";
    }
}
