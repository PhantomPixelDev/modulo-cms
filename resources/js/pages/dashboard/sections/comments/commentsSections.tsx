import type { ReactNode } from 'react';
import { CommentsManager } from '../../components/comments/CommentsManager';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import type { AdminComment, CommentCounts, CommentStatus, Paginated } from '../../types';

export function getCommentsSections({
    comments,
    commentCounts,
    commentFilter,
    commentModeration,
    t,
}: {
    comments?: Paginated<AdminComment>;
    commentCounts?: CommentCounts;
    commentFilter?: CommentStatus | null;
    commentModeration?: boolean;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
    const renderComments = () => (
        <SectionWrapper title={t('dashboard.comments.title')} description={t('dashboard.comments.description')}>
            <CommentsManager comments={comments} counts={commentCounts} filter={commentFilter} moderation={commentModeration} t={t} />
        </SectionWrapper>
    );

    return {
        comments: renderComments,
    };
}
