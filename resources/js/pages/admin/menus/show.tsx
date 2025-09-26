import React, { useMemo, useState } from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
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
    <div className="space-y-6">
      <Head title={`Menu: ${menu?.name ?? ''}`} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Edit Menu</h1>
        <div className="flex gap-2">
          <Button asChild variant="ghost">
            <Link href="/dashboard/admin/menus">Back</Link>
          </Button>
          {(isAdmin() || hasPermission('delete menus')) && (
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirm(`Delete menu \"${menu.name}\"?`)) return;
                router.delete(`/dashboard/admin/menus/${menu.id}`, { replace: true });
              }}
            >Delete</Button>
          )}
        </div>
      </div>

      {(isAdmin() || hasPermission('edit menus')) && (
      <form onSubmit={submit} className="space-y-3 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={data.name} onChange={(e) => setData('name', e.target.value)} />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input className="w-full border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={data.slug} onChange={(e) => setData('slug', e.target.value)} />
          {errors.slug && <p className="text-sm text-red-600">{errors.slug}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Location (optional)</label>
          <input className="w-full border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={data.location || ''} onChange={(e) => setData('location', e.target.value)} />
          {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Description (optional)</label>
          <textarea className="w-full border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={data.description || ''} onChange={(e) => setData('description', e.target.value)} />
          {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
        </div>
        <Button disabled={processing}>Save</Button>
      </form>
      )}

      {/* Inline Menu Items Builder */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Item */}
        <div className="rounded border p-4">
          {(isAdmin() || hasPermission('create menu items')) && (
            <>
              <h2 className="font-medium mb-3">Add Menu Item</h2>
              <CreateItemForm menuId={menu.id} allItems={flatten(menu.items || [])} />
            </>
          )}
        </div>

        {/* Items List */}
        <div className="rounded border p-4">
          <h2 className="font-medium mb-3">Items</h2>
          {Array.isArray(menu.items) && menu.items.length > 0 ? (
            <ul>
              {menu.items
                .filter((it: any) => !it.parent_id)
                .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                .map((it: MenuItemDTO) => (
                  <ItemRow key={it.id} item={it} allItems={flatten(menu.items!)} />
                ))}
            </ul>
          ) : (
            <p className="text-gray-500">No items yet.</p>
          )}
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
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Label</label>
        <input className="w-full border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={data.label} onChange={(e) => setData('label', e.target.value)} />
        {errors.label && <p className="text-sm text-red-600">{errors.label}</p>}
      </div>
      <div>
        <label className="block text-sm mb-1">Link Type</label>
        <select
          className="w-full border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div>
          <label className="block text-sm mb-1">URL</label>
          <input className="w-full border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://example.com/path" value={data.url} onChange={(e) => setData('url', e.target.value)} />
          {errors.url && <p className="text-sm text-red-600">{errors.url}</p>}
        </div>
      )}
      {linkType === 'page' && (
        <div>
          <label className="block text-sm mb-1">Page Slug</label>
          <input className="w-full border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="about, contact" value={data.page_slug} onChange={(e) => setData('page_slug', e.target.value)} />
        </div>
      )}
      {linkType === 'route' && (
        <div>
          <label className="block text-sm mb-1">Route Name</label>
          <input className="w-full border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="dashboard.admin.posts.index" value={data.route_name} onChange={(e) => setData('route_name', e.target.value)} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Order</label>
          <input className="w-full border border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" type="number" value={data.order} onChange={(e) => setData('order', Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm mb-1">Target</label>
          <select className="w-full border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={data.target} onChange={(e) => setData('target', e.target.value as '_self' | '_blank')}>
            <option value="_self">Same tab</option>
            <option value="_blank">New tab</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Visible To</label>
        <select className="w-full border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={data.visible_to} onChange={(e) => setData('visible_to', e.target.value as 'all' | 'guest' | 'auth')}>
          <option value="all">Everyone</option>
          <option value="guest">Guests only</option>
          <option value="auth">Authenticated users</option>
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Parent</label>
        <select className="w-full border border-gray-600 bg-gray-800 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={data.parent_id ?? 0} onChange={(e) => setData('parent_id', Number(e.target.value) || null)}>
          {parentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>
      <Button disabled={processing}>Add</Button>
    </form>
  );
}

function ItemRow({ item, allItems }: { item: MenuItemDTO; allItems: MenuItemDTO[] }) {
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
  const siblings = useMemo(
    () => allItems.filter((i) => (i.parent_id ?? null) === (item.parent_id ?? null)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [allItems, item.parent_id]
  );

  // Flatten descendants to avoid selecting self/desc as parent
  const descendantIds = useMemo(() => collectDescendants(allItems, item.id), [allItems, item.id]);
  const parentOptions = useMemo(
    () => [{ id: 0, label: '— Root —' }, ...allItems.filter((i) => i.id !== item.id && !descendantIds.has(i.id)).map((i) => ({ id: i.id, label: i.label }))],
    [allItems, descendantIds, item.id]
  );

  function onDragStart(ev: React.DragEvent) {
    ev.dataTransfer.setData('text/plain', String(item.id));
    ev.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(ev: React.DragEvent) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
  }
  function onDrop(ev: React.DragEvent) {
    ev.preventDefault();
    const sourceId = Number(ev.dataTransfer.getData('text/plain'));
    if (!sourceId || sourceId === item.id) return;
    const source = allItems.find((i) => i.id === sourceId);
    if (!source) return;
    // Only support reordering within same parent for DnD
    const sameParent = (source.parent_id ?? null) === (item.parent_id ?? null);
    if (!sameParent) return;
    const ordered = siblings.map((s) => s.id);
    const fromIdx = ordered.indexOf(sourceId);
    const toIdx = ordered.indexOf(item.id);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    ordered.splice(fromIdx, 1);
    ordered.splice(toIdx, 0, sourceId);
    // Persist new order indices for siblings
    ordered.forEach((id, idx) => {
      const src = allItems.find((i) => i.id === id);
      router.put(`/dashboard/admin/menu-items/${id}`, { order: idx, label: src?.label ?? '' }, { preserveScroll: true, preserveState: true });
    });
  }

  const linkType = data.route_name ? 'route' : data.page_slug ? 'page' : 'url';
  return (
    <li className="border rounded p-3 mb-3" draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}>
      <div className="flex items-center gap-2 mb-2">
        <button type="button" className="p-1 hover:bg-muted rounded" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <GripVertical className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Drag to reorder within the same parent</span>
      </div>
      <form onSubmit={submit} className="grid md:grid-cols-6 gap-2 items-start">
        <input className="border rounded px-2 py-1 md:col-span-2" placeholder="Label" value={data.label} onChange={(e) => setData('label', e.target.value)} />
        <select className="border rounded px-2 py-1" value={linkType} onChange={(e) => {
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
          <input className="border rounded px-2 py-1 md:col-span-2" placeholder="https://example.com/path" value={data.url} onChange={(e) => setData('url', e.target.value)} />
        )}
        {linkType === 'page' && (
          <input className="border rounded px-2 py-1 md:col-span-2" placeholder="about, contact" value={data.page_slug} onChange={(e) => setData('page_slug', e.target.value)} />
        )}
        {linkType === 'route' && (
          <input className="border rounded px-2 py-1 md:col-span-2" placeholder="dashboard.admin.posts.index" value={data.route_name} onChange={(e) => setData('route_name', e.target.value)} />
        )}
        <input className="border rounded px-2 py-1" placeholder="Order" type="number" value={data.order ?? 0} onChange={(e) => setData('order', Number(e.target.value))} />
        <select className="border rounded px-2 py-1" value={data.parent_id ?? 0} onChange={(e) => setData('parent_id', Number(e.target.value) || null)}>
          {parentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        <select className="border rounded px-2 py-1" value={data.target} onChange={(e) => setData('target', e.target.value as '_self' | '_blank')}>
          <option value="_self">Same tab</option>
          <option value="_blank">New tab</option>
        </select>
        <select className="border rounded px-2 py-1" value={data.visible_to} onChange={(e) => setData('visible_to', e.target.value as 'all' | 'guest' | 'auth')}>
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
                if (!confirm(`Delete item \"${item.label}\"?`)) return;
                router.delete(`/dashboard/admin/menu-items/${item.id}`);
              }}
            >Delete</Button>
          )}
        </div>
      </form>

      {expanded && item.children && item.children.length > 0 && (
        <ul className="ml-6 mt-2">
          {item.children
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((child) => (
              <ItemRow key={child.id} item={child as MenuItemDTO} allItems={allItems} />
            ))}
        </ul>
      )}
    </li>
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
