import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminComment, CommentCounts, Paginated } from '../../types';
import { CommentsManager } from './CommentsManager';

const router = vi.hoisted(() => ({
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({ router }));

const t = (key: string) => key;

function comment(overrides: Partial<AdminComment> = {}): AdminComment {
    return {
        id: 1,
        author_name: 'Visitor',
        author_email: 'visitor@example.com',
        content: 'Nice post',
        excerpt: 'Nice post',
        status: 'pending',
        is_reply: false,
        ip_address: '127.0.0.1',
        created_at: '2026-01-01T10:00:00+00:00',
        post: { id: 5, title: 'Hello world', slug: 'hello-world' },
        ...overrides,
    };
}

function renderManager(comments: AdminComment[], counts?: Partial<CommentCounts>) {
    const paginated: Paginated<AdminComment> = {
        data: comments,
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: comments.length,
    };

    return render(
        <CommentsManager
            comments={paginated}
            counts={{ all: comments.length, pending: 1, approved: 0, spam: 0, ...counts }}
            filter={null}
            moderation={false}
            t={t}
        />,
    );
}

describe('CommentsManager', () => {
    beforeEach(() => {
        router.get.mockReset();
        router.put.mockReset();
        router.patch.mockReset();
        router.delete.mockReset();
    });

    it('lists comments with the post they belong to', () => {
        renderManager([comment()]);

        expect(screen.getByText('Visitor')).toBeInTheDocument();
        expect(screen.getByText('Nice post')).toBeInTheDocument();
        expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('shows an empty state when there is nothing to moderate', () => {
        renderManager([]);

        expect(screen.getByText('dashboard.comments.empty')).toBeInTheDocument();
    });

    it('approves a pending comment', async () => {
        renderManager([comment({ status: 'pending' })]);

        await userEvent.click(screen.getByTitle('dashboard.comments.actions.approve'));

        expect(router.patch).toHaveBeenCalledWith('/dashboard/admin/comments/1', { status: 'approved' }, expect.anything());
    });

    it('offers unapprove instead of approve for approved comments', async () => {
        renderManager([comment({ status: 'approved' })]);

        expect(screen.queryByTitle('dashboard.comments.actions.approve')).not.toBeInTheDocument();
        await userEvent.click(screen.getByTitle('dashboard.comments.actions.unapprove'));

        expect(router.patch).toHaveBeenCalledWith('/dashboard/admin/comments/1', { status: 'pending' }, expect.anything());
    });

    it('asks before deleting and deletes on confirmation', async () => {
        renderManager([comment()]);
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

        await userEvent.click(screen.getByTitle('dashboard.comments.actions.delete'));
        expect(router.delete).not.toHaveBeenCalled();

        confirmSpy.mockReturnValue(true);
        await userEvent.click(screen.getByTitle('dashboard.comments.actions.delete'));
        expect(router.delete).toHaveBeenCalledWith('/dashboard/admin/comments/1', expect.anything());
    });

    it('toggles the hold-for-approval setting', async () => {
        renderManager([comment()]);

        await userEvent.click(screen.getByRole('switch'));

        expect(router.put).toHaveBeenCalledWith('/dashboard/admin/comments/settings', { comment_moderation: true }, expect.anything());
    });

    it('filters by status', async () => {
        renderManager([comment()]);

        await userEvent.click(screen.getByRole('button', { name: /dashboard\.comments\.filters\.spam/ }));

        expect(router.get).toHaveBeenCalledWith('/dashboard/admin/comments', { status: 'spam' }, expect.anything());
    });
});
