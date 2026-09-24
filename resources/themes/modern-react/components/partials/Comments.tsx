import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageProps } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';
import React, { useState } from 'react';
import { formatDate, useThemeT } from './ui';

interface Comment {
    id: number;
    user_id: number | null;
    author_name: string;
    author_avatar: string | null;
    content: string;
    created_at: string;
    replies?: Comment[];
}

interface CommentsProps {
    postId: number;
    comments: Comment[];
    allowComments: boolean;
}

function Avatar({ name, src }: { name: string; src: string | null }) {
    if (src) {
        return <img className="size-9 shrink-0 rounded-full object-cover" src={src} alt="" />;
    }
    return (
        <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
            aria-hidden="true"
        >
            {(name || '?').charAt(0).toUpperCase()}
        </span>
    );
}

interface CommentFormProps {
    postId: number;
    parentId?: number | null;
    onDone?: () => void;
    onCancel?: () => void;
}

function CommentForm({ postId, parentId = null, onDone, onCancel }: CommentFormProps) {
    const tt = useThemeT();
    const { auth } = usePage<PageProps>().props;
    const [showGuestHint, setShowGuestHint] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        content: '',
        parent_id: parentId,
        author_name: '',
        author_email: '',
        // Honeypot: humans never see or fill this field
        website: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!auth.user && (!data.author_name || !data.author_email)) {
            setShowGuestHint(true);
            return;
        }

        post(`/posts/${postId}/comments`, {
            preserveScroll: true,
            onSuccess: () => {
                reset('content');
                setShowGuestHint(false);
                onDone?.();
            },
        });
    };

    const isReply = parentId !== null;

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input
                type="text"
                name="website"
                value={data.website}
                onChange={(e) => setData('website', e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
            />

            {showGuestHint && !auth.user && (
                <p className="rounded-md bg-warning/15 px-3 py-2 text-sm text-warning-foreground dark:text-warning">
                    {tt('comments.guest_hint', 'Please enter your name and email to comment, or')}{' '}
                    <Link href="/login" className="font-medium underline underline-offset-4">
                        {tt('comments.log_in', 'log in')}
                    </Link>
                    .
                </p>
            )}

            {!auth.user && (
                <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                        <Input
                            placeholder={tt('comments.name', 'Your name')}
                            aria-label={tt('comments.name', 'Your name')}
                            value={data.author_name}
                            onChange={(e) => setData('author_name', e.target.value)}
                            aria-invalid={!!errors.author_name}
                            required
                        />
                        {errors.author_name && <p className="mt-1 text-xs text-destructive">{errors.author_name}</p>}
                    </div>
                    <div>
                        <Input
                            type="email"
                            placeholder={tt('comments.email', 'Your email')}
                            aria-label={tt('comments.email', 'Your email')}
                            value={data.author_email}
                            onChange={(e) => setData('author_email', e.target.value)}
                            aria-invalid={!!errors.author_email}
                            required
                        />
                        {errors.author_email && <p className="mt-1 text-xs text-destructive">{errors.author_email}</p>}
                    </div>
                </div>
            )}

            <div>
                <Textarea
                    rows={isReply ? 3 : 4}
                    placeholder={isReply ? tt('comments.reply_placeholder', 'Write your reply…') : tt('comments.placeholder', 'Write your comment…')}
                    aria-label={isReply ? tt('comments.reply_placeholder', 'Write your reply…') : tt('comments.placeholder', 'Write your comment…')}
                    value={data.content}
                    onChange={(e) => setData('content', e.target.value)}
                    aria-invalid={!!errors.content}
                    required
                />
                {errors.content && <p className="mt-1 text-xs text-destructive">{errors.content}</p>}
            </div>

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                        {tt('comments.cancel', 'Cancel')}
                    </Button>
                )}
                <Button type="submit" size={isReply ? 'sm' : 'default'} disabled={processing}>
                    {processing
                        ? tt('comments.posting', 'Posting…')
                        : isReply
                          ? tt('comments.post_reply', 'Post reply')
                          : tt('comments.post_comment', 'Post comment')}
                </Button>
            </div>
        </form>
    );
}

const Comments: React.FC<CommentsProps> = ({ postId, comments = [], allowComments = true }) => {
    const tt = useThemeT();
    const [replyingTo, setReplyingTo] = useState<number | null>(null);

    const renderComment = (comment: Comment, depth = 0) => (
        <li key={comment.id} className={depth > 0 ? 'mt-5 border-l pl-5' : ''}>
            <div className="flex gap-3">
                <Avatar name={comment.author_name} src={comment.author_avatar} />
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-medium text-foreground">{comment.author_name}</span>
                        <time dateTime={comment.created_at} className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                        </time>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-foreground/90">{comment.content}</p>
                    {allowComments && replyingTo !== comment.id && (
                        <button
                            type="button"
                            onClick={() => setReplyingTo(comment.id)}
                            className="mt-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {tt('comments.reply', 'Reply')}
                        </button>
                    )}
                    {replyingTo === comment.id && (
                        <div className="mt-3">
                            <CommentForm
                                postId={postId}
                                parentId={comment.id}
                                onDone={() => setReplyingTo(null)}
                                onCancel={() => setReplyingTo(null)}
                            />
                        </div>
                    )}
                    {comment.replies && comment.replies.length > 0 && <ul>{comment.replies.map((reply) => renderComment(reply, depth + 1))}</ul>}
                </div>
            </div>
        </li>
    );

    return (
        <section className="mt-16 border-t pt-10" aria-labelledby="comments-heading">
            <h2 id="comments-heading" className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
                <MessageSquare className="size-5 text-muted-foreground" />
                {comments.length === 1
                    ? tt('comments.count_one', '1 comment')
                    : tt('comments.count_other', ':count comments', { count: comments.length })}
            </h2>

            {allowComments && (
                <div className="mt-6 rounded-xl border bg-card p-5 shadow-xs">
                    <h3 className="mb-3 text-sm font-medium text-foreground">{tt('comments.leave', 'Leave a comment')}</h3>
                    <CommentForm postId={postId} />
                </div>
            )}

            {comments.length > 0 ? (
                <ul className="mt-8 space-y-8">{comments.map((comment) => renderComment(comment))}</ul>
            ) : (
                <p className="mt-6 text-sm text-muted-foreground">{tt('comments.empty', 'No comments yet. Be the first to comment!')}</p>
            )}
        </section>
    );
};

export default Comments;
