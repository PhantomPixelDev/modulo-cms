import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { ROUTE } from '../../routes';
import type { ShopOrder } from '../../types';

interface OrderItem {
    id: number;
    product_name: string;
    product_sku?: string;
    price: number;
    quantity: number;
    subtotal: number;
}

interface OrderNote {
    id: number;
    type: 'note' | 'status' | 'payment' | 'system';
    message: string;
    customer_notified: boolean;
    author: string | null;
    created_at: string | null;
}

interface PaymentAttempt {
    id: number;
    gateway: string;
    provider_ref: string | null;
    status: string;
    amount: number;
    currency: string;
    created_at: string | null;
}

type Address = { address_1?: string; address_2?: string; city?: string; state?: string; postcode?: string; country?: string };

interface ShopOrderDetail extends ShopOrder {
    subtotal?: number;
    discount?: number;
    shipping?: number;
    tax?: number;
    payment_method?: string;
    transaction_id?: string | null;
    paid_at?: string | null;
    shipping_method?: string | null;
    tracking_number?: string | null;
    coupon_code?: string | null;
    customer_phone?: string;
    billing_address?: Address;
    shipping_address?: Address;
    customer_note?: string;
    admin_note?: string;
    items?: OrderItem[];
    notes?: OrderNote[];
    payments?: PaymentAttempt[];
    can_refund?: boolean;
    refunds_online?: boolean;
}

interface ShopOrderViewProps {
    order?: ShopOrderDetail;
    canManage: boolean;
}

const STATUSES = [
    ['pending', 'Pending'],
    ['processing', 'Processing'],
    ['shipped', 'Shipped'],
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
    ['refunded', 'Refunded'],
] as const;

const PAYMENT_STATUSES = [
    ['pending', 'Pending'],
    ['paid', 'Paid'],
    ['failed', 'Failed'],
    ['refunded', 'Refunded'],
] as const;

const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '');

export function ShopOrderView({ order, canManage }: ShopOrderViewProps) {
    const { success: showSuccess, error: showError } = useAdminToast();
    const [status, setStatus] = useState(order?.status ?? 'pending');
    const [paymentStatus, setPaymentStatus] = useState(order?.payment_status ?? 'pending');
    const [tracking, setTracking] = useState(order?.tracking_number ?? '');
    const [saving, setSaving] = useState(false);
    const [note, setNote] = useState('');
    const [notify, setNotify] = useState(false);
    const [addingNote, setAddingNote] = useState(false);

    const formatPrice = (price?: number, currency = 'USD') => {
        const value = typeof price === 'number' ? price : 0;
        const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
        return `${symbols[currency] ?? currency + ' '}${value.toFixed(2)}`;
    };

    const formatAddress = (address?: Address) => {
        if (!address) return '—';
        return [
            address.address_1,
            address.address_2,
            `${address.city || ''}${address.state ? `, ${address.state}` : ''} ${address.postcode || ''}`.trim(),
            address.country,
        ]
            .filter(Boolean)
            .join(', ');
    };

    if (!order) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Order not found</CardTitle>
                    <CardDescription>The requested order could not be loaded.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button variant="outline" onClick={() => router.visit(ROUTE.shop.orders.index())}>
                        Back to Orders
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    const dirty = status !== order.status || paymentStatus !== order.payment_status || tracking !== (order.tracking_number ?? '');

    const save = () => {
        setSaving(true);
        router.put(
            ROUTE.shop.orders.update(order.id),
            { status, payment_status: paymentStatus, tracking_number: tracking || null },
            {
                preserveScroll: true,
                onError: (errors) => showError(Object.values(errors)[0] ?? 'Could not update the order'),
                onFinish: () => setSaving(false),
            },
        );
    };

    const addNote = () => {
        setAddingNote(true);
        router.post(
            ROUTE.shop.orders.notes(order.id),
            { message: note, notify_customer: notify },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNote('');
                    setNotify(false);
                },
                onError: () => showError('Could not add the note'),
                onFinish: () => setAddingNote(false),
            },
        );
    };

    const refund = () => {
        const how = order.refunds_online
            ? 'The money is refunded at the payment provider.'
            : 'This only marks the order as refunded; send the money back yourself.';
        if (confirm(`Refund ${formatPrice(order.total, order.currency)} for order ${order.order_number}? ${how}`)) {
            router.post(ROUTE.shop.orders.refund(order.id), {}, { preserveScroll: true, onSuccess: () => showSuccess('Refund recorded') });
        }
    };

    const notes = [
        ...(order.admin_note
            ? [{ id: 0, type: 'note', message: order.admin_note, customer_notified: false, author: null, created_at: null } as OrderNote]
            : []),
        ...(order.notes ?? []),
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Order {order.order_number}</CardTitle>
                        <CardDescription>
                            Placed by {order.customer_name} on {formatDate(order.created_at)}
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{order.status_label}</Badge>
                        <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>{order.payment_status_label}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-1">
                        <Label htmlFor="order-status">Status</Label>
                        <Select value={status} onValueChange={setStatus} disabled={!canManage}>
                            <SelectTrigger id="order-status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUSES.map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Shipped, completed and cancelled email the customer.</p>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="order-payment">Payment</Label>
                        <Select value={paymentStatus} onValueChange={setPaymentStatus} disabled={!canManage}>
                            <SelectTrigger id="order-payment">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_STATUSES.map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Online payments update this by themselves.</p>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="order-tracking">Tracking number</Label>
                        <Input id="order-tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} disabled={!canManage} />
                    </div>
                </CardContent>
                {canManage && (
                    <CardFooter className="flex flex-wrap justify-between gap-2">
                        <div>
                            {order.can_refund && (
                                <Button variant="destructive" onClick={refund}>
                                    Refund {formatPrice(order.total, order.currency)}
                                </Button>
                            )}
                        </div>
                        <Button onClick={save} disabled={!dirty || saving}>
                            {saving ? 'Saving…' : 'Save changes'}
                        </Button>
                    </CardFooter>
                )}
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(order.items ?? []).map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.product_name}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.product_sku || '—'}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatPrice(item.price, order.currency)}</TableCell>
                                        <TableCell className="text-right">{formatPrice(item.subtotal, order.currency)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <dl className="mt-4 ml-auto grid max-w-xs grid-cols-2 gap-x-6 gap-y-1 text-sm">
                            <dt className="text-muted-foreground">Subtotal</dt>
                            <dd className="text-right">{formatPrice(order.subtotal, order.currency)}</dd>
                            {(order.discount ?? 0) > 0 && (
                                <>
                                    <dt className="text-muted-foreground">Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</dt>
                                    <dd className="text-right">-{formatPrice(order.discount, order.currency)}</dd>
                                </>
                            )}
                            <dt className="text-muted-foreground">Shipping{order.shipping_method ? ` (${order.shipping_method})` : ''}</dt>
                            <dd className="text-right">{formatPrice(order.shipping, order.currency)}</dd>
                            <dt className="text-muted-foreground">Tax</dt>
                            <dd className="text-right">{formatPrice(order.tax, order.currency)}</dd>
                            <dt className="font-medium">Total</dt>
                            <dd className="text-right font-semibold">{formatPrice(order.total, order.currency)}</dd>
                        </dl>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Customer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div>
                            <div className="font-medium">{order.customer_name}</div>
                            <a className="text-muted-foreground underline" href={`mailto:${order.customer_email}`}>
                                {order.customer_email}
                            </a>
                            {order.customer_phone && <div className="text-muted-foreground">{order.customer_phone}</div>}
                        </div>
                        <div>
                            <div className="text-muted-foreground">Billing address</div>
                            <div>{formatAddress(order.billing_address)}</div>
                        </div>
                        <div>
                            <div className="text-muted-foreground">Shipping address</div>
                            <div>{formatAddress(order.shipping_address)}</div>
                        </div>
                        {order.customer_note && (
                            <div>
                                <div className="text-muted-foreground">Customer note</div>
                                <div className="whitespace-pre-line">{order.customer_note}</div>
                            </div>
                        )}
                        <div>
                            <div className="text-muted-foreground">Payment method</div>
                            <div>{order.payment_method ?? '—'}</div>
                            {order.transaction_id && <div className="font-mono text-xs text-muted-foreground">{order.transaction_id}</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {(order.payments?.length ?? 0) > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Payment attempts</CardTitle>
                        <CardDescription>Every time the customer was sent to a payment provider.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>When</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Reference</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.payments!.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell>{formatDate(p.created_at)}</TableCell>
                                        <TableCell>{p.gateway}</TableCell>
                                        <TableCell className="font-mono text-xs">{p.provider_ref}</TableCell>
                                        <TableCell>
                                            <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>{p.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatPrice(p.amount, p.currency)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                    <CardDescription>Notes from staff, status changes and payment events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {notes.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
                    <ol className="space-y-3">
                        {notes.map((n) => (
                            <li key={`${n.id}-${n.created_at}`} className={`rounded-md border p-3 text-sm ${n.type === 'note' ? 'bg-muted/40' : ''}`}>
                                <div className="whitespace-pre-line">{n.message}</div>
                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {n.created_at && <span>{formatDate(n.created_at)}</span>}
                                    {n.author && <span>by {n.author}</span>}
                                    {n.type !== 'note' && <span>· {n.type}</span>}
                                    {n.customer_notified && <span>· emailed to customer</span>}
                                </div>
                            </li>
                        ))}
                    </ol>

                    {canManage && (
                        <div className="space-y-2 border-t pt-4">
                            <Label htmlFor="order-note">Add a note</Label>
                            <Textarea id="order-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                            <div className="flex items-center justify-between gap-4">
                                <label className="flex items-center gap-2 text-sm">
                                    <Checkbox checked={notify} onCheckedChange={(checked) => setNotify(checked === true)} />
                                    Email this note to the customer
                                </label>
                                <Button onClick={addNote} disabled={addingNote || note.trim() === ''}>
                                    {addingNote ? 'Adding…' : 'Add note'}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
