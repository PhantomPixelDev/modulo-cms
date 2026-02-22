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

        if ($post->status === 'published') {
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
