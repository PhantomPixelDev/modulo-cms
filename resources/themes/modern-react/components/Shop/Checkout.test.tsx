import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Checkout from './Checkout';

vi.mock('../Layout', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@inertiajs/react', () => ({ Link: ({ children }: { children: ReactNode }) => <span>{children}</span> }));

describe('checkout submission', () => {
    it('serializes delayed submissions and unlocks the form after validation errors', async () => {
        let finish = (_response: Response) => {};
        const pending = new Promise<Response>((resolve) => {
            finish = resolve;
        });
        const request = vi.fn().mockReturnValue(pending);
        vi.stubGlobal('fetch', request);
        try {
            const { container } = render(
                <Checkout
                    checkout_key="1b65884c-36c2-4f2f-a5a1-943cb5f17cf8"
                    cart={{ items: [], item_count: 1, subtotal: 10, currency: 'USD', is_empty: false }}
                    payment_methods={[{ id: 'cod', label: 'Cash', description: '', online: false }]}
                />,
            );
            const form = container.querySelector('form')!;
            fireEvent.submit(form);
            fireEvent.submit(form);
            fireEvent.submit(form);
            expect(request).toHaveBeenCalledTimes(1);
            expect(container.querySelector('button[type="submit"]')).toBeDisabled();
            expect(JSON.parse(request.mock.calls[0][1].body).checkout_key).toBe('1b65884c-36c2-4f2f-a5a1-943cb5f17cf8');
            await act(async () => finish(new Response(JSON.stringify({ errors: { customer_name: ['Please enter your name.'] } }), { status: 422 })));
            expect(screen.getByText('Please enter your name.')).toBeVisible();
            expect(container.querySelector('button[type="submit"]')).not.toBeDisabled();
        } finally {
            vi.unstubAllGlobals();
        }
    });
});
