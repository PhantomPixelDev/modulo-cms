<?php

namespace App\Observers;

use App\Models\Post;
use App\Services\SearchEnginePingingService;

class PostObserver
{
    protected $pingingService;

    public function __construct(SearchEnginePingingService $pingingService)
    {
        $this->pingingService = $pingingService;
    }

    /**
     * Handle the Post "saved" event.
     */
    public function saved(Post $post): void
    {
        // If the post was just published or updated while published
        if ($post->status === 'published') {
            $this->pingingService->ping($post);
        }
    }
}
