<?php

namespace App\Observers;

use App\Models\Post;
use App\Models\PostRevision;
use App\Models\Redirect;
use App\Services\AdminStatsService;
use App\Services\PostService;
use App\Services\SearchEnginePingingService;
use Illuminate\Support\Facades\Auth;

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
     * Keep the version being replaced when the text of a post changes.
     */
    public function updating(Post $post): void
    {
        if (! $post->isDirty(PostRevision::FIELDS) || ! schema_has_table('post_revisions')) {
            return;
        }

        $original = [];
        foreach (PostRevision::FIELDS as $field) {
            $original[$field] = $post->getOriginal($field);
        }

        PostRevision::create($original + [
            'title' => (string) ($original['title'] ?? ''),
            'post_id' => $post->id,
            'user_id' => Auth::id(),
            'created_at' => now(),
        ]);

        $keep = max(1, (int) config('content.revisions_keep'));
        $stale = array_slice(PostRevision::where('post_id', $post->id)->orderByDesc('id')->pluck('id')->all(), $keep);

        if ($stale !== []) {
            PostRevision::whereIn('id', $stale)->delete();
        }
    }

    /**
     * A live post whose slug changes keeps its old URL working.
     */
    public function updated(Post $post): void
    {
        if (! $post->wasChanged('slug') || ! schema_has_table('redirects')) {
            return;
        }

        $wasLive = $post->getOriginal('status') === 'published'
            && ($post->getOriginal('published_at') === null || $post->getOriginal('published_at') <= now());

        if ($wasLive) {
            Redirect::point($post->publicPath((string) $post->getOriginal('slug')), $post->publicPath(), automatic: true);
        }
    }

    /**
     * Handle the Post "saved" event.
     */
    public function saved(Post $post): void
    {
        $this->postService->flushCache();
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
        $this->postService->flushCache();
        $this->adminStats->forget();
    }

    public function restored(Post $post): void
    {
        $this->postService->flushCache();
        $this->adminStats->forget();
    }
}
