<?php

namespace App\Mail;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CommentPending extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public Comment $comment, public Post $post) {}

    public function build(): self
    {
        return $this->subject('New comment awaiting moderation on '.$this->post->title)
            ->markdown('emails.comment.pending', [
                'comment' => $this->comment,
                'post' => $this->post,
            ]);
    }
}
