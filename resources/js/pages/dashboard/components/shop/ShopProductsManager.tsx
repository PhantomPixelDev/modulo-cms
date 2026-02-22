import { useMemo, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { ROUTE } from '../../routes';
import type { Paginated, ShopProduct } from '../../types';

export function ShopProductsManager({
  products,
  canView,
  canCreate,
  canEdit,
  canDelete,
}: {
  products?: Paginated<ShopProduct>;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const { success: showSuccess, error: showError } = useAdminToast();
  const page = usePage();
  const inertiaErrors = (page.props as any)?.errors || {};

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    sku: '',
    name: '',
    slug: '',
    description: '',
    price: '0',
    sale_price: '',
    currency: 'USD',
    stock: '',
    status: 'published' as 'draft' | 'published',
    featured_image: '',
  });

  const rows = useMemo(() => products?.data ?? [], [products]);

  const canSubmit = canCreate && form.name.trim().length > 0 && String(form.price).trim().length > 0;

  const mergedErrors = useMemo(() => ({ ...inertiaErrors, ...errors }), [inertiaErrors, errors]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [editForm, setEditForm] = useState({
    sku: '',
    name: '',
    slug: '',
    description: '',
    price: '0',
    sale_price: '',
    currency: 'USD',
    stock: '',
    status: 'published' as 'draft' | 'published',
    featured_image: '',
  });

  const openEdit = (p: ShopProduct) => {
    if (!canEdit) return;
    setEditing(p);
    setEditForm({
      sku: p.sku ?? '',
      name: p.name ?? '',
      slug: p.slug ?? '',
      description: p.description ?? '',
      price: String(p.price ?? '0'),
      sale_price: p.sale_price ? String(p.sale_price) : '',
      currency: p.currency ?? 'USD',
      stock: p.stock === null || p.stock === undefined ? '' : String(p.stock),
      status: p.is_active ? 'published' : 'draft',
      featured_image: p.featured_image ?? '',
    });
    setErrors({});
    setEditOpen(true);
  };

  const gotoPage = (nextPage: number) => {
    router.visit(`${ROUTE.shop.products.index()}?page=${nextPage}`, {
      preserveScroll: true,
    });
  };

  const submit = () => {
    if (!canSubmit) return;
    setSaving(true);
    setErrors({});

    router.post(
      ROUTE.shop.products.store(),
      {
        sku: form.sku || null,
        name: form.name,
        slug: form.slug || null,
        description: form.description || null,
        price: Number(form.price),
        sale_price: form.sale_price === '' ? null : Number(form.sale_price),
        currency: form.currency || null,
        stock: form.stock === '' ? null : Number(form.stock),
        status: form.status,
        featured_image: form.featured_image || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess('Product created');
          setErrors({});
          setForm((p) => ({
            ...p,
            sku: '',
            name: '',
            slug: '',
            description: '',
            price: '0',
            sale_price: '',
            stock: '',
            status: 'published',
            featured_image: '',
          }));
        },
        onError: (errors) => {
          setErrors(errors as any);
          showError('Failed to create product');
        },
        onFinish: () => setSaving(false),
      }
    );
  };

  const submitEdit = () => {
    if (!editing || !canEdit) return;
    setSaving(true);
    setErrors({});

    router.put(
      ROUTE.shop.products.update(editing.id),
      {
        sku: editForm.sku || null,
        name: editForm.name,
        slug: editForm.slug || null,
        description: editForm.description || null,
        price: Number(editForm.price),
        sale_price: editForm.sale_price === '' ? null : Number(editForm.sale_price),
        currency: editForm.currency || null,
        stock: editForm.stock === '' ? null : Number(editForm.stock),
        status: editForm.status,
        featured_image: editForm.featured_image || null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess('Product updated');
          setEditOpen(false);
          setEditing(null);
        },
        onError: (errors) => {
          setErrors(errors as any);
          showError('Failed to update product');
        },
        onFinish: () => setSaving(false),
      }
    );
  };

  const deleteProduct = (p: ShopProduct) => {
    if (!canDelete) return;
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;

    router.delete(ROUTE.shop.products.destroy(p.id), {
      preserveScroll: true,
      onSuccess: () => showSuccess('Product deleted'),
      onError: () => showError('Failed to delete product'),
    });
  };

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>You do not have permission to view shop products.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your store catalog.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.shop.orders.index())}>
              Orders
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.shop.settings.index())}>
              Shop Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TableContainer>
            <Table dense>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No products yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-between gap-3">
                          <span>{p.name}</span>
                          {(canEdit || canDelete) && (
                            <div className="flex items-center gap-2">
                              {canEdit && (
                                <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => openEdit(p)}>
                                  Edit
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-destructive hover:text-destructive"
                                  onClick={() => deleteProduct(p)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.is_active ? 'default' : 'secondary'}>
                          {p.is_active ? 'Published' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{p.currency} {Number(p.price).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{p.stock ?? '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {products ? (
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <div>
                  Page {products.current_page} of {products.last_page} • Total {products.total}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    disabled={products.current_page <= 1}
                    onClick={() => gotoPage(products.current_page - 1)}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7"
                    disabled={products.current_page >= products.last_page}
                    onClick={() => gotoPage(products.current_page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </TableContainer>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.shop.orders.index())}>
              Orders
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.shop.settings.index())}>
              Shop Settings
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.shop.products.index())}>
            Refresh
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create product</CardTitle>
          <CardDescription>Add a new product to your store.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                disabled={!canCreate}
                placeholder="T-Shirt"
              />
              {mergedErrors?.name ? <div className="text-xs text-destructive">{mergedErrors.name}</div> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                disabled={!canCreate}
                placeholder="TSHIRT-001"
              />
              {mergedErrors?.sku ? <div className="text-xs text-destructive">{mergedErrors.sku}</div> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (optional)</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                disabled={!canCreate}
                placeholder="t-shirt"
              />
              {mergedErrors?.slug ? <div className="text-xs text-destructive">{mergedErrors.slug}</div> : null}
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  disabled={!canCreate}
                  min={0}
                  step={0.01}
                />
                {mergedErrors?.price ? <div className="text-xs text-destructive">{mergedErrors.price}</div> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={form.currency}
                  onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                  disabled={!canCreate}
                  placeholder="USD"
                />
                {mergedErrors?.currency ? <div className="text-xs text-destructive">{mergedErrors.currency}</div> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock (optional)</Label>
              <Input
                id="stock"
                type="number"
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                disabled={!canCreate}
                min={0}
              />
              {mergedErrors?.stock ? <div className="text-xs text-destructive">{mergedErrors.stock}</div> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value: 'draft' | 'published') => setForm((p) => ({ ...p, status: value }))}
                disabled={!canCreate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              disabled={!canCreate}
              rows={4}
            />
            {mergedErrors?.description ? <div className="text-xs text-destructive">{mergedErrors.description}</div> : null}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={submit} disabled={!canSubmit || saving}>
            {saving ? 'Creating…' : 'Create product'}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>Update product details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
                {mergedErrors?.name ? <div className="text-xs text-destructive">{mergedErrors.name}</div> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  value={editForm.sku}
                  onChange={(e) => setEditForm((p) => ({ ...p, sku: e.target.value }))}
                />
                {mergedErrors?.sku ? <div className="text-xs text-destructive">{mergedErrors.sku}</div> : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={editForm.slug}
                  onChange={(e) => setEditForm((p) => ({ ...p, slug: e.target.value }))}
                />
                {mergedErrors?.slug ? <div className="text-xs text-destructive">{mergedErrors.slug}</div> : null}
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                    min={0}
                    step={0.01}
                  />
                  {mergedErrors?.price ? <div className="text-xs text-destructive">{mergedErrors.price}</div> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currency">Currency</Label>
                  <Input
                    id="edit-currency"
                    value={editForm.currency}
                    onChange={(e) => setEditForm((p) => ({ ...p, currency: e.target.value }))}
                  />
                  {mergedErrors?.currency ? <div className="text-xs text-destructive">{mergedErrors.currency}</div> : null}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-stock">Stock</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={editForm.stock}
                  onChange={(e) => setEditForm((p) => ({ ...p, stock: e.target.value }))}
                  min={0}
                />
                {mergedErrors?.stock ? <div className="text-xs text-destructive">{mergedErrors.stock}</div> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: 'draft' | 'published') => setEditForm((p) => ({ ...p, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
              />
              {mergedErrors?.description ? <div className="text-xs text-destructive">{mergedErrors.description}</div> : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={saving || !canEdit}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
