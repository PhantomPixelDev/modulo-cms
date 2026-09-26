import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, EmptyState, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow, useAdminToast } from '@modulo/ui';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ROUTE } from '../routes';
import type { Paginated, ShopCoupon } from '../types';

type CouponForm = {
    code: string;
    description: string;
    type: ShopCoupon['type'];
    amount: string;
    min_subtotal: string;
    starts_at: string;
    expires_at: string;
    usage_limit: string;
    is_active: boolean;
};

const emptyForm: CouponForm = {
    code: '',
    description: '',
    type: 'percent',
    amount: '10',
    min_subtotal: '',
    starts_at: '',
    expires_at: '',
    usage_limit: '',
    is_active: true,
};

const toInputDate = (value?: string | null) => (value ? value.slice(0, 10) : '');

function describe(coupon: ShopCoupon): string {
    if (coupon.type === 'percent') return `${coupon.amount}% off`;
    if (coupon.type === 'fixed') return `${coupon.amount.toFixed(2)} off`;
    return 'Free shipping';
}

export function ShopCouponsManager({ coupons, canManage }: { coupons?: Paginated<ShopCoupon>; canManage: boolean }) {
    const { success: showSuccess, error: showError } = useAdminToast();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ShopCoupon | null>(null);
    const [form, setForm] = useState<CouponForm>(emptyForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const rows = coupons?.data ?? [];

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setOpen(true);
    };

    const openEdit = (coupon: ShopCoupon) => {
        setEditing(coupon);
        setForm({
            code: coupon.code,
            description: coupon.description ?? '',
            type: coupon.type,
            amount: String(coupon.amount ?? ''),
            min_subtotal: coupon.min_subtotal === null ? '' : String(coupon.min_subtotal),
            starts_at: toInputDate(coupon.starts_at),
            expires_at: toInputDate(coupon.expires_at),
            usage_limit: coupon.usage_limit === null ? '' : String(coupon.usage_limit),
            is_active: coupon.is_active,
        });
        setErrors({});
        setOpen(true);
    };

    const save = () => {
        setSaving(true);
        const payload = {
            code: form.code,
            description: form.description || null,
            type: form.type,
            amount: form.type === 'free_shipping' ? 0 : Number(form.amount),
            min_subtotal: form.min_subtotal === '' ? null : Number(form.min_subtotal),
            starts_at: form.starts_at || null,
            expires_at: form.expires_at || null,
            usage_limit: form.usage_limit === '' ? null : Number(form.usage_limit),
            is_active: form.is_active,
        };
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                showSuccess(editing ? 'Coupon updated' : 'Coupon created');
                setOpen(false);
            },
            onError: (e: Record<string, string>) => {
                setErrors(e);
                showError('Please check the coupon details');
            },
            onFinish: () => setSaving(false),
        };

        if (editing) {
            router.put(ROUTE.shop.coupons.update(editing.id), payload, options);
        } else {
            router.post(ROUTE.shop.coupons.store(), payload, options);
        }
    };

    const remove = (coupon: ShopCoupon) => {
        if (!confirm(`Delete coupon ${coupon.code}? Orders that used it keep the code.`)) return;
        router.delete(ROUTE.shop.coupons.destroy(coupon.id), {
            preserveScroll: true,
            onSuccess: () => showSuccess('Coupon deleted'),
            onError: () => showError('Could not delete the coupon'),
        });
    };

    const field = (key: keyof CouponForm) => (errors[key] ? <p className="text-xs text-destructive">{errors[key]}</p> : null);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {canManage && (
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        New coupon
                    </Button>
                )}
            </div>

            {rows.length === 0 ? (
                <EmptyState title="No coupons yet" description="Create a code customers can enter in their cart for a discount or free shipping." />
            ) : (
                <TableContainer>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Used</TableHead>
                                <TableHead>Valid</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((coupon) => (
                                <TableRow key={coupon.id}>
                                    <TableCell>
                                        <div className="font-mono font-medium">{coupon.code}</div>
                                        {coupon.description && <div className="text-xs text-muted-foreground">{coupon.description}</div>}
                                    </TableCell>
                                    <TableCell>
                                        {describe(coupon)}
                                        {coupon.min_subtotal !== null && (
                                            <div className="text-xs text-muted-foreground">min. {coupon.min_subtotal.toFixed(2)}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {coupon.used_count}
                                        {coupon.usage_limit !== null && ` / ${coupon.usage_limit}`}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {toInputDate(coupon.starts_at) || 'now'} → {toInputDate(coupon.expires_at) || 'no end'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={coupon.is_active ? 'default' : 'secondary'}>{coupon.is_active ? 'Active' : 'Off'}</Badge>
                                    </TableCell>
                                    <TableCell className="space-x-2 text-right">
                                        {canManage && (
                                            <>
                                                <Button variant="outline" size="sm" onClick={() => openEdit(coupon)}>
                                                    Edit
                                                </Button>
                                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(coupon)}>
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? `Edit ${editing.code}` : 'New coupon'}</DialogTitle>
                        <DialogDescription>Codes are not case-sensitive for customers.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                            <Label htmlFor="coupon-code">Code</Label>
                            <Input
                                id="coupon-code"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                placeholder="SUMMER10"
                                className="font-mono"
                            />
                            {field('code')}
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                            <Label htmlFor="coupon-description">Description (only shown to you)</Label>
                            <Input
                                id="coupon-description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Type</Label>
                            <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as CouponForm['type'] })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percent">Percentage off</SelectItem>
                                    <SelectItem value="fixed">Fixed amount off</SelectItem>
                                    <SelectItem value="free_shipping">Free shipping</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {form.type !== 'free_shipping' && (
                            <div className="space-y-1">
                                <Label htmlFor="coupon-amount">{form.type === 'percent' ? 'Percent' : 'Amount'}</Label>
                                <Input
                                    id="coupon-amount"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                />
                                {field('amount')}
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label htmlFor="coupon-min">Minimum order</Label>
                            <Input
                                id="coupon-min"
                                type="number"
                                min={0}
                                step="0.01"
                                value={form.min_subtotal}
                                onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })}
                                placeholder="none"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="coupon-limit">Usage limit</Label>
                            <Input
                                id="coupon-limit"
                                type="number"
                                min={1}
                                value={form.usage_limit}
                                onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                                placeholder="unlimited"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="coupon-starts">Starts</Label>
                            <Input
                                id="coupon-starts"
                                type="date"
                                value={form.starts_at}
                                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="coupon-expires">Expires</Label>
                            <Input
                                id="coupon-expires"
                                type="date"
                                value={form.expires_at}
                                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                            />
                            {field('expires_at')}
                        </div>
                        <div className="flex items-center justify-between sm:col-span-2">
                            <Label htmlFor="coupon-active">Active</Label>
                            <Switch
                                id="coupon-active"
                                checked={form.is_active}
                                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={save} disabled={saving || form.code.trim() === ''}>
                            {saving ? 'Saving…' : 'Save coupon'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
