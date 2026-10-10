import { router } from '@inertiajs/react';
import { describe, expect, it, vi } from 'vitest';
import { datetimeInZone, initialEditorState, serializeEditor, submitEditor } from './editor';

vi.mock('@inertiajs/react', () => ({ router: { post: vi.fn(), put: vi.fn() } }));

describe('shared editor contracts', () => {
    it('formats scheduling dates in the site timezone through daylight saving time', () => {
        expect(datetimeInZone('2030-07-10T13:30:00Z', 'Europe/Berlin')).toBe('2030-07-10T15:30');
        expect(datetimeInZone('2030-01-10T13:30:00Z', 'Europe/Berlin')).toBe('2030-01-10T14:30');
    });

    it('preserves hierarchy taxonomies media and custom fields in the typed payload', () => {
        const state = initialEditorState(
            { title: 'A title', parent_id: 2, author_id: 3, selected_terms: [4], featured_image: '/media/picture.jpg' },
            'UTC',
        );
        const payload = serializeEditor(state, { price: 5, featured: false });
        expect(payload).toMatchObject({
            slug: 'a-title',
            parent_id: 2,
            author_id: 3,
            taxonomy_terms: [4],
            featured_image: '/media/picture.jpg',
            meta_data: { fields: { price: 5, featured: false } },
        });
    });

    it('waits until the Inertia request finishes and distinguishes failed validation', async () => {
        const payload = { ...serializeEditor(initialEditorState(undefined, 'UTC'), {}), editor_action: 'draft' as const, locale: 'en' };
        const pending = submitEditor('/save', 'post', payload);
        const options = vi.mocked(router.post).mock.calls.at(-1)?.[2];
        let settled = false;
        void pending.then(() => {
            settled = true;
        });
        await Promise.resolve();
        expect(settled).toBe(false);
        options?.onFinish?.({} as Parameters<NonNullable<typeof options.onFinish>>[0]);
        await expect(pending).resolves.toBe(false);
    });
});
