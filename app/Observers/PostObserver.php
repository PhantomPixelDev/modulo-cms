<?php

namespace App\Observers;

use App\Models\Post;
use App\Services\AdminStatsService;
use App\Services\PostService;
use App\Services\SearchEnginePingingService;

class PostObserver
{
    protected $pingingService;
    protected PostService $postService;
    protected AdminStatsService $adminStats;

    public function __construct(
        SearchEnginePingingService $pingingService,
        PostService $postService,
        AdminStatsService $adminStats
    ) {
        $this->pingingService = $pingingService;
        $this->postService = $postService;
        $this->adminStats = $adminStats;
    }

    /**
     * Handle the Post "saved" event.
     */
    public function saved(Post $post): void
    {
        $this->postService->clearPostCache($post->slug);
        $this->adminStats->forget();

        $publishedNow = $post->status === 'published';
        $becamePublished = $post->wasRecentlyCreated
            ? $publishedNow
            : ($post->wasChanged('status') && $post->getOriginal('status') !== 'published' && $publishedNow);
        $urlRelevantChange = $post->wasChanged(['slug', 'post_type_id', 'published_at']);

        if ($publishedNow && ($becamePublished || $urlRelevantChange)) {
            $this->pingingService->ping($post);
        }
    }

    /**
     * Handle the Post "deleted" event.
     */
    public function deleted(Post $post): void
    {
        $this->postService->clearPostCache($post->slug);
        $this->adminStats->forget();
    }
}
