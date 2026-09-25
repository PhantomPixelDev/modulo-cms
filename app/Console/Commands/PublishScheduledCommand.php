<?php

namespace App\Console\Commands;

use App\Models\Post;
use App\Services\PostService;
use App\Services\SearchEnginePingingService;
use App\Services\SitemapBuilder;
use App\Support\ActivityLog;
use App\Support\SystemMeta;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Makes scheduled posts go live properly.
 *
 * A post saved as published with a future date is already hidden until then
 * (Post::scopePublished). What nothing did was the rest of publishing at
 * that moment: clear the cached listings and sitemap, tell search engines,
 * and let plugins know. The scheduler runs this every minute.
 */
class PublishScheduledCommand extends Command
{
    public const LAST_RUN_KEY = 'publish_scheduled_checked_at';

    protected $signature = 'modulo:publish-scheduled';

    protected $description = 'Announce scheduled posts whose publish time has come';

    public function handle(PostService $posts, SitemapBuilder $sitemap, SearchEnginePingingService $pinger): int
    {
        $now = Carbon::now();
        $last = SystemMeta::get(self::LAST_RUN_KEY);
        // First run: only look back a few minutes rather than re-announcing history.
        $since = $last !== null ? Carbon::parse($last) : $now->copy()->subMinutes(5);

        $due = Post::query()
            ->with('postType')
            ->where('status', 'published')
            ->where('published_at', '>', $since)
            ->where('published_at', '<=', $now)
            ->get();

        SystemMeta::put(self::LAST_RUN_KEY, $now->toIso8601String());

        if ($due->isEmpty()) {
            return self::SUCCESS;
        }

        $posts->flushCache();
        $sitemap->clearCachedXml();

        foreach ($due as $post) {
            $pinger->ping($post);
            do_action('post_published', $post);
            ActivityLog::record('post.published', 'Published scheduled post "'.$post->title.'"', $post);
            $this->line("Published: {$post->title}");
        }

        return self::SUCCESS;
    }
}
