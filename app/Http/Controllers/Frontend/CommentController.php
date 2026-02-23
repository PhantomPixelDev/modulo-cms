<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use App\Models\SiteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CommentController extends Controller
{
    public function store(Request $request, Post $post): RedirectResponse
    {
        if (!$this->commentsEnabled($post)) {
            abort(403, 'Comments are disabled for this content.');
        }

        $rules = [
            'content' => ['required', 'string', 'max:2000'],
            'parent_id' => [
                'nullable',
                Rule::exists('comments', 'id')->where(function ($query) use ($post) {
                    return $query->where('post_id', $post->id);
                }),
            ],
        ];

        if ($request->user()) {
            $rules['author_name'] = ['nullable', 'string', 'max:255'];
            $rules['author_email'] = ['nullable', 'email', 'max:255'];
        } else {
            $rules['author_name'] = ['required', 'string', 'max:255'];
            $rules['author_email'] = ['required', 'email', 'max:255'];
        }

        $data = $request->validate($rules);

        $comment = new Comment();
        $comment->post_id = $post->id;
        $comment->parent_id = $data['parent_id'] ?? null;
        $comment->content = $data['content'];
        $comment->status = 'pending';
        $comment->approved_at = null;
        $comment->ip_address = $request->ip();
        $comment->user_agent = $request->userAgent();

        if ($request->user()) {
            $comment->user_id = $request->user()->id;
            $comment->author_name = $request->user()->name ?? ($request->user()->email ?? 'User');
            $comment->author_email = $request->user()->email;
            $comment->author_avatar = $request->user()->avatar ?? null;
        } else {
            $comment->author_name = $data['author_name'];
            $comment->author_email = $data['author_email'];
        }

        $comment->save();

        return back()->with('success', 'Thanks! Your comment is awaiting moderation.');
    }

    protected function commentsEnabled(Post $post): bool
    {
        $global = SiteSetting::get('enable_comments', true);
        if (!$global) {
            return false;
        }

        return (bool) ($post->postType?->has_comments ?? false);
    }
}
