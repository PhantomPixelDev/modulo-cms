import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionHeader } from '@/components/ui/section-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/hooks/useTranslation';
import AdminLayout from '@/layouts/admin-layout';
import { useAcl } from '@/lib/acl';
import { cn } from '@/lib/utils';
import type { Locale } from '@/pages/dashboard/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, ExternalLink, GripVertical, Loader2, Pencil, Search, Trash2, X } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MenuFields } from '@/components/menus/MenuFields';
import { canMove, flattenTree, indent, moveDown, moveTo, moveUp, outdent, project, toPayload, type TreeNode } from './menuTree';

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
    translations?: Array<{ locale: string; label?: string | null; url?: string | null }>;
}

interface MenuDTO {
    id: number;
    name: string;
    slug: string;
    location?: string | null;
    description?: string | null;
}

interface PageOption {
    id: number;
    title: string;
    slug: string;
    status: string;
}

interface PageProps {
    menu: MenuDTO;
    items: MenuItemDTO[];
    pages: PageOption[];
    locales: Locale[];
    locations: Record<string, string>;
}

/** Pixels per nesting level, on screen and for dragging sideways. */
const INDENT = 28;

function MenusLayout({ children, name }: { children: React.ReactNode; name?: string }) {
    const { t } = useTranslation();
    return (
        <AdminLayout
            breadcrumbs={[
                { title: t('dashboard.home.title'), href: '/dashboard' },
                { title: t('dashboard.menus.title'), href: route('dashboard.admin.menus.index') },
                { title: name ?? '', href: '' },
            ]}
        >
            {children}
        </AdminLayout>
    );
}

(AdminMenusShow as unknown as { layout: (page: React.ReactElement<{ menu?: MenuDTO }>) => React.ReactNode }).layout = (page) => (
    <MenusLayout name={page.props.menu?.name}>{page}</MenusLayout>
);

export default function AdminMenusShow() {
    const { menu, items, pages, locales = [], locations = {} } = usePage().props as unknown as PageProps;
    const { t } = useTranslation();
    const { hasPermission, isAdmin } = useAcl();
    const can = (permission: string) => isAdmin() || hasPermission(permission);

    const canEditMenu = can('edit menus');
    const canAddItems = can('create menu items');

    return (
        <div className="space-y-6 px-3 py-4 sm:px-6 sm:py-6">
            <Head title={`${t('dashboard.menus.title')}: ${menu.name}`} />
            <SectionHeader
                title={menu.name}
                description={menu.location && locations[menu.location] ? locations[menu.location] : t('dashboard.menus.fields.location_none')}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={route('dashboard.admin.menus.index')}>
                                <ArrowLeft className="h-4 w-4" />
                                {t('dashboard.menus.actions.back')}
                            </Link>
                        </Button>
                        {can('delete menus') && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive"
                                onClick={() => {
                                    if (!confirm(t('dashboard.menus.confirm_delete', { name: menu.name }))) return;
                                    router.delete(route('dashboard.admin.menus.destroy', menu.id), { replace: true });
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                                {t('dashboard.menus.actions.delete')}
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
                <div className="space-y-6">
                    {canAddItems && <AddItems menuId={menu.id} items={items} pages={pages} />}
                    {canEditMenu && <MenuSettings menu={menu} locations={locations} />}
                </div>

                <MenuBuilder
                    menuId={menu.id}
                    items={items}
                    pages={pages}
                    locales={locales}
                    canReorder={canEditMenu}
                    canEditItems={can('edit menu items')}
                    canDeleteItems={can('delete menu items')}
                />
            </div>
        </div>
    );
}

function MenuBuilder({
    menuId,
    items,
    pages,
    locales,
    canReorder,
    canEditItems,
    canDeleteItems,
}: {
    menuId: number;
    items: MenuItemDTO[];
    pages: PageOption[];
    locales: Locale[];
    canReorder: boolean;
    canEditItems: boolean;
    canDeleteItems: boolean;
}) {
    const { t } = useTranslation();
    const [tree, setTree] = useState<TreeNode[]>(() => flattenTree(items));
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [editing, setEditing] = useState<number | null>(null);
    const [drag, setDrag] = useState<{ id: number; startX: number; depth: number } | null>(null);
    const [drop, setDrop] = useState<{ overId: number; position: 'before' | 'after'; index: number; depth: number } | null>(null);
    const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
    const pagesBySlug = useMemo(() => new Map(pages.map((page) => [page.slug, page])), [pages]);
    const listRef = useRef<HTMLUListElement>(null);

    // The server is the source of truth after every save or edit
    useEffect(() => setTree(flattenTree(items)), [items]);

    const save = (next: TreeNode[]) => {
        if (next === tree) return;
        setTree(next);
        setSaveState('saving');
        router.put(
            route('dashboard.admin.menus.reorder', menuId),
            { items: toPayload(next) },
            {
                preserveScroll: true,
                preserveState: true,
                only: ['items'],
                onSuccess: () => setSaveState('saved'),
                onError: () => {
                    setSaveState('idle');
                    setTree(flattenTree(items));
                    alert(t('dashboard.menus.messages.order_failed'));
                },
            },
        );
    };

    const onDragOver = (event: React.DragEvent, overId: number) => {
        if (!drag) return;
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
        const desired = drag.depth + Math.round((event.clientX - drag.startX) / INDENT);
        const projection = project(tree, drag.id, overId, position, desired);
        if (!projection) return setDrop(null);
        if (drop?.overId !== overId || drop.position !== position || drop.depth !== projection.depth) {
            setDrop({ overId, position, ...projection });
        }
    };

    const onDrop = (event: React.DragEvent) => {
        event.preventDefault();
        if (drag && drop) save(moveTo(tree, drag.id, drop.index, drop.depth));
        setDrag(null);
        setDrop(null);
    };

    const describe = (item: MenuItemDTO) => {
        if (item.route_name) return { badge: t('dashboard.menus.item.badge_route'), target: item.route_name, missing: false, draft: false };
        if (item.page_slug) {
            const page = pagesBySlug.get(item.page_slug);
            return {
                badge: t('dashboard.menus.item.badge_page'),
                target: `/${item.page_slug}`,
                missing: !page,
                draft: page ? page.status !== 'published' : false,
            };
        }
        return { badge: t('dashboard.menus.item.badge_link'), target: item.url || '—', missing: false, draft: false };
    };

    const indicator = (depth: number) => (
        <li aria-hidden className="pointer-events-none h-0.5 rounded-full bg-primary" style={{ marginLeft: depth * INDENT }} />
    );

    return (
        <Card className="gap-4 border-border/60 shadow-none">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                    <CardTitle className="text-base">{t('dashboard.menus.builder.title')}</CardTitle>
                    {canReorder && <CardDescription>{t('dashboard.menus.builder.hint')}</CardDescription>}
                </div>
                {saveState !== 'idle' && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground" role="status">
                        {saveState === 'saving' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        {t(saveState === 'saving' ? 'dashboard.menus.builder.saving' : 'dashboard.menus.builder.saved')}
                    </span>
                )}
            </CardHeader>
            <CardContent>
                {tree.length === 0 ? (
                    <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">{t('dashboard.menus.builder.empty')}</p>
                ) : (
                    <ul ref={listRef} className="space-y-2" onDragOver={(event) => drag && event.preventDefault()} onDrop={onDrop}>
                        {tree.map((node) => {
                            const item = byId.get(node.id);
                            if (!item) return null;
                            const info = describe(item);
                            const moves = canMove(tree, node.id);
                            const dragging = drag !== null && (drag.id === node.id || isInside(tree, drag.id, node.id));
                            const showBefore = drop?.overId === node.id && drop.position === 'before';
                            const showAfter = drop?.overId === node.id && drop.position === 'after';

                            return (
                                <React.Fragment key={node.id}>
                                    {showBefore && indicator(drop.depth)}
                                    <li
                                        style={{ marginLeft: node.depth * INDENT }}
                                        className={cn('rounded-md border bg-card transition-opacity', dragging && 'opacity-40')}
                                        draggable={canReorder && editing === null}
                                        onDragStart={(event) => {
                                            event.dataTransfer.effectAllowed = 'move';
                                            event.dataTransfer.setData('text/plain', String(node.id));
                                            setDrag({ id: node.id, startX: event.clientX, depth: node.depth });
                                        }}
                                        onDragOver={(event) => onDragOver(event, node.id)}
                                        onDragEnd={() => {
                                            setDrag(null);
                                            setDrop(null);
                                        }}
                                    >
                                        <div className="flex items-center gap-2 p-2 pr-3">
                                            {canReorder && (
                                                <span className="cursor-grab text-muted-foreground active:cursor-grabbing" title={t('dashboard.menus.builder.drag')}>
                                                    <GripVertical className="h-4 w-4" />
                                                </span>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="truncate text-sm font-medium">{item.label}</span>
                                                    <Badge variant="outline" className="text-[11px]">
                                                        {info.badge}
                                                    </Badge>
                                                    {info.draft && <Badge variant="secondary">{t('dashboard.menus.item.draft')}</Badge>}
                                                    {info.missing && <Badge variant="destructive">{t('dashboard.menus.item.page_missing')}</Badge>}
                                                    {item.visible_to && item.visible_to !== 'all' && (
                                                        <Badge variant="secondary">{t(`dashboard.menus.item.visible_${item.visible_to}`)}</Badge>
                                                    )}
                                                    {item.target === '_blank' && (
                                                        <ExternalLink className="h-3 w-3 text-muted-foreground" aria-label={t('dashboard.menus.item.new_tab')} />
                                                    )}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">{info.target}</div>
                                            </div>
                                            <div className="flex shrink-0 items-center">
                                                {canReorder && (
                                                    <>
                                                        <IconButton label={t('dashboard.menus.actions.move_up')} disabled={!moves.up} onClick={() => save(moveUp(tree, node.id))}>
                                                            <ArrowUp />
                                                        </IconButton>
                                                        <IconButton label={t('dashboard.menus.actions.move_down')} disabled={!moves.down} onClick={() => save(moveDown(tree, node.id))}>
                                                            <ArrowDown />
                                                        </IconButton>
                                                        <IconButton label={t('dashboard.menus.actions.outdent')} disabled={!moves.outdent} onClick={() => save(outdent(tree, node.id))}>
                                                            <ArrowLeft />
                                                        </IconButton>
                                                        <IconButton label={t('dashboard.menus.actions.indent')} disabled={!moves.indent} onClick={() => save(indent(tree, node.id))}>
                                                            <ArrowRight />
                                                        </IconButton>
                                                    </>
                                                )}
                                                {canEditItems && (
                                                    <IconButton
                                                        label={t(editing === node.id ? 'dashboard.menus.actions.close' : 'dashboard.menus.actions.edit_item')}
                                                        onClick={() => setEditing(editing === node.id ? null : node.id)}
                                                        pressed={editing === node.id}
                                                    >
                                                        {editing === node.id ? <X /> : <Pencil />}
                                                    </IconButton>
                                                )}
                                                {canDeleteItems && (
                                                    <IconButton
                                                        label={t('dashboard.menus.actions.remove')}
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            if (!confirm(t('dashboard.menus.confirm_remove_item', { name: item.label }))) return;
                                                            router.delete(route('dashboard.admin.menu-items.destroy', item.id), { preserveScroll: true });
                                                        }}
                                                    >
                                                        <Trash2 />
                                                    </IconButton>
                                                )}
                                            </div>
                                        </div>
                                        {editing === node.id && (
                                            <ItemEditor key={item.id} item={item} pages={pages} locales={locales} onDone={() => setEditing(null)} />
                                        )}
                                    </li>
                                    {showAfter && indicator(drop.depth)}
                                </React.Fragment>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

/** Whether `id` is one of `ancestorId`'s sub-items. */
function isInside(tree: TreeNode[], ancestorId: number, id: number): boolean {
    const byId = new Map(tree.map((node) => [node.id, node]));
    for (let at = byId.get(id)?.parentId ?? null; at !== null; at = byId.get(at)?.parentId ?? null) {
        if (at === ancestorId) return true;
    }
    return false;
}

function IconButton({
    label,
    children,
    className,
    pressed,
    ...props
}: { label: string; pressed?: boolean } & React.ComponentProps<typeof Button>) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 [&_svg]:size-4', className)}
            aria-label={label}
            title={label}
            aria-pressed={pressed}
            {...props}
        >
            {children}
        </Button>
    );
}

type LinkType = 'page' | 'url' | 'route';

function ItemEditor({ item, pages, locales, onDone }: { item: MenuItemDTO; pages: PageOption[]; locales: Locale[]; onDone: () => void }) {
    const { t } = useTranslation();
    const otherLocales = locales.filter((locale) => !locale.is_default);
    const { data, setData, put, transform, processing, errors } = useForm({
        label: item.label,
        page_slug: item.page_slug ?? '',
        url: item.url ?? '',
        route_name: item.route_name ?? '',
        target: (item.target ?? '_self') as '_self' | '_blank',
        visible_to: (item.visible_to ?? 'all') as 'all' | 'guest' | 'auth',
        translations: otherLocales.map((locale) => {
            const existing = item.translations?.find((tr) => tr.locale === locale.code);
            return { locale: locale.code, label: existing?.label ?? '', url: existing?.url ?? '' };
        }),
    });
    const [type, setType] = useState<LinkType>(item.route_name ? 'route' : item.page_slug ? 'page' : 'url');

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        // Only the chosen kind of link is kept
        transform((values) => ({
            ...values,
            page_slug: type === 'page' ? values.page_slug || null : null,
            url: type === 'url' ? values.url || null : null,
            route_name: type === 'route' ? values.route_name || null : null,
        }));
        put(route('dashboard.admin.menu-items.update', item.id), { preserveScroll: true, onSuccess: onDone });
    };

    return (
        <form onSubmit={submit} className="space-y-4 border-t bg-muted/20 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor={`label-${item.id}`}>{t('dashboard.menus.item.label')}</Label>
                    <Input id={`label-${item.id}`} value={data.label} onChange={(event) => setData('label', event.target.value)} required />
                    {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
                </div>
                <div className="space-y-1.5">
                    <Label>{t('dashboard.menus.item.link_type')}</Label>
                    <Select value={type} onValueChange={(value) => setType(value as LinkType)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="page">{t('dashboard.menus.item.type_page')}</SelectItem>
                            <SelectItem value="url">{t('dashboard.menus.item.type_url')}</SelectItem>
                            {item.route_name && <SelectItem value="route">{t('dashboard.menus.item.type_route')}</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
                {type === 'page' && (
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label>{t('dashboard.menus.item.page')}</Label>
                        <Select value={data.page_slug || undefined} onValueChange={(value) => setData('page_slug', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('dashboard.menus.item.choose_page')} />
                            </SelectTrigger>
                            <SelectContent>
                                {pages.map((page) => (
                                    <SelectItem key={page.id} value={page.slug}>
                                        {page.title}
                                        {page.status !== 'published' && ` (${t('dashboard.menus.item.draft')})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {type === 'url' && (
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`url-${item.id}`}>{t('dashboard.menus.item.url')}</Label>
                        <Input id={`url-${item.id}`} value={data.url} onChange={(event) => setData('url', event.target.value)} placeholder="https://…" />
                        <p className="text-xs text-muted-foreground">{t('dashboard.menus.add.link_url_hint')}</p>
                        {errors.url && <p className="text-xs text-destructive">{errors.url}</p>}
                    </div>
                )}
                {type === 'route' && (
                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor={`route-${item.id}`}>{t('dashboard.menus.item.route')}</Label>
                        <Input id={`route-${item.id}`} value={data.route_name} onChange={(event) => setData('route_name', event.target.value)} />
                    </div>
                )}
                <div className="space-y-1.5">
                    <Label>{t('dashboard.menus.item.visible_to')}</Label>
                    <Select value={data.visible_to} onValueChange={(value) => setData('visible_to', value as 'all' | 'guest' | 'auth')}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('dashboard.menus.item.visible_all')}</SelectItem>
                            <SelectItem value="guest">{t('dashboard.menus.item.visible_guest')}</SelectItem>
                            <SelectItem value="auth">{t('dashboard.menus.item.visible_auth')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-3 self-end pb-2">
                    <Switch
                        id={`target-${item.id}`}
                        checked={data.target === '_blank'}
                        onCheckedChange={(checked) => setData('target', checked ? '_blank' : '_self')}
                    />
                    <Label htmlFor={`target-${item.id}`}>{t('dashboard.menus.item.new_tab')}</Label>
                </div>
            </div>

            {otherLocales.length > 0 && (
                <div className="space-y-2">
                    <div>
                        <p className="text-sm font-medium">{t('dashboard.menus.item.translations')}</p>
                        <p className="text-xs text-muted-foreground">{t('dashboard.menus.item.translations_hint')}</p>
                    </div>
                    <Tabs defaultValue={otherLocales[0].code}>
                        <TabsList>
                            {otherLocales.map((locale) => (
                                <TabsTrigger key={locale.code} value={locale.code} className="text-xs">
                                    {locale.native_name || locale.code.toUpperCase()}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {data.translations.map((translation, index) => (
                            <TabsContent key={translation.locale} value={translation.locale} className="grid gap-2 sm:grid-cols-2">
                                <Input
                                    aria-label={t('dashboard.menus.item.translation_label')}
                                    placeholder={`${t('dashboard.menus.item.translation_label')}: ${data.label}`}
                                    value={translation.label}
                                    onChange={(event) =>
                                        setData(
                                            'translations',
                                            data.translations.map((tr, i) => (i === index ? { ...tr, label: event.target.value } : tr)),
                                        )
                                    }
                                />
                                <Input
                                    aria-label={t('dashboard.menus.item.translation_url')}
                                    placeholder={t('dashboard.menus.item.translation_url')}
                                    value={translation.url}
                                    onChange={(event) =>
                                        setData(
                                            'translations',
                                            data.translations.map((tr, i) => (i === index ? { ...tr, url: event.target.value } : tr)),
                                        )
                                    }
                                />
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            )}

            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onDone}>
                    {t('dashboard.common.cancel')}
                </Button>
                <Button type="submit" size="sm" disabled={processing}>
                    {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('dashboard.menus.actions.save')}
                </Button>
            </div>
        </form>
    );
}

function AddItems({ menuId, items, pages }: { menuId: number; items: MenuItemDTO[]; pages: PageOption[] }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<number[]>([]);
    const [adding, setAdding] = useState(false);
    const link = useForm({ label: '', url: '' });

    const visible = pages.filter((page) => page.title.toLowerCase().includes(query.toLowerCase()));
    const nextOrder = items.filter((item) => !item.parent_id).reduce((max, item) => Math.max(max, (item.order ?? 0) + 1), 0);

    const addPages = () => {
        router.post(
            route('dashboard.admin.menus.add-pages', menuId),
            { page_ids: selected },
            {
                preserveScroll: true,
                onStart: () => setAdding(true),
                onSuccess: () => setSelected([]),
                onFinish: () => setAdding(false),
            },
        );
    };

    const addLink = (event: React.FormEvent) => {
        event.preventDefault();
        link.transform((values) => ({ ...values, menu_id: menuId, order: nextOrder }));
        link.post(route('dashboard.admin.menu-items.store'), { preserveScroll: true, onSuccess: () => link.reset() });
    };

    return (
        <Card className="gap-4 border-border/60 shadow-none">
            <CardHeader>
                <CardTitle className="text-base">{t('dashboard.menus.actions.add_to_menu')}</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="pages">
                    <TabsList className="w-full">
                        <TabsTrigger value="pages" className="flex-1">
                            {t('dashboard.menus.add.pages_title')}
                        </TabsTrigger>
                        <TabsTrigger value="link" className="flex-1">
                            {t('dashboard.menus.add.link_title')}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pages" className="space-y-3 pt-2">
                        {pages.length === 0 ? (
                            <p className="text-sm text-muted-foreground">{t('dashboard.menus.add.pages_empty')}</p>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        placeholder={t('dashboard.menus.add.pages_search')}
                                        aria-label={t('dashboard.menus.add.pages_search')}
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                    />
                                </div>
                                <ul className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
                                    {visible.length === 0 && <li className="p-2 text-sm text-muted-foreground">{t('dashboard.menus.add.pages_none_found')}</li>}
                                    {visible.map((page) => (
                                        <li key={page.id}>
                                            <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent/50">
                                                <Checkbox
                                                    checked={selected.includes(page.id)}
                                                    onCheckedChange={(checked) =>
                                                        setSelected((current) => (checked === true ? [...current, page.id] : current.filter((id) => id !== page.id)))
                                                    }
                                                />
                                                <span className="flex-1 truncate">{page.title}</span>
                                                {page.status !== 'published' && (
                                                    <Badge variant="secondary" className="text-[11px]">
                                                        {t('dashboard.menus.item.draft')}
                                                    </Badge>
                                                )}
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex items-center justify-between gap-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(visible.map((page) => page.id))}>
                                        {t('dashboard.menus.actions.select_all')}
                                    </Button>
                                    <Button type="button" size="sm" disabled={selected.length === 0 || adding} onClick={addPages}>
                                        {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {t('dashboard.menus.actions.add_to_menu')}
                                        {selected.length > 0 && ` (${selected.length})`}
                                    </Button>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="link" className="pt-2">
                        <form onSubmit={addLink} className="space-y-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="link-label">{t('dashboard.menus.add.link_label')}</Label>
                                <Input id="link-label" value={link.data.label} onChange={(event) => link.setData('label', event.target.value)} required />
                                {link.errors.label && <p className="text-xs text-destructive">{link.errors.label}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="link-url">{t('dashboard.menus.add.link_url')}</Label>
                                <Input
                                    id="link-url"
                                    value={link.data.url}
                                    onChange={(event) => link.setData('url', event.target.value)}
                                    placeholder="https://…"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">{t('dashboard.menus.add.link_url_hint')}</p>
                                {link.errors.url && <p className="text-xs text-destructive">{link.errors.url}</p>}
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" size="sm" disabled={link.processing}>
                                    {t('dashboard.menus.actions.add_link')}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

function MenuSettings({ menu, locations }: { menu: MenuDTO; locations: Record<string, string> }) {
    const { t } = useTranslation();
    const { data, setData, put, processing, errors } = useForm({
        name: menu.name,
        slug: menu.slug,
        location: menu.location ?? '',
        description: menu.description ?? '',
    });

    return (
        <Card className="gap-4 border-border/60 shadow-none">
            <CardHeader>
                <CardTitle className="text-base">{t('dashboard.menus.details_title')}</CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        put(route('dashboard.admin.menus.update', menu.id), { preserveScroll: true });
                    }}
                >
                    <MenuFields data={data} setData={setData} errors={errors} locations={locations} />
                    <div className="flex justify-end">
                        <Button size="sm" disabled={processing}>
                            {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                            {t('dashboard.menus.actions.save')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
