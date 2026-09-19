import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/section-header';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { useAcl } from '@/lib/acl';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import React from 'react';

interface MenuItemDTO {
    id: number;
    label: string;
}

// Render inside the dashboard layout
(AdminMenusIndex as any).layout = (page: React.ReactNode) => (
    <AdminLayout
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Menus', href: '/dashboard/admin/menus' },
        ]}
    >
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
    const { hasPermission, isAdmin } = useAcl();

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
        <div className="space-y-6 px-3 py-4 sm:px-6 sm:py-6">
            <Head title="Menus" />
            <SectionHeader
                title="Menus"
                actions={
                    (isAdmin() || hasPermission('manage menus')) && (
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => document.getElementById('create-menu-form')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            New Menu
                        </Button>
                    )
                }
            />

            <div className="grid gap-6 lg:grid-cols-5">
                {(isAdmin() || hasPermission('create menus')) && (
                    <Card id="create-menu-form" className="border-border/60 shadow-none lg:col-span-2">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-base font-semibold text-foreground/90">Create Menu</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Define a navigation group with optional location metadata.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Name</label>
                                    <Input value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Primary Navigation" />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Slug</label>
                                    <Input value={data.slug} onChange={(e) => setData('slug', e.target.value)} placeholder="primary-navigation" />
                                    {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Location (optional)</label>
                                    <Input value={data.location} onChange={(e) => setData('location', e.target.value)} placeholder="header" />
                                    {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Description</label>
                                    <Textarea
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Appears in the public header navigation"
                                        className="min-h-[90px]"
                                    />
                                    {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => reset('name', 'slug', 'location', 'description')}
                                        disabled={processing}
                                    >
                                        Reset
                                    </Button>
                                    <Button disabled={processing} size="sm">
                                        {processing ? 'Creating…' : 'Create Menu'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <Card className="border-border/60 shadow-none lg:col-span-3">
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-base font-semibold text-foreground/90">Existing Menus</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Manage navigation groups, view assigned locations, and jump into editing quickly.
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs font-medium">
                            {menus.length} {menus.length === 1 ? 'menu' : 'menus'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {menus.map((m: MenuDTO) => (
                                <div
                                    key={m.id}
                                    className="group flex flex-col gap-3 p-4 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground/90">{m.name}</span>
                                            {m.location && (
                                                <Badge variant="secondary" className="text-xs uppercase">
                                                    {m.location}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground/70">Slug:</span> {m.slug}
                                            {m.description ? ` • ${m.description}` : ''}
                                        </div>
                                        {m.items?.length ? (
                                            <div className="text-xs text-muted-foreground/80">
                                                {m.items.length} {m.items.length === 1 ? 'item' : 'items'}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground/60 italic">No items yet</div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                        {(isAdmin() || hasPermission('edit menus')) && (
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/dashboard/admin/menus/${m.id}`}>Edit</Link>
                                            </Button>
                                        )}
                                        {(isAdmin() || hasPermission('delete menus')) && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    if (!confirm(`Delete menu "${m.name}"?`)) return;
                                                    router.delete(`/dashboard/admin/menus/${m.id}`);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {menus.length === 0 && (
                                <div className="p-6 text-sm text-muted-foreground">
                                    No menus yet. Create your first navigation menu using the form on the left.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
