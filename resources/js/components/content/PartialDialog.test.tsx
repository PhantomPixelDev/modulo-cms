import { ApiError, apiGet, apiPost } from '@/lib/api';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PartialDialog } from './PartialDialog';

const translate = (key: string) => key;
vi.mock('@/hooks/useTranslation', () => ({ useTranslation: () => ({ t: translate }) }));
vi.mock('@inertiajs/react', () => ({ usePage: () => ({ props: { locale: { current: 'en' } } }) }));
vi.mock('@/lib/acl', () => ({ useAcl: () => ({ hasPermission: () => true }) }));
vi.mock('@/lib/api', async (original) => ({ ...(await original<object>()), apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock('@/pages/dashboard/components/posts/SlateEditor', () => ({
    default: ({ initialHTML, onHTMLChange }: { initialHTML: string; onHTMLChange: (value: string) => void }) => (
        <textarea aria-label="Body" defaultValue={initialHTML} onChange={(event) => onHTMLChange(event.target.value)} />
    ),
}));
vi.mock('@/pages/dashboard/components/media/MediaPickerDialog', () => ({
    default: ({ open, onSelect }: { open: boolean; onSelect: (item: { url: string }) => void }) =>
        open ? <button onClick={() => onSelect({ url: '/storage/photo.jpg' })}>Select photo</button> : null,
}));
const catalog = [
    {
        name: 'card',
        label: 'Card',
        description: 'A card',
        body: true,
        defaults: { title: 'Default' },
        fields: [
            { name: 'title', type: 'text', label: 'Title', required: true, help: '', options: [] },
            { name: 'message', type: 'textarea', label: 'Message', required: false, help: '', options: [] },
            { name: 'image', type: 'image', label: 'Image', required: false, help: '', options: [] },
        ],
    },
];
beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiGet).mockResolvedValue({ partialCatalog: catalog });
    vi.mocked(apiPost).mockResolvedValue({ url: '/preview/one' });
});
async function choose() {
    fireEvent.click(await screen.findByRole('button', { name: 'Card' }));
}
describe('partial configuration dialog', () => {
    it('uses typed fields and media selection, retains input on failure, and applies strings', async () => {
        const apply = vi.fn();
        render(<PartialDialog open onOpenChange={vi.fn()} onApply={apply} />);
        await choose();
        fireEvent.change(screen.getByLabelText('Title *'), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: 'dashboard.partials.insert' }));
        expect(apply).not.toHaveBeenCalled();
        fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Saved title' } });
        fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Longer text' } });
        fireEvent.click(screen.getByRole('button', { name: 'dashboard.partials.choose_image' }));
        fireEvent.click(screen.getByRole('button', { name: 'Select photo', hidden: true }));
        vi.mocked(apiPost).mockRejectedValueOnce(new ApiError(422, { errors: { 'attributes.title': ['Server error'] } }));
        fireEvent.click(screen.getByRole('button', { name: 'dashboard.partials.preview' }));
        await screen.findByRole('alert');
        expect(screen.getByLabelText('Title *')).toHaveValue('Saved title');
        expect(screen.getByText('Server error')).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'dashboard.partials.preview' }));
        await waitFor(() => expect(screen.getByTitle('dashboard.partials.preview_title')).toHaveAttribute('src', '/preview/one'));
        fireEvent.click(screen.getByRole('button', { name: 'dashboard.partials.insert' }));
        expect(apply).toHaveBeenCalledWith({
            name: 'card',
            attributes: { title: 'Saved title', message: 'Longer text', image: '/storage/photo.jpg' },
            body: '',
            hasBody: true,
        });
    });
    it('discards preview responses after fields change or the dialog closes', async () => {
        let resolve!: (value: { url: string }) => void;
        vi.mocked(apiPost).mockImplementation(
            () =>
                new Promise((done) => {
                    resolve = done;
                }),
        );
        const { rerender } = render(<PartialDialog open onOpenChange={vi.fn()} />);
        await choose();
        fireEvent.click(screen.getByRole('button', { name: 'dashboard.partials.preview' }));
        fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Changed' } });
        await act(async () => resolve({ url: '/stale' }));
        expect(screen.queryByTitle('dashboard.partials.preview_title')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'dashboard.partials.preview' }));
        rerender(<PartialDialog open={false} onOpenChange={vi.fn()} />);
        await act(async () => resolve({ url: '/closed' }));
        rerender(<PartialDialog open onOpenChange={vi.fn()} />);
        await choose();
        expect(screen.queryByTitle('dashboard.partials.preview_title')).toBeNull();
    });
    it('reports unavailable saved modules and catalog request failures', async () => {
        const initial = { name: 'removed', attributes: {}, body: 'Keep me', hasBody: true };
        const { rerender } = render(<PartialDialog open initial={initial} onOpenChange={vi.fn()} />);
        expect(await screen.findByRole('alert')).toHaveTextContent('dashboard.partials.unavailable');
        rerender(<PartialDialog open={false} onOpenChange={vi.fn()} />);
        vi.mocked(apiGet).mockRejectedValueOnce(new Error('offline'));
        rerender(<PartialDialog open onOpenChange={vi.fn()} />);
        expect(await screen.findByRole('alert')).toHaveTextContent('dashboard.partials.load_failed');
    });
});
