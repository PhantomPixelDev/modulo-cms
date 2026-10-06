<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Post;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Deleted posts and pages: restore them, or delete them for good. Anything
 * left longer than content.trash_days is purged by the scheduler.
 */
class TrashController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless(
            $request->user()?->can('delete posts') || $request->user()?->can('delete pages') || $request->user()?->hasRole(['admin', 'super-admin']),
            403
        );

        $items = Post::onlyTrashed()
            ->with(['postType:id,name,label', 'author:id,name'])
            ->orderByDesc('deleted_at')
            ->paginate(25)
            ->through(fn (Post $post) => [
                'id' => $post->id,
                'title' => $post->title,
                'slug' => $post->slug,
                'status' => $post->status,
                'type' => $post->postType !== null ? ($post->postType->label ?? $post->postType->name) : null,
                'author' => $post->author?->name,
                'deleted_at' => $post->deleted_at?->toIso8601String(),
            ]);

        return Inertia::render('Dashboard', [
            'adminSection' => 'trash',
            'trash' => [
                'items' => $items,
                'days' => (int) config('content.trash_days'),
            ],
        ]);
    }

    public function restore(int $id): RedirectResponse
    {
        $post = Post::onlyTrashed()->findOrFail($id);
        $this->authorizeDelete($post);

        $post->restore();

        return back()->with('success', "\"{$post->title}\" was restored.");
    }

    public function destroy(int $id): RedirectResponse
    {
        $post = Post::onlyTrashed()->findOrFail($id);
        $this->authorizeDelete($post);

        $post->forceDelete();

        return back()->with('success', "\"{$post->title}\" was deleted permanently.");
    }

    public function empty(Request $request): RedirectResponse
    {
        abort_unless(
            $request->user()?->can('delete posts') || $request->user()?->can('delete pages') || $request->user()?->hasRole(['admin', 'super-admin']),
            403
        );

        $count = 0;
        $skipped = 0;
        Post::onlyTrashed()->each(function (Post $post) use (&$count, &$skipped) {
            try {
                $this->authorizeDelete($post);
            } catch (AuthorizationException) {
                $skipped++;

                return;
            }
            $post->forceDelete();
            $count++;
        });

        $message = "Deleted {$count} item".($count === 1 ? '' : 's').' permanently.';
        if ($skipped > 0) {
            $message .= " Skipped {$skipped} without permission.";
        }

        return back()->with('success', $message);
    }

    /**
     * Pages answer to the page policy, everything else to the post policy.
     */
    protected function authorizeDelete(Post $post): void
    {
        if ($post->postType?->name === 'page') {
            $this->authorize('delete', Page::findOrFail($post->id));

            return;
        }
        $this->authorize('delete', $post);
    }
}
