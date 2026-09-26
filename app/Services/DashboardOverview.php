<?php

namespace App\Services;

use App\Models\Comment;
use App\Models\MenuItem;
use App\Models\Post;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * What the dashboard home shows someone who looks after content: their
 * drafts, what is about to go live, comments waiting, and — for whoever
 * runs the site — the steps left to set it up.
 */
class DashboardOverview
{
    public function __construct(protected SiteSettingsService $settings) {}

    /**
     * @return array<string, mixed>
     */
    public function for(User $user): array
    {
        $overview = [];

        if ($user->can('view posts')) {
            $overview['drafts'] = $this->list(
                Post::where('status', 'draft')->where('author_id', $user->id)->orderByDesc('updated_at'),
            );
            $overview['scheduled'] = $this->list(
                Post::where('status', 'published')->where('published_at', '>', now())->orderBy('published_at'),
                'published_at',
            );
            $overview['recent'] = $this->list(Post::with('author')->orderByDesc('updated_at'));
        }

        if ($user->can('moderate comments') || $user->hasRole(['admin', 'super-admin'])) {
            $overview['pendingComments'] = [
                'count' => Comment::where('status', 'pending')->count(),
                'latest' => Comment::with(['post:id,title', 'user:id,name'])->where('status', 'pending')->latest()->limit(3)->get()
                    ->map(fn (Comment $comment) => [
                        'id' => $comment->id,
                        'author' => $comment->author_name ?: $comment->user?->name,
                        'excerpt' => str($comment->content)->stripTags()->limit(90)->toString(),
                        'post' => $comment->post?->title,
                    ])->all(),
            ];
        }

        if ($user->can('update', SiteSetting::class) && ! SiteSetting::get('onboarding_dismissed', false)) {
            $overview['checklist'] = $this->checklist($user);
        }

        return $overview;
    }

    /**
     * The steps from a fresh install to a site worth showing. Each one is
     * checked against the real state, so it ticks itself off.
     *
     * @return array<int, array{key: string, done: bool}>
     */
    public function checklist(User $user): array
    {
        $siteName = (string) SiteSetting::get('site_name', '');
        $pageIsLive = Post::whereHas('postType', fn (Builder $q) => $q->where('name', 'page'))
            ->where('status', 'published')->exists();

        $steps = [
            'site_name' => $siteName !== '' && ! in_array($siteName, ['Modulo', 'Modulo CMS', 'Laravel'], true),
            'logo' => filled(SiteSetting::get('site_logo')),
            'first_page' => $pageIsLive,
            'menu' => MenuItem::exists(),
            'email' => ! in_array(config('mail.default'), ['log', 'array'], true),
            'two_factor' => $user->hasTwoFactorEnabled(),
        ];

        return collect($steps)->map(fn (bool $done, string $key) => ['key' => $key, 'done' => $done])->values()->all();
    }

    /**
     * @param  Builder<Post>  $query
     * @return array<int, array<string, mixed>>
     */
    protected function list(Builder $query, string $dateColumn = 'updated_at'): array
    {
        return $query->with('postType:id,name,label')->limit(5)->get()
            ->map(fn (Post $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'status' => $post->status,
                'is_page' => $post->postType?->name === 'page',
                'type' => $post->postType === null ? null : ($post->postType->label ?? $post->postType->name),
                'author' => $post->author?->name,
                'date' => $this->settings->formatDateTime($post->{$dateColumn}),
                'date_iso' => $post->{$dateColumn}?->toIso8601String(),
            ])->all();
    }
}
