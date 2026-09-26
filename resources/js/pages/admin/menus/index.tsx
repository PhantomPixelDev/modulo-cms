import { MenuFields } from '@/components/menus/MenuFields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/section-header';
import { useTranslation } from '@/hooks/useTranslation';
import AdminLayout from '@/layouts/admin-layout';
import { useAcl } from '@/lib/acl';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ListTree, Pencil, Trash2 } from 'lucide-react';
import React from 'react';

interface MenuDTO {
    id: number;
    name: string;
    slug: string;
    location?: string | null;
    description?: string | null;
    items?: Array<{ id: number }>;
}

const slugify = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

function MenusLayout({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation();
    return (
        <AdminLayout
            breadcrumbs={[
                { title: t('dashboard.home.title'), href: '/dashboard' },
                { title: t('dashboard.menus.title'), href: '' },
            ]}
        >
            {children}
        </AdminLayout>
    );
}

(AdminMenusIndex as unknown as { layout: (page: React.ReactNode) => React.ReactNode }).layout = (page) => <MenusLayout>{page}</MenusLayout>;

export default function AdminMenusIndex() {
    const { menus = [], locations = {} } = usePage().props as unknown as { menus: MenuDTO[]; locations: Record<string, string> };
    const { t } = useTranslation();
    const { hasPermission, isAdmin } = useAcl();
    const can = (permission: string) => isAdmin() || hasPermission(permission);

    const { data, setData, post, processing, reset, errors } = useForm({ name: '', slug: '', location: '', description: '' });
    // The slug follows the name until someone edits it
    const [slugTouched, setSlugTouched] = React.useState(false);
    const setField = (key: 'name' | 'slug' | 'location' | 'description', value: string) => {
        if (key === 'slug') setSlugTouched(true);
        if (key === 'name' && !slugTouched) {
            setData((current) => ({ ...current, name: value, slug: slugify(value) }));
            return;
        }
        setData(key, value);
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        post(route('dashboard.admin.menus.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSlugTouched(false);
            },
        });
    };

    return (
        <div className="space-y-6 px-3 py-4 sm:px-6 sm:py-6">
            <Head title={t('dashboard.menus.title')} />
            <SectionHeader title={t('dashboard.menus.title')} description={t('dashboard.menus.description')} />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
                <Card className="gap-0 border-border/60 py-0 shadow-none">
                    <CardContent className="p-0">
                        {menus.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
                                <ListTree className="h-8 w-8" />
                                {t('dashboard.menus.empty')}
                            </div>
                        ) : (
                            <ul className="divide-y">
                                {menus.map((menu) => (
                                    <li key={menu.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0 space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link href={route('dashboard.admin.menus.show', menu.id)} className="font-medium hover:underline">
                                                    {menu.name}
                                                </Link>
                                                <Badge variant={menu.location ? 'default' : 'outline'}>
                                                    {menu.location ? (locations[menu.location] ?? menu.location) : t('dashboard.menus.fields.location_none')}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {t('dashboard.menus.items_count', { count: menu.items?.length ?? 0 })}
                                                {menu.description ? ` · ${menu.description}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            {can('edit menus') && (
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={route('dashboard.admin.menus.show', menu.id)}>
                                                        <Pencil className="h-4 w-4" />
                                                        {t('dashboard.menus.actions.edit')}
                                                    </Link>
                                                </Button>
                                            )}
                                            {can('delete menus') && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive"
                                                    aria-label={t('dashboard.menus.actions.delete')}
                                                    title={t('dashboard.menus.actions.delete')}
                                                    onClick={() => {
                                                        if (!confirm(t('dashboard.menus.confirm_delete', { name: menu.name }))) return;
                                                        router.delete(route('dashboard.admin.menus.destroy', menu.id), { preserveScroll: true });
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                {can('create menus') && (
                    <Card className="gap-4 border-border/60 shadow-none">
                        <CardHeader>
                            <CardTitle className="text-base">{t('dashboard.menus.create_title')}</CardTitle>
                            <CardDescription>{t('dashboard.menus.create_description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="space-y-4">
                                <MenuFields data={data} setData={setField} errors={errors} locations={locations} />
                                <div className="flex justify-end">
                                    <Button size="sm" disabled={processing}>
                                        {t('dashboard.menus.actions.create')}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
