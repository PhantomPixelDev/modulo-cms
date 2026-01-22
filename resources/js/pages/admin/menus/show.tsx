import React, { useMemo, useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAcl } from '@/lib/acl';

interface MenuItemDTO {
  id: number;
  menu_id: number;
  parent_id?: number | null;
  label: string;
  url?: string | null;
  page_slug?: string | null;
  route_name?: string | null;
  order?: number | null;
  visible_to?: 'all' | 'guest' | 'auth' | null;
  target?: '_self' | '_blank' | null;
  children?: MenuItemDTO[];
}

// Render inside the dashboard layout
(AdminMenusShow as any).layout = (page: React.ReactNode) => (
  <AdminLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Menus', href: '/dashboard/admin/menus' }, { title: 'Edit', href: '' }]}>
    {page}
  </AdminLayout>
);

interface MenuDTO {
  id: number;
  name: string;
  slug: string;
  location?: string | null;
  description?: string | null;
  items?: MenuItemDTO[];
}

export default function AdminMenusShow() {
  const menu = (usePage().props as any).menu as MenuDTO;
  const { hasPermission, isAdmin } = useAcl();

  const { data, setData, put, processing, errors } = useForm({
    name: menu?.name || '',
    slug: menu?.slug || '',
    location: menu?.location || '',
    description: menu?.description || '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/dashboard/admin/menus/${menu.id}`);
  };

  return (
    <div className="px-3 py-4 sm:px-6 sm:py-6 space-y-6">
      <Head title={`Menu: ${menu?.name ?? ''}`} />
      <SectionHeader
        title={`Menu: ${menu?.name ?? ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/admin/menus">Back to Menus</Link>
            </Button>
            {(isAdmin() || hasPermission('delete menus')) && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (!confirm(`Delete menu "${menu.name}"?`)) return;
                  router.delete(`/dashboard/admin/menus/${menu.id}`, { replace: true });
                }}
              >Delete Menu</Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-5">
        {(isAdmin() || hasPermission('edit menus')) && (
          <Card className="xl:col-span-2 border-border/60 shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base font-semibold text-foreground/90">Menu Details</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Update the menu’s metadata and description.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</label>
                  <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Primary Navigation" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slug</label>
                  <Input value={data.slug} onChange={(e) => setData('slug', e.target.value)} placeholder="primary-navigation" />
                  {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Location</label>
                  <Input value={data.location || ''} onChange={(e) => setData('location', e.target.value)} placeholder="header" />
                  <p className="text-xs text-muted-foreground">Optional: specify where this menu is used in your theme.</p>
                  {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
                  <Textarea
                    value={data.description || ''}
                    onChange={(e) => setData('description', e.target.value)}
                    placeholder="Appears in admin lists to identify the menu"
                    className="min-h-[90px]"
                  />
                  {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => router.reload({ only: ['menu'] })} disabled={processing}>
                    Reset
                  </Button>
                  <Button disabled={processing} size="sm">
                    {processing ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="xl:col-span-3 space-y-6">
          {(isAdmin() || hasPermission('create menu items')) && (
            <Card className="border-border/60 shadow-none">
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-semibold text-foreground/90">Add Menu Item</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Link to external URLs, internal pages, or named routes. Use the order field to control placement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateItemForm menuId={menu.id} allItems={flatten(menu.items || [])} />
              </CardContent>
            </Card>
          )}

          <Card className="border-border/60 shadow-none">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground/90">Menu Structure</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Manage menu items and edit their details. Ordering follows the numeric values you provide.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-medium">
                {menu?.items?.length ? `${menu.items.length} item${menu.items.length === 1 ? '' : 's'}` : 'No items yet'}
              </Badge>
            </CardHeader>
            <CardContent>
              {Array.isArray(menu.items) && menu.items.length > 0 ? (
                <div className="space-y-3">
                  {menu.items
                    .filter((it: any) => !it.parent_id)
                    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                    .map((it: MenuItemDTO) => (
                      <ItemRow
                        key={it.id}
                        item={it}
                        allItems={flatten(menu.items!)}
                        isAdmin={isAdmin}
                        hasPermission={hasPermission}
                      />
                    ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                  No items yet. Use the “Add Menu Item” card to start building this menu.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CreateItemForm({ menuId, allItems }: { menuId: number; allItems: MenuItemDTO[] }) {
  const { data, setData, post, processing, reset, errors } = useForm({
    menu_id: menuId,
    parent_id: null as number | null,
    label: '',
    url: '',
    page_slug: '',
    route_name: '',
    order: 0,
    target: '_self' as '_self' | '_blank',
    visible_to: 'all' as 'all' | 'guest' | 'auth',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/dashboard/admin/menu-items', {
      preserveScroll: true,
      onSuccess: () => reset('label', 'url', 'page_slug', 'route_name', 'parent_id', 'order'),
    });
  };

  const parentOptions = [{ id: 0, label: '— Root —' }, ...allItems.map((i) => ({ id: i.id, label: i.label }))];
  const linkType = data.route_name ? 'route' : data.page_slug ? 'page' : 'url';

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Label</label>
        <Input value={data.label} onChange={(e) => setData('label', e.target.value)} placeholder="Menu item label" />
        {errors.label && <p className="text-xs text-red-500">{errors.label}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Link Type</label>
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={linkType}
          onChange={(e) => {
            const t = e.target.value as 'url' | 'page' | 'route';
            if (t === 'url') { setData('route_name', ''); setData('page_slug', ''); }
            if (t === 'page') { setData('route_name', ''); setData('url', ''); }
            if (t === 'route') { setData('page_slug', ''); setData('url', ''); }
          }}
        >
          <option value="url">URL</option>
          <option value="page">Page slug</option>
          <option value="route">Route name</option>
        </select>
      </div>
      {linkType === 'url' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">URL</label>
          <Input placeholder="https://example.com/path" value={data.url} onChange={(e) => setData('url', e.target.value)} />
          {errors.url && <p className="text-xs text-red-500">{errors.url}</p>}
        </div>
      )}
      {linkType === 'page' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Page Slug</label>
          <Input placeholder="about, contact" value={data.page_slug} onChange={(e) => setData('page_slug', e.target.value)} />
        </div>
      )}
      {linkType === 'route' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Route Name</label>
          <Input placeholder="dashboard.admin.posts.index" value={data.route_name} onChange={(e) => setData('route_name', e.target.value)} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order</label>
          <Input type="number" value={data.order} onChange={(e) => setData('order', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target</label>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={data.target} onChange={(e) => setData('target', e.target.value as '_self' | '_blank')}>
            <option value="_self">Same tab</option>
            <option value="_blank">New tab</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visible To</label>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={data.visible_to} onChange={(e) => setData('visible_to', e.target.value as 'all' | 'guest' | 'auth')}>
            <option value="all">Everyone</option>
            <option value="guest">Guests only</option>
            <option value="auth">Authenticated users</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parent</label>
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={data.parent_id ?? 0} onChange={(e) => setData('parent_id', Number(e.target.value) || null)}>
            {parentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => reset('label', 'url', 'page_slug', 'route_name', 'parent_id', 'order')} disabled={processing}>
          Reset
        </Button>
        <Button disabled={processing} size="sm">
          {processing ? 'Adding…' : 'Add Item'}
        </Button>
      </div>
    </form>
  );
}

function ItemRow({ item, allItems, isAdmin, hasPermission }: { item: MenuItemDTO; allItems: MenuItemDTO[]; isAdmin: () => boolean; hasPermission: (perm: string) => boolean }) {
  const { data, setData, put, processing } = useForm({
    parent_id: item.parent_id ?? null,
    label: item.label,
    url: item.url ?? '',
    page_slug: item.page_slug ?? '',
    route_name: item.route_name ?? '',
    order: item.order ?? 0,
    visible_to: (item.visible_to ?? 'all') as 'all' | 'guest' | 'auth',
    target: (item.target ?? '_self') as '_self' | '_blank',
  });
  const [expanded, setExpanded] = useState(true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/dashboard/admin/menu-items/${item.id}`, { preserveScroll: true });
  };

  // Compute siblings (same parent) for drag-sorting
  // Flatten descendants to avoid selecting self/desc as parent
  const descendantIds = useMemo(() => collectDescendants(allItems, item.id), [allItems, item.id]);
  const parentOptions = useMemo(
    () => [{ id: 0, label: '— Root —' }, ...allItems.filter((i) => i.id !== item.id && !descendantIds.has(i.id)).map((i) => ({ id: i.id, label: i.label }))],
    [allItems, descendantIds, item.id]
  );

  const linkType = data.route_name ? 'route' : data.page_slug ? 'page' : 'url';
  return (
    <div className="rounded-md border border-border/60 bg-card/50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <button type="button" className="rounded p-1 hover:bg-muted" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? 'Collapse' : 'Expand'}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <span className="font-medium text-foreground/80">{item.label}</span>
        </div>
        <Badge variant="outline" className="text-xs uppercase">
          {data.parent_id ? parentOptions.find((opt) => opt.id === data.parent_id)?.label ?? 'Nested' : 'Root'}
        </Badge>
      </div>
      <Separator className="my-3" />
      <form onSubmit={submit} className="grid gap-2 md:grid-cols-7">
        <Input className="md:col-span-2" placeholder="Label" value={data.label} onChange={(e) => setData('label', e.target.value)} />
        <select className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={linkType} onChange={(e) => {
          const t = e.target.value as 'url' | 'page' | 'route';
          if (t === 'url') { setData('route_name', ''); setData('page_slug', ''); }
          if (t === 'page') { setData('route_name', ''); setData('url', ''); }
          if (t === 'route') { setData('page_slug', ''); setData('url', ''); }
        }}>
          <option value="url">URL</option>
          <option value="page">Page slug</option>
          <option value="route">Route name</option>
        </select>
        {linkType === 'url' && (
          <Input className="md:col-span-2" placeholder="https://example.com/path" value={data.url} onChange={(e) => setData('url', e.target.value)} />
        )}
        {linkType === 'page' && (
          <Input className="md:col-span-2" placeholder="about, contact" value={data.page_slug} onChange={(e) => setData('page_slug', e.target.value)} />
        )}
        {linkType === 'route' && (
          <Input className="md:col-span-2" placeholder="dashboard.admin.posts.index" value={data.route_name} onChange={(e) => setData('route_name', e.target.value)} />
        )}
        <Input placeholder="Order" type="number" value={data.order ?? 0} onChange={(e) => setData('order', Number(e.target.value))} />
        <select className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={data.parent_id ?? 0} onChange={(e) => setData('parent_id', Number(e.target.value) || null)}>
          {parentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        <select className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={data.target} onChange={(e) => setData('target', e.target.value as '_self' | '_blank')}>
          <option value="_self">Same tab</option>
          <option value="_blank">New tab</option>
        </select>
        <select className="rounded-md border border-input bg-background px-2 py-1 text-sm" value={data.visible_to} onChange={(e) => setData('visible_to', e.target.value as 'all' | 'guest' | 'auth')}>
          <option value="all">Everyone</option>
          <option value="guest">Guests only</option>
          <option value="auth">Authenticated users</option>
        </select>
        <div className="flex gap-2 justify-end md:col-span-2">
          {(isAdmin() || hasPermission('edit menu items')) && (
            <Button disabled={processing} size="sm">Save</Button>
          )}
          {(isAdmin() || hasPermission('delete menu items')) && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!confirm(`Delete item "${item.label}"?`)) return;
                router.delete(`/dashboard/admin/menu-items/${item.id}`);
              }}
            >Delete</Button>
          )}
        </div>
      </form>

      {expanded && item.children && item.children.length > 0 && (
        <div className="ml-6 mt-3 space-y-3">
          {item.children
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((child) => (
              <ItemRow
                key={child.id}
                item={child as MenuItemDTO}
                allItems={allItems}
                isAdmin={isAdmin}
                hasPermission={hasPermission}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// Helpers
function flatten(items: MenuItemDTO[]): MenuItemDTO[] {
  const out: MenuItemDTO[] = [];
  const walk = (arr: MenuItemDTO[]) => {
    arr.forEach((it) => {
      out.push(it);
      if (it.children && it.children.length) walk(it.children);
    });
  };
  walk(items);
  return out;
}

function collectDescendants(all: MenuItemDTO[], id: number): Set<number> {
  const set = new Set<number>();
  const mapChildren = new Map<number, number[]>();
  all.forEach((i) => {
    const pid = i.parent_id ?? 0;
    if (!mapChildren.has(pid)) mapChildren.set(pid, []);
    mapChildren.get(pid)!.push(i.id);
  });
  const stack = [...(mapChildren.get(id) || [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (set.has(cur)) continue;
    set.add(cur);
    (mapChildren.get(cur) || []).forEach((c) => stack.push(c));
  }
  return set;
}
