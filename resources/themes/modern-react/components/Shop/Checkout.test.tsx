import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Checkout from './Checkout';

vi.mock('../Layout', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('@inertiajs/react', () => ({ Link: ({ children }: { children: ReactNode }) => <span>{children}</span> }));

describe('checkout submission', () => {
    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
    });

    const cart = { items: [], item_count: 1, subtotal: 10, currency: 'USD', is_empty: false };
    const methods = [{ id: 'cod', label: 'Cash', description: '', online: false }];

    it('offers shopping instead of submitting an empty cart', () => {
        render(<Checkout cart={{ ...cart, is_empty: true }} />);
        expect(screen.getByText('Your cart is empty')).toBeVisible();
        expect(screen.getByText('Continue Shopping')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Place Order' })).toBeNull();
    });

    it('disables checkout when no payment method is configured', () => {
        render(<Checkout cart={cart} />);
        expect(screen.getByText('No payment methods are available right now. Please contact us.')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Place Order' })).toBeDisabled();
    });

    it.each([
        [{ errors: { cart: ['Stock changed.'] } }, 'Stock changed.'],
        [{ errors: { coupon: 'Coupon expired.' } }, 'Coupon expired.'],
        [{ errors: { general: 'Please try again.', cart: ['Stock changed.'], coupon: ['Coupon expired.'] } }, 'Please try again.'],
        [{ error: 'Payments unavailable.' }, 'Payments unavailable.'],
        [{}, 'Failed to process order'],
    ])('shows server failures and permits a corrected retry: %j', async (body, message) => {
        const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 422 }));
        vi.stubGlobal('fetch', request);
        const { container } = render(<Checkout cart={cart} payment_methods={methods} />);
        await act(async () => fireEvent.submit(container.querySelector('form')!));
        expect(screen.getByText(message)).toBeVisible();
        expect(screen.getByRole('button', { name: 'Place Order' })).not.toBeDisabled();
        request.mockRejectedValueOnce(new Error('offline'));
        await act(async () => fireEvent.submit(container.querySelector('form')!));
        expect(screen.queryByText(message)).toBeNull();
        expect(screen.getByText('An error occurred. Please try again.')).toBeVisible();
        expect(request).toHaveBeenCalledTimes(2);
    });

    it('retains saved addresses and submits changes, a separate delivery address and accepted terms', async () => {
        const request = vi
            .fn()
            .mockResolvedValue(
                new Response(JSON.stringify({ errors: { payment_method: ['Choose a method.'], accept_terms: ['Accept terms.'] } }), { status: 422 }),
            );
        vi.stubGlobal('fetch', request);
        const { container } = render(
            <Checkout
                cart={{
                    ...cart,
                    items: [
                        { product_id: 1, product_name: 'Mug', variant_name: 'Sand', product_image: '/mug.jpg', price: 10, quantity: 1, subtotal: 10 },
                        { product_id: 2, product_name: 'Notebook', price: 0, quantity: 1, subtotal: 0 },
                    ],
                }}
                user={{ name: 'Ada', email: 'ada@example.test' }}
                countries={{ US: 'United States', DE: 'Germany' }}
                saved_address={{ billing_address_1: 'Saved street', billing_country: 'DE', customer_phone: null, ship_to_different: false }}
                payment_methods={[...methods, { id: 'stripe', label: 'Card', description: 'Secure card payment', online: true }]}
                terms_url="/terms"
            />,
        );
        expect(container.querySelector('[name="customer_name"]')).toHaveValue('Ada');
        expect(container.querySelector('[name="billing_address_1"]')).toHaveValue('Saved street');
        expect(container.querySelector('[name="billing_country"]')).toHaveValue('DE');
        expect(screen.getByRole('img', { name: 'Mug' })).toHaveAttribute('src', '/mug.jpg');
        expect(screen.getByText('Sand')).toBeVisible();
        fireEvent.click(container.querySelector('[name="ship_to_different"]')!);
        fireEvent.change(container.querySelector('[name="shipping_address_1"]')!, { target: { value: 'Delivery street' } });
        fireEvent.change(container.querySelector('[name="customer_note"]')!, { target: { value: 'Ring once' } });
        fireEvent.click(container.querySelector('[name="payment_method"][value="stripe"]')!);
        fireEvent.click(screen.getByRole('checkbox', { name: /I have read and accept/ }));
        expect(screen.getByRole('button', { name: 'Continue to payment' })).toBeVisible();
        await act(async () => fireEvent.submit(container.querySelector('form')!));
        expect(JSON.parse(request.mock.calls[0][1].body)).toMatchObject({
            customer_name: 'Ada',
            billing_country: 'DE',
            shipping_address_1: 'Delivery street',
            ship_to_different: true,
            payment_method: 'stripe',
            customer_note: 'Ring once',
            accept_terms: true,
        });
        expect(screen.getByText('Choose a method.')).toBeVisible();
        expect(screen.getByText('Accept terms.')).toBeVisible();
    });

    it('updates shipping totals and keeps the current choice when the next request fails', async () => {
        const totals = {
            subtotal: 10,
            discount: 0,
            shipping: 0,
            tax: 0,
            total: 10,
            currency: 'USD',
            shipping_method: 'collect',
            shipping_methods: [
                { id: 'collect', name: 'Collect', price: 0, cost: 0, free_over: null },
                { id: 'courier', name: 'Courier', price: 5, cost: 5, free_over: 50 },
            ],
        };
        let finish = (_response: Response) => {};
        const request = vi.fn().mockReturnValue(
            new Promise<Response>((resolve) => {
                finish = resolve;
            }),
        );
        vi.stubGlobal('fetch', request);
        render(<Checkout cart={cart} payment_methods={methods} totals={totals} />);
        fireEvent.click(screen.getByRole('radio', { name: /Courier/ }));
        expect(screen.getByRole('radio', { name: /Collect/ })).toBeDisabled();
        expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ shipping_method: 'courier' });
        await act(async () =>
            finish(
                new Response(
                    JSON.stringify({ totals: { ...totals, shipping_method: 'courier', shipping_method_name: 'Courier', shipping: 5, total: 15 } }),
                ),
            ),
        );
        expect(screen.getByRole('radio', { name: /Courier/ })).toBeChecked();
        expect(screen.getByText('Shipping (Courier)')).toBeVisible();
        expect(screen.getByText('$15.00')).toBeVisible();
        request.mockRejectedValueOnce(new Error('offline'));
        fireEvent.click(screen.getByRole('radio', { name: /Collect/ }));
        await waitFor(() => expect(screen.getByText('Could not update shipping. Please try again.')).toBeVisible());
        expect(screen.getByRole('radio', { name: /Courier/ })).toBeChecked();
        expect(screen.getByRole('radio', { name: /Collect/ })).not.toBeDisabled();
    });
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
