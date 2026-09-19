<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CommentController extends Controller
{
    public const STATUSES = ['pending', 'approved', 'spam'];

    public function __construct()
    {
        $this->middleware('permission:moderate comments');
    }

    public function index(Request $request): Response
    {
        $status = in_array($request->query('status'), self::STATUSES, true) ? $request->query('status') : null;

        $comments = Comment::query()
            ->with('post:id,title,slug')
            ->when($status, fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Comment $comment) => [
                'id' => $comment->id,
                'author_name' => $comment->author_name,
                'author_email' => $comment->author_email,
                'content' => $comment->content,
                'excerpt' => Str::limit($comment->content, 140),
                'status' => $comment->status,
                'is_reply' => $comment->parent_id !== null,
                'ip_address' => $comment->ip_address,
                'created_at' => $comment->created_at?->toIso8601String(),
                'post' => $comment->post ? [
                    'id' => $comment->post->id,
                    'title' => $comment->post->title,
                    'slug' => $comment->post->slug,
                ] : null,
            ]);

        $counts = Comment::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($total) => (int) $total);

        return Inertia::render('Dashboard', [
            'adminSection' => 'comments',
            'comments' => $comments,
            'commentCounts' => [
                'all' => $counts->sum(),
                ...collect(self::STATUSES)->mapWithKeys(fn ($s) => [$s => $counts->get($s, 0)])->all(),
            ],
            'commentFilter' => $status,
            'commentModeration' => (bool) SiteSetting::get('comment_moderation', false),
        ]);
    }

    public function update(Request $request, Comment $comment): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(self::STATUSES)],
        ]);

        $comment->status = $data['status'];
        $comment->approved_at = $data['status'] === 'approved' ? ($comment->approved_at ?? now()) : null;
        $comment->save();

        return back()->with('success', 'Comment updated.');
    }

    public function destroy(Comment $comment): RedirectResponse
    {
        // Replies are removed by the parent_id cascade
        $comment->delete();

        return back()->with('success', 'Comment deleted.');
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'comment_moderation' => ['required', 'boolean'],
        ]);

        SiteSetting::set('comment_moderation', (bool) $data['comment_moderation'], 'general', 'boolean');

        return back()->with('success', 'Comment settings saved.');
    }
}
