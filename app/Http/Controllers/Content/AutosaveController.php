<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostAutosave;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

/**
 * The editor's unsaved text, kept per post and user, and the preview link
 * that shows it through the theme before it is saved.
 */
class AutosaveController extends Controller
{
    /**
     * The autosave the editor can offer to bring back, if it still differs
     * from what is saved.
     */
    public function show(Request $request, int $postId): JsonResponse
    {
        $post = $this->editable($postId);
        $autosave = $this->find($post, (int) $request->user()?->id);

        return response()->json([
            'autosave' => $autosave && $autosave->differsFrom($post) ? [
                'title' => $autosave->title,
                'excerpt' => $autosave->excerpt,
                'content' => $autosave->content,
                'saved_at' => $autosave->updated_at->toIso8601String(),
            ] : null,
        ]);
    }

    public function store(Request $request, int $postId): JsonResponse
    {
        $post = $this->editable($postId);
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:65535'],
            'content' => ['nullable', 'string'],
        ]);

        $autosave = PostAutosave::updateOrCreate(
            ['post_id' => $post->id, 'user_id' => $request->user()?->id],
            array_intersect_key($data, array_flip(PostAutosave::FIELDS)),
        );
        // Touch even when nothing changed, so "saved at" reflects this request
        $autosave->touch();

        return response()->json(['saved_at' => $autosave->updated_at->toIso8601String()]);
    }

    public function destroy(Request $request, int $postId): JsonResponse
    {
        $post = $this->editable($postId);
        $this->find($post, (int) $request->user()?->id)?->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * A link to the post as the theme shows it, with this user's unsaved text.
     * It is signed and expires, so it can be sent to someone without an
     * account for a quick look.
     */
    public function previewLink(Request $request, int $postId): JsonResponse
    {
        $post = $this->editable($postId);

        return response()->json([
            'url' => URL::temporarySignedRoute('content.preview', now()->addHour(), [
                'postId' => $post->id,
                'as' => $request->user()?->id,
            ]),
        ]);
    }

    protected function editable(int $postId): Post
    {
        $post = Post::findOrFail($postId);
        $this->authorize('update', $post);

        return $post;
    }

    protected function find(Post $post, int $userId): ?PostAutosave
    {
        return PostAutosave::where('post_id', $post->id)->where('user_id', $userId)->first();
    }
}
