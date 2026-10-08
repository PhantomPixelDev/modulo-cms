import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createContext, lazy, useContext, useState, type ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveThemePartial, type ContentPartial, type ThemePartialProps } from '../../theme-partials';
import ContentRenderer from './ContentRenderer';

vi.mock('../../theme-partials', () => ({ resolveThemePartial: vi.fn() }));
const context = createContext('missing context');
function Interactive({ attributes, children }: ThemePartialProps) {
    const value = useContext(context);
    const [open, setOpen] = useState(false);
    return (
        <section>
            <button onClick={() => setOpen(!open)}>{attributes.title}</button>
            {open && <div>{value}</div>}
            {children}
        </section>
    );
}
const partial: ContentPartial = {
    id: 'uuid-1',
    name: 'test',
    component: 'theme/components/partials/Test.tsx',
    attributes: { title: 'Expand module' },
    html: '<p>Fallback body</p>',
};
function marker(item = partial) {
    return `<div data-modulo-partial="${item.id}"><div data-modulo-fallback>${item.html}</div><div data-modulo-mount></div></div>`;
}
beforeEach(() => vi.mocked(resolveThemePartial).mockReturnValue(Interactive));

describe('content React partials', () => {
    it('keeps regular HTML and plugin attributes intact', () => {
        const { container } = render(<ContentRenderer html='<p>Ordinary text</p><a data-shop-action="add">Cart</a>' />);
        expect(screen.getByText('Ordinary text')).toBeVisible();
        expect(container.querySelector('[data-shop-action]')).toHaveAttribute('data-shop-action', 'add');
        expect(resolveThemePartial).not.toHaveBeenCalled();
    });
    it('mounts interactive components in the existing context and hides duplicate fallback', async () => {
        const { container } = render(
            <context.Provider value="same Inertia tree">
                <ContentRenderer html={marker()} partials={[partial]} />
            </context.Provider>,
        );
        fireEvent.click(await screen.findByRole('button', { name: 'Expand module' }));
        expect(screen.getByText('same Inertia tree')).toBeVisible();
        await waitFor(() => expect(container.querySelector('[data-modulo-fallback]')).toHaveAttribute('hidden'));
        expect(screen.getAllByText('Fallback body').filter((node) => !node.closest('[hidden]'))).toHaveLength(1);
    });
    it('never imports a marker without a matching server descriptor', () => {
        render(<ContentRenderer html={marker()} />);
        expect(screen.getByText('Fallback body')).toBeVisible();
        expect(resolveThemePartial).not.toHaveBeenCalled();
    });
    it('keeps fallback while loading, then replaces it after success', async () => {
        let complete!: (module: { default: ComponentType<ThemePartialProps> }) => void;
        const pending = new Promise<{ default: ComponentType<ThemePartialProps> }>((resolve) => (complete = resolve));
        vi.mocked(resolveThemePartial).mockReturnValue(lazy(() => pending));
        const { container } = render(<ContentRenderer html={marker()} partials={[partial]} />);
        expect(screen.getByText('Fallback body')).toBeVisible();
        expect(container.querySelector('[data-modulo-fallback]')).not.toHaveAttribute('hidden');
        await act(async () => complete({ default: Interactive }));
        expect(await screen.findByRole('button', { name: 'Expand module' })).toBeVisible();
        expect(container.querySelector('[data-modulo-fallback]')).toHaveAttribute('hidden');
    });
    it.each(['unknown', 'throws', 'load fails'])('keeps fallback when the component %s', async (failure) => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Broken = () => {
            throw new Error('broken module');
        };
        vi.mocked(resolveThemePartial).mockReturnValue(
            failure === 'unknown' ? null : failure === 'throws' ? Broken : lazy(() => Promise.reject(new Error('chunk unavailable'))),
        );
        const { container } = render(<ContentRenderer html={marker()} partials={[partial]} />);
        if (failure !== 'unknown') await waitFor(() => expect(console.warn).toHaveBeenCalled());
        expect(screen.getByText('Fallback body')).toBeVisible();
        expect(container.querySelector('[data-modulo-fallback]')).not.toHaveAttribute('hidden');
    });
    it('mounts nested modules once in visible parent content', async () => {
        const inner = { ...partial, id: 'uuid-2', attributes: { title: 'Inner module' } };
        const outer = { ...partial, html: marker(inner) };
        render(<ContentRenderer html={marker(outer)} partials={[inner, outer]} />);
        expect(await screen.findByRole('button', { name: 'Inner module' })).toBeVisible();
        expect(screen.getAllByRole('button')).toHaveLength(2);
    });
    it('unmounts islands and resets state when navigating', async () => {
        const { rerender } = render(<ContentRenderer html={marker()} partials={[partial]} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Expand module' }));
        expect(screen.getByText('missing context')).toBeVisible();
        rerender(<ContentRenderer html="<p>Another page</p>" />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        rerender(<ContentRenderer html={marker()} partials={[partial]} />);
        expect(await screen.findByRole('button', { name: 'Expand module' })).toBeVisible();
        expect(screen.queryByText('missing context')).not.toBeInTheDocument();
    });
});
