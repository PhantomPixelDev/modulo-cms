import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { lazySections } from './lazySections';

describe('dashboard section loading', () => {
    it('loads only the selected screen and keeps its context current', async () => {
        const loadPosts = vi.fn(async () => (context: { title: string }) => ({ posts: () => <div>{context.title}</div> }));
        const loadMedia = vi.fn(async () => () => ({ media: () => <div>Media library</div> }));
        const posts = lazySections(['posts'], loadPosts);
        const media = lazySections(['media'], loadMedia);
        const sections = { ...posts({ title: 'First title' }), ...media({}) };
        expect(loadPosts).not.toHaveBeenCalled();
        expect(loadMedia).not.toHaveBeenCalled();

        const view = render(<Suspense fallback={<div>Loading</div>}>{sections.posts()}</Suspense>);
        await screen.findByText('First title');
        expect(loadPosts).toHaveBeenCalledTimes(1);
        expect(loadMedia).not.toHaveBeenCalled();

        view.rerender(<Suspense fallback={<div>Loading</div>}>{posts({ title: 'Saved title' }).posts()}</Suspense>);
        await screen.findByText('Saved title');
        expect(loadPosts).toHaveBeenCalledTimes(1);

        view.rerender(<Suspense fallback={<div>Loading</div>}>{media({}).media()}</Suspense>);
        await screen.findByText('Media library');
        expect(loadMedia).toHaveBeenCalledTimes(1);
    });
});
