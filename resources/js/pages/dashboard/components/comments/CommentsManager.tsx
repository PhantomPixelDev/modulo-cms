import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router } from '@inertiajs/react';
import { Check, ShieldAlert, Trash2, Undo2 } from 'lucide-react';
import type { AdminComment, CommentCounts, CommentStatus, Paginated } from '../../types';

interface CommentsManagerProps {
    comments?: Paginated<AdminComment>;
    counts?: CommentCounts;
    filter?: CommentStatus | null;
    moderation?: boolean;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}

const BASE = '/dashboard/admin/comments';
const FILTERS: Array<CommentStatus | null> = [null, 'pending', 'approved', 'spam'];

const statusVariant: Record<CommentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    approved: 'secondary',
    pending: 'outline',
    spam: 'destructive',
};

export function CommentsManager({ comments, counts, filter = null, moderation = false, t }: CommentsManagerProps) {
    const rows = comments?.data ?? [];
    const keepPosition = { preserveScroll: true, preserveState: true };

    const setStatus = (comment: AdminComment, status: CommentStatus) => router.patch(`${BASE}/${comment.id}`, { status }, keepPosition);

    const remove = (comment: AdminComment) => {
        if (!window.confirm(t('dashboard.comments.confirm_delete'))) return;
        router.delete(`${BASE}/${comment.id}`, keepPosition);
    };

    const toggleModeration = (enabled: boolean) => router.put(`${BASE}/settings`, { comment_moderation: enabled }, keepPosition);

    const visit = (status: CommentStatus | null, page?: number) =>
        router.get(BASE, { ...(status ? { status } : {}), ...(page ? { page } : {}) }, { preserveScroll: true });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((status) => (
                        <Button key={status ?? 'all'} size="sm" variant={filter === status ? 'default' : 'outline'} onClick={() => visit(status)}>
                            {t(`dashboard.comments.filters.${status ?? 'all'}`)} ({counts?.[status ?? 'all'] ?? 0})
                        </Button>
                    ))}
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <Switch checked={moderation} onCheckedChange={toggleModeration} />
                    {t('dashboard.comments.hold_for_approval')}
                </label>
            </div>

            {rows.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">{t('dashboard.comments.empty')}</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('dashboard.comments.columns.author')}</TableHead>
                            <TableHead>{t('dashboard.comments.columns.comment')}</TableHead>
                            <TableHead>{t('dashboard.comments.columns.post')}</TableHead>
                            <TableHead>{t('dashboard.comments.columns.status')}</TableHead>
                            <TableHead className="text-right">{t('dashboard.comments.columns.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((comment) => (
                            <TableRow key={comment.id}>
                                <TableCell className="align-top">
                                    <div className="font-medium">{comment.author_name}</div>
                                    <div className="text-xs text-muted-foreground">{comment.author_email}</div>
                                    {comment.created_at && (
                                        <div className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</div>
                                    )}
                                </TableCell>
                                <TableCell className="max-w-md align-top text-sm whitespace-normal">
                                    {comment.is_reply && (
                                        <Badge variant="outline" className="mr-1">
                                            {t('dashboard.comments.reply')}
                                        </Badge>
                                    )}
                                    <span title={comment.content}>{comment.excerpt}</span>
                                </TableCell>
                                <TableCell className="align-top text-sm">{comment.post?.title ?? '—'}</TableCell>
                                <TableCell className="align-top">
                                    <Badge variant={statusVariant[comment.status]}>{t(`dashboard.comments.filters.${comment.status}`)}</Badge>
                                </TableCell>
                                <TableCell className="align-top">
                                    <div className="flex justify-end gap-1">
                                        {comment.status !== 'approved' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setStatus(comment, 'approved')}
                                                title={t('dashboard.comments.actions.approve')}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {comment.status === 'approved' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setStatus(comment, 'pending')}
                                                title={t('dashboard.comments.actions.unapprove')}
                                            >
                                                <Undo2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {comment.status !== 'spam' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setStatus(comment, 'spam')}
                                                title={t('dashboard.comments.actions.spam')}
                                            >
                                                <ShieldAlert className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => remove(comment)}
                                            title={t('dashboard.comments.actions.delete')}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {comments && comments.last_page > 1 && (
                <div className="flex items-center justify-end gap-2 text-sm">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={comments.current_page <= 1}
                        onClick={() => visit(filter, comments.current_page - 1)}
                    >
                        ‹
                    </Button>
                    <span>
                        {comments.current_page} / {comments.last_page}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={comments.current_page >= comments.last_page}
                        onClick={() => visit(filter, comments.current_page + 1)}
                    >
                        ›
                    </Button>
                </div>
            )}
        </div>
    );
}
