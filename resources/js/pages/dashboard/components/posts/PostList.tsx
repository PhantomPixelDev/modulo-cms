import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/useTranslation';
import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ROUTE } from '../../routes';
import type { PostListItem } from '../../types';

type Locale = { id: number; code: string; name: string; native_name?: string; is_default?: boolean };

export interface PostListFilters {
    search?: string;
    status?: string;
    author_id?: string | number;
    post_type_id?: string | number;
}

interface Paginator<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

type PostListProps = {
    posts: Paginator<PostListItem> | PostListItem[];
    filters?: PostListFilters;
    authors?: Array<{ id: number; name: string }>;
    postTypes?: Array<{ id: number; name: string; label?: string }>;
    showTypeFilter?: boolean;
    locales?: Locale[];
    canEdit?: boolean;
    canDelete?: boolean;
    canPublish?: boolean;
    /** Where a row's title and edit button lead; posts by default */
    editHref?: (item: PostListItem) => string;
    /** Where the view button leads; no view button when this returns null */
    viewHref?: (item: PostListItem) => string | null;
    searchPlaceholder?: string;
    emptyText?: string;
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    published: 'default',
    draft: 'secondary',
    pending: 'outline',
    private: 'destructive',
};

const ALL = 'all';

/**
 * The posts list. Search, filters and pagination run on the server (the URL
 * holds them, so they survive a reload and can be shared); bulk actions work
 * on the rows ticked on the current page.
 */
export function PostList({
    posts,
    filters = {},
    authors = [],
    postTypes = [],
    showTypeFilter = true,
    locales = [],
    canEdit = false,
    canDelete = false,
    canPublish = false,
    editHref = (item) => ROUTE.posts.edit(item.slug || item.id),
    viewHref = (item) => ROUTE.posts.show(item.slug || item.id),
    searchPlaceholder,
    emptyText,
}: PostListProps) {
    const { t } = useTranslation();
    const page: Paginator<PostListItem> = Array.isArray(posts)
        ? { data: posts, current_page: 1, last_page: 1, total: posts.length, from: 1, to: posts.length }
        : posts;
    const items = page.data ?? [];

    const [search, setSearch] = useState(filters.search ?? '');
    const [selected, setSelected] = useState<number[]>([]);
    const [busy, setBusy] = useState(false);
    const firstRender = useRef(true);

    // Only reload when the filter values change, not on every render
    const apply = (next: PostListFilters) => {
        const params = Object.fromEntries(Object.entries({ ...filters, ...next }).filter(([, v]) => v !== undefined && v !== '' && v !== ALL));
        router.get(window.location.pathname, params, { preserveState: true, preserveScroll: true, replace: true });
    };

    // Search as you type, without a request per keystroke
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const timer = window.setTimeout(() => apply({ search }), 300);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // A new page of results drops the old selection
    useEffect(() => setSelected([]), [page.current_page, items.length, filters.status, filters.search]);

    const hasFilters = Boolean(filters.search || filters.status || filters.author_id || filters.post_type_id);
    const allSelected = items.length > 0 && selected.length === items.length;
    const canBulk = canEdit || canDelete;

    const runBulk = (action: 'publish' | 'draft' | 'trash') => {
        if (action === 'trash' && !confirm(t('dashboard.posts.bulk.confirm_trash', { count: selected.length }))) return;
        setBusy(true);
        router.post(ROUTE.posts.bulk(), { action, ids: selected }, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    const goTo = (pageNumber: number) =>
        router.get(window.location.pathname, { ...filters, page: pageNumber }, { preserveState: true, preserveScroll: false });

    const localeBadges = (item: PostListItem) => {
        const translated = (item.translations ?? []).map((tr) => tr.locale);

        return (
            <TooltipProvider>
                <div className="flex items-center gap-1">
                    {locales.map((locale) => {
                        const has = translated.includes(locale.code) || locale.is_default;
                        return (
                            <Tooltip key={locale.code}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={`${editHref(item)}?locale=${locale.code}`}
                                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded px-1.5 text-xs font-medium ${
                                            has ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'border border-dashed text-muted-foreground hover:bg-muted'
                                        }`}
                                    >
                                        {has ? locale.code.toUpperCase() : <Plus className="h-3 w-3" />}
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {t(has ? 'dashboard.posts.translations.edit' : 'dashboard.posts.translations.add')} ({locale.native_name || locale.name})
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            </TooltipProvider>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <div className="relative lg:w-72">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder ?? t('dashboard.posts.search_posts')}
                        aria-label={searchPlaceholder ?? t('dashboard.posts.search_posts')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Select value={String(filters.status ?? ALL)} onValueChange={(status) => apply({ status })}>
                        <SelectTrigger className="w-40" aria-label={t('dashboard.posts.post_status')}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL}>{t('common.all')}</SelectItem>
                            <SelectItem value="published">{t('common.status.published')}</SelectItem>
                            <SelectItem value="scheduled">{t('dashboard.posts.filter_scheduled')}</SelectItem>
                            <SelectItem value="draft">{t('common.status.draft')}</SelectItem>
                            <SelectItem value="pending">{t('common.status.pending')}</SelectItem>
                            <SelectItem value="private">{t('common.status.private')}</SelectItem>
                        </SelectContent>
                    </Select>

                    {authors.length > 1 && (
                        <Select value={String(filters.author_id ?? ALL)} onValueChange={(author_id) => apply({ author_id })}>
                            <SelectTrigger className="w-44" aria-label={t('dashboard.posts.post_author')}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>{t('dashboard.posts.filter_by_author')}</SelectItem>
                                {authors.map((a) => (
                                    <SelectItem key={a.id} value={String(a.id)}>
                                        {a.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {showTypeFilter && postTypes.length > 1 && (
                        <Select value={String(filters.post_type_id ?? ALL)} onValueChange={(post_type_id) => apply({ post_type_id })}>
                            <SelectTrigger className="w-44" aria-label={t('dashboard.posts.post_type')}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL}>{t('dashboard.posts.filter_by_type')}</SelectItem>
                                {postTypes.map((type) => (
                                    <SelectItem key={type.id} value={String(type.id)}>
                                        {type.label || type.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {hasFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9"
                            onClick={() => {
                                setSearch('');
                                router.get(window.location.pathname, {}, { preserveState: true, replace: true });
                            }}
                        >
                            <X className="mr-1 h-4 w-4" />
                            {t('common.actions.clear')}
                        </Button>
                    )}
                </div>
            </div>

            {canBulk && selected.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm" role="region" aria-label={t('dashboard.posts.bulk.title')}>
                    <span className="font-medium">{t('dashboard.posts.bulk.selected', { count: selected.length })}</span>
                    <span className="text-muted-foreground">·</span>
                    {canPublish && (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => runBulk('publish')}>
                            {t('dashboard.posts.bulk.publish')}
                        </Button>
                    )}
                    {canEdit && (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => runBulk('draft')}>
                            {t('dashboard.posts.bulk.draft')}
                        </Button>
                    )}
                    {canDelete && (
                        <Button size="sm" variant="outline" className="text-destructive" disabled={busy} onClick={() => runBulk('trash')}>
                            {t('dashboard.posts.bulk.trash')}
                        </Button>
                    )}
                </div>
            )}

            <div className="overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {canBulk && (
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={(c) => setSelected(c === true ? items.map((i) => i.id) : [])}
                                        aria-label={t('dashboard.posts.bulk.select_all')}
                                    />
                                </TableHead>
                            )}
                            <TableHead>{t('dashboard.posts.post_title')}</TableHead>
                            {locales.length > 1 && <TableHead>{t('dashboard.posts.translations.label')}</TableHead>}
                            <TableHead className="hidden md:table-cell">{t('dashboard.posts.post_type')}</TableHead>
                            <TableHead>{t('dashboard.posts.post_status')}</TableHead>
                            <TableHead className="hidden md:table-cell">{t('dashboard.posts.post_author')}</TableHead>
                            <TableHead className="hidden lg:table-cell">{t('dashboard.posts.post_date')}</TableHead>
                            <TableHead className="w-20 text-right" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                                    {hasFilters ? t('dashboard.posts.no_results') : (emptyText ?? t('dashboard.posts.empty'))}
                                </TableCell>
                            </TableRow>
                        )}
                        {items.map((item) => (
                            <TableRow key={item.id} data-state={selected.includes(item.id) ? 'selected' : undefined}>
                                {canBulk && (
                                    <TableCell>
                                        <Checkbox
                                            checked={selected.includes(item.id)}
                                            onCheckedChange={(c) => setSelected((s) => (c === true ? [...s, item.id] : s.filter((id) => id !== item.id)))}
                                            aria-label={t('dashboard.posts.bulk.select_row')}
                                        />
                                    </TableCell>
                                )}
                                <TableCell className="max-w-md">
                                    {canEdit ? (
                                        <Link href={editHref(item)} className="font-medium hover:underline">
                                            {item.title || '—'}
                                        </Link>
                                    ) : (
                                        <span className="font-medium">{item.title || '—'}</span>
                                    )}
                                    {item.slug && <div className="truncate text-xs text-muted-foreground">/{item.slug}</div>}
                                </TableCell>
                                {locales.length > 1 && <TableCell>{localeBadges(item)}</TableCell>}
                                <TableCell className="hidden md:table-cell">
                                    <Badge variant="outline">{item.post_type?.label || item.post_type?.name || '—'}</Badge>
                                </TableCell>
                                <TableCell>
                                    {item.is_scheduled ? (
                                        <Badge variant="outline" title={item.published_at ?? undefined}>
                                            {t('dashboard.posts.filter_scheduled')}
                                        </Badge>
                                    ) : (
                                        <Badge variant={statusVariant[item.status] ?? 'secondary'}>{t(`common.status.${item.status}`)}</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{item.author?.name || '—'}</TableCell>
                                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{item.created_at}</TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                    {viewHref(item) && (
                                        <Button variant="ghost" size="icon" asChild aria-label={t('common.actions.view')}>
                                            <Link href={viewHref(item) as string}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {canEdit && (
                                        <Button variant="ghost" size="icon" asChild aria-label={t('common.actions.edit')}>
                                            <Link href={editHref(item)}>
                                                <Pencil className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {page.last_page > 1 && (
                <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
                    <span className="text-muted-foreground">
                        {t('common.pagination.showing', { from: String(page.from ?? 0), to: String(page.to ?? 0), total: String(page.total) })}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={page.current_page <= 1} onClick={() => goTo(page.current_page - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span>
                            {page.current_page} / {page.last_page}
                        </span>
                        <Button variant="outline" size="sm" disabled={page.current_page >= page.last_page} onClick={() => goTo(page.current_page + 1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </nav>
            )}
        </div>
    );
}
