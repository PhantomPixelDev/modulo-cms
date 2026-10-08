import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Partials, { PartialCard } from './Index';

vi.mock('@/hooks/useTranslation', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/layouts/admin-layout', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
const partial = { name: 'callout', label: 'Callout', description: 'Useful information', body: true, defaults: { tone: 'info' } };

describe('partial catalog', () => {
    it('copies the displayed snippet and confirms only after clipboard success', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
        render(<PartialCard partial={partial} />);
        fireEvent.click(screen.getByRole('button', { name: 'dashboard.partials.copy' }));
        await waitFor(() => expect(screen.getByRole('button', { name: 'dashboard.partials.copied' })).toBeVisible());
        expect(writeText).toHaveBeenCalledWith((screen.getByRole('textbox') as HTMLTextAreaElement).value);
    });
    it('selects the snippet for manual copying when clipboard access fails', async () => {
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } });
        render(<PartialCard partial={partial} />);
        fireEvent.click(screen.getByRole('button', { name: 'dashboard.partials.copy' }));
        await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('dashboard.partials.copy_failed'));
        const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textarea).toHaveFocus();
        expect(textarea.selectionStart).toBe(0);
        expect(textarea.selectionEnd).toBe(textarea.value.length);
    });
    it('searches modules and displays an empty result', () => {
        render(<Partials partialCatalog={[partial]} themeName="Modern React" />);
        fireEvent.change(screen.getByRole('textbox', { name: 'dashboard.partials.search' }), { target: { value: 'missing' } });
        expect(screen.getByText('dashboard.partials.no_results')).toBeVisible();
        expect(screen.queryByText('Callout')).not.toBeInTheDocument();
    });
});
