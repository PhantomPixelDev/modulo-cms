<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostRevision;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

/**
 * Earlier versions of a post or page, and putting one back. Restoring saves
 * the current text as a revision first, so a restore can itself be undone.
 */
class RevisionController extends Controller
{
    public function index(int $postId): JsonResponse
    {
        $post = Post::findOrFail($postId);
        $this->authorize('update', $post);

        return response()->json([
            'revisions' => $post->revisions()->with('user:id,name')->limit(100)->get()
                ->map(fn (PostRevision $revision) => [
                    'id' => $revision->id,
                    'title' => $revision->title,
                    'excerpt' => $revision->excerpt,
                    'content' => $revision->content,
                    'meta_title' => $revision->meta_title,
                    'meta_description' => $revision->meta_description,
                    'user' => $revision->user?->name,
                    'created_at' => $revision->created_at->toIso8601String(),
                ]),
        ]);
    }

    public function restore(int $postId, int $revisionId): RedirectResponse
    {
        $post = Post::findOrFail($postId);
        $this->authorize('update', $post);

        $revision = PostRevision::where('post_id', $post->id)->findOrFail($revisionId);

        $post->update($revision->only(PostRevision::FIELDS));

        return back()->with('success', 'Restored the version from '.$revision->created_at->toDayDateTimeString().'.');
    }
}
