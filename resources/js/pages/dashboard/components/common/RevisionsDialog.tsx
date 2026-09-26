import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useTranslation } from '@/hooks/useTranslation';
import { diffText, type DiffPart } from '@/lib/textDiff';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { History, Loader2, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Version {
    title: string;
    excerpt: string | null;
    content: string | null;
    meta_title: string | null;
    meta_description: string | null;
}

interface Revision extends Version {
    id: number;
    user: string | null;
    created_at: string;
}

/**
 * Stored content is HTML; compare and show it as text so nothing in it runs
 * here. Block ends become line breaks, so paragraphs stay apart.
 */
const toText = (html: string | null) =>
    html
        ? (new DOMParser().parseFromString(html.replace(/<\/(p|h[1-6]|li|blockquote|div|pre)>|<br\s*\/?>/gi, '$&\n'), 'text/html').body.textContent ?? '')
              .replace(/\n{3,}/g, '\n\n')
              .trim()
        : '';

function Diff({ parts }: { parts: DiffPart[] }) {
    return (
        <>
            {parts.map((part, index) =>
                part.type === 'same' ? (
                    <span key={index}>{part.text}</span>
                ) : part.type === 'removed' ? (
                    <del key={index} className="rounded-sm bg-destructive/15 text-destructive line-through decoration-destructive/60">
                        {part.text}
                    </del>
                ) : (
                    <ins key={index} className="rounded-sm bg-primary/15 no-underline">
                        {part.text}
                    </ins>
                ),
            )}
        </>
    );
}

/**
 * Earlier versions of a post or page: what each one said, what has changed
 * since, and a one-click restore. Restoring keeps the current text as a
 * revision, so it can be undone too.
 */
export function RevisionsDialog({ postId }: { postId: number }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [revisions, setRevisions] = useState<Revision[] | null>(null);
    const [current, setCurrent] = useState<Version | null>(null);
    const [selected, setSelected] = useState<Revision | null>(null);
    const [mode, setMode] = useState<'changes' | 'version'>('changes');
    const [restoring, setRestoring] = useState(false);

    const load = () => {
        setRevisions(null);
        fetch(route('dashboard.admin.revisions.index', { postId }), { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
            .then((response) => (response.ok ? response.json() : { revisions: [], current: null }))
            .then((data: { revisions: Revision[]; current: Version | null }) => {
                setRevisions(data.revisions);
                setCurrent(data.current);
                setSelected(data.revisions[0] ?? null);
            })
            .catch(() => setRevisions([]));
    };

    const restore = (revision: Revision) => {
        if (!window.confirm(t('dashboard.revisions.confirm_restore'))) return;
        router.post(
            route('dashboard.admin.revisions.restore', { postId, revisionId: revision.id }),
            {},
            {
                onStart: () => setRestoring(true),
                // The editor holds its own state; reload so it shows the restored text.
                onSuccess: () => window.location.reload(),
                onFinish: () => setRestoring(false),
            },
        );
    };

    // From the selected version to the text as it is now
    const changes = useMemo(() => {
        if (!selected || !current) return null;
        const field = (a: string | null, b: string | null) => diffText(a ?? '', b ?? '');
        return {
            title: field(selected.title, current.title),
            excerpt: field(selected.excerpt, current.excerpt),
            content: diffText(toText(selected.content), toText(current.content)),
            meta_title: field(selected.meta_title, current.meta_title),
            meta_description: field(selected.meta_description, current.meta_description),
        };
    }, [selected, current]);

    const changed = (parts: DiffPart[] | undefined) => Boolean(parts?.some((part) => part.type !== 'same'));
    const unchanged = changes !== null && !Object.values(changes).some(changed);

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => {
                    setOpen(true);
                    load();
                }}
            >
                <History /> {t('dashboard.revisions.button')}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{t('dashboard.revisions.title')}</DialogTitle>
                        <DialogDescription>{t('dashboard.revisions.description')}</DialogDescription>
                    </DialogHeader>

                    {revisions === null ? (
                        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" /> {t('dashboard.revisions.loading')}
                        </div>
                    ) : revisions.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">{t('dashboard.revisions.empty')}</p>
                    ) : (
                        <div className="grid max-h-[65vh] gap-4 md:grid-cols-[14rem_1fr]">
                            <ul className="space-y-1 overflow-y-auto pr-1" aria-label={t('dashboard.revisions.title')}>
                                {revisions.map((revision) => (
                                    <li key={revision.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(revision)}
                                            aria-current={selected?.id === revision.id}
                                            className={cn(
                                                'w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                                                selected?.id === revision.id && 'bg-accent',
                                            )}
                                        >
                                            <span className="block font-medium tabular-nums">{new Date(revision.created_at).toLocaleString()}</span>
                                            <span className="block text-xs text-muted-foreground">{revision.user ?? t('dashboard.revisions.unknown_user')}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {selected && (
                                <div className="flex min-w-0 flex-col gap-3 overflow-y-auto rounded-md border p-4">
                                    {current && (
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <ToggleGroup
                                                type="single"
                                                size="sm"
                                                variant="outline"
                                                value={mode}
                                                onValueChange={(value) => value && setMode(value as 'changes' | 'version')}
                                            >
                                                <ToggleGroupItem value="changes" className="px-3">
                                                    {t('dashboard.revisions.show_changes')}
                                                </ToggleGroupItem>
                                                <ToggleGroupItem value="version" className="px-3">
                                                    {t('dashboard.revisions.show_version')}
                                                </ToggleGroupItem>
                                            </ToggleGroup>
                                            {mode === 'changes' && (
                                                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span>
                                                        <del className="bg-destructive/15 text-destructive">{t('dashboard.revisions.legend_removed')}</del>
                                                    </span>
                                                    <span>
                                                        <ins className="bg-primary/15 no-underline">{t('dashboard.revisions.legend_added')}</ins>
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {mode === 'changes' && changes ? (
                                        unchanged ? (
                                            <p className="py-6 text-center text-sm text-muted-foreground">{t('dashboard.revisions.same_as_current')}</p>
                                        ) : (
                                            <>
                                                <h3 className="text-lg font-semibold">
                                                    <Diff parts={changes.title} />
                                                </h3>
                                                {changed(changes.excerpt) || selected.excerpt ? (
                                                    <p className="text-sm text-muted-foreground">
                                                        <Diff parts={changes.excerpt} />
                                                    </p>
                                                ) : null}
                                                <p className="text-sm whitespace-pre-line">
                                                    <Diff parts={changes.content} />
                                                </p>
                                                {(changed(changes.meta_title) || changed(changes.meta_description)) && (
                                                    <dl className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                                                        <div>
                                                            <dt className="inline font-medium">{t('dashboard.revisions.seo_title')}: </dt>
                                                            <dd className="inline">
                                                                <Diff parts={changes.meta_title} />
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-medium">{t('dashboard.revisions.seo_description')}: </dt>
                                                            <dd className="inline">
                                                                <Diff parts={changes.meta_description} />
                                                            </dd>
                                                        </div>
                                                    </dl>
                                                )}
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <h3 className="text-lg font-semibold">{selected.title}</h3>
                                            {selected.excerpt && <p className="text-sm text-muted-foreground">{selected.excerpt}</p>}
                                            <p className="text-sm whitespace-pre-line">
                                                {toText(selected.content) || <em className="text-muted-foreground">{t('dashboard.revisions.no_content')}</em>}
                                            </p>
                                            {(selected.meta_title || selected.meta_description) && (
                                                <dl className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                                                    {selected.meta_title && (
                                                        <div>
                                                            <dt className="inline font-medium">{t('dashboard.revisions.seo_title')}: </dt>
                                                            <dd className="inline">{selected.meta_title}</dd>
                                                        </div>
                                                    )}
                                                    {selected.meta_description && (
                                                        <div>
                                                            <dt className="inline font-medium">{t('dashboard.revisions.seo_description')}: </dt>
                                                            <dd className="inline">{selected.meta_description}</dd>
                                                        </div>
                                                    )}
                                                </dl>
                                            )}
                                        </>
                                    )}

                                    <div className="mt-auto flex justify-end pt-2">
                                        <Button type="button" size="sm" disabled={restoring} onClick={() => restore(selected)}>
                                            {restoring ? <Loader2 className="animate-spin" /> : <RotateCcw />} {t('dashboard.revisions.restore')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
