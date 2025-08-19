import React from 'react';
import AdminLayout from '@/layouts/admin-layout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface MenuItemDTO {
  id: number;
  label: string;
}

// Render inside the dashboard layout
(AdminMenusIndex as any).layout = (page: React.ReactNode) => (
  <AdminLayout breadcrumbs={[{ title: 'Dashboard', href: '/dashboard' }, { title: 'Menus', href: '/dashboard/admin/menus' }]}>
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

export default function AdminMenusIndex() {
  const menus = (usePage().props as any).menus || [];

  const { data, setData, post, processing, reset, errors } = useForm({
    name: '',
    slug: '',
    location: '',
    description: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/dashboard/admin/menus', {
      preserveScroll: true,
      onSuccess: () => reset('name', 'slug', 'location', 'description'),
    });
  };

  return (
    <div className="px-4 py-6">
      <Head title="Menus" />
      <h1 className="text-xl font-semibold tracking-tight">Menus</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded border p-4">
          <h2 className="font-medium mb-3">Create Menu</h2>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input className="w-full border rounded px-3 py-2" value={data.name} onChange={(e) => setData('name', e.target.value)} />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Slug</label>
              <input className="w-full border rounded px-3 py-2" value={data.slug} onChange={(e) => setData('slug', e.target.value)} />
              {errors.slug && <p className="text-sm text-red-600">{errors.slug}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Location (optional)</label>
              <input className="w-full border rounded px-3 py-2" value={data.location} onChange={(e) => setData('location', e.target.value)} />
              {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
            </div>
            <div>
              <label className="block text-sm mb-1">Description (optional)</label>
              <textarea className="w-full border rounded px-3 py-2" value={data.description} onChange={(e) => setData('description', e.target.value)} />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>
            <Button disabled={processing}>Create</Button>
          </form>
        </div>

        <div className="rounded border p-4">
          <h2 className="font-medium mb-3">Existing Menus</h2>
          <ul className="divide-y">
            {menus.map((m: MenuDTO) => (
              <li key={m.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.name}</div>
                  <div className="text-sm text-gray-500">slug: {m.slug}{m.location ? ` • ${m.location}` : ''}</div>
                </div>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/admin/menus/${m.id}`}>Edit</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (!confirm(`Delete menu \"${m.name}\"?`)) return;
                      router.delete(`/dashboard/admin/menus/${m.id}`);
                    }}
                  >Delete</Button>
                </div>
              </li>
            ))}
            {menus.length === 0 && <li className="py-2 text-gray-500">No menus yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
