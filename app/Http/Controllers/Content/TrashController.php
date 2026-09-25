<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Post;
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
        abort_unless($request->user()?->can('delete posts') || $request->user()?->hasRole(['admin', 'super-admin']), 403);

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
        $this->authorize('delete', $post);

        $post->restore();

        return back()->with('success', "\"{$post->title}\" was restored.");
    }

    public function destroy(int $id): RedirectResponse
    {
        $post = Post::onlyTrashed()->findOrFail($id);
        $this->authorize('delete', $post);

        $post->forceDelete();

        return back()->with('success', "\"{$post->title}\" was deleted permanently.");
    }

    public function empty(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('delete posts') || $request->user()?->hasRole(['admin', 'super-admin']), 403);

        $count = 0;
        Post::onlyTrashed()->each(function (Post $post) use (&$count) {
            $post->forceDelete();
            $count++;
        });

        return back()->with('success', "Deleted {$count} item".($count === 1 ? '' : 's').' permanently.');
    }
}
