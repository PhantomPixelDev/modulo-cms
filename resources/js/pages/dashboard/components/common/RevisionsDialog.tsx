import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { History, Loader2, RotateCcw } from 'lucide-react';
import { useState } from 'react';

declare const route: (name: string, params?: any) => string;

interface Revision {
    id: number;
    title: string;
    excerpt: string | null;
    content: string | null;
    meta_title: string | null;
    meta_description: string | null;
    user: string | null;
    created_at: string;
}

/** Stored content is HTML; preview it as text so nothing in it runs here. */
const toText = (html: string | null) => (html ? (new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '').trim() : '');

/**
 * Earlier versions of a post or page, with a preview and one-click restore.
 * Restoring keeps the current text as a revision, so it can be undone too.
 */
export function RevisionsDialog({ postId }: { postId: number }) {
    const [open, setOpen] = useState(false);
    const [revisions, setRevisions] = useState<Revision[] | null>(null);
    const [selected, setSelected] = useState<Revision | null>(null);
    const [restoring, setRestoring] = useState(false);

    const load = () => {
        setRevisions(null);
        fetch(route('dashboard.admin.revisions.index', { postId }), { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
            .then((response) => (response.ok ? response.json() : { revisions: [] }))
            .then((data: { revisions: Revision[] }) => {
                setRevisions(data.revisions);
                setSelected(data.revisions[0] ?? null);
            })
            .catch(() => setRevisions([]));
    };

    const restore = (revision: Revision) => {
        if (!window.confirm('Replace the current text with this version? Unsaved changes in the editor are lost.')) return;
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

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                    setOpen(true);
                    load();
                }}
            >
                <History /> Revisions
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Revisions</DialogTitle>
                        <DialogDescription>Earlier versions of the title, excerpt, content and SEO fields, saved on every change.</DialogDescription>
                    </DialogHeader>

                    {revisions === null ? (
                        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" /> Loading…
                        </div>
                    ) : revisions.length === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            No earlier versions yet. One is kept every time the text changes.
                        </p>
                    ) : (
                        <div className="grid max-h-[65vh] gap-4 md:grid-cols-[14rem_1fr]">
                            <ul className="space-y-1 overflow-y-auto pr-1">
                                {revisions.map((revision) => (
                                    <li key={revision.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelected(revision)}
                                            className={cn(
                                                'w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent',
                                                selected?.id === revision.id && 'bg-accent',
                                            )}
                                        >
                                            <span className="block font-medium tabular-nums">{new Date(revision.created_at).toLocaleString()}</span>
                                            <span className="block text-xs text-muted-foreground">{revision.user ?? 'Unknown'}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {selected && (
                                <div className="flex min-w-0 flex-col gap-3 overflow-y-auto rounded-md border p-4">
                                    <h3 className="text-lg font-semibold">{selected.title}</h3>
                                    {selected.excerpt && <p className="text-sm text-muted-foreground">{selected.excerpt}</p>}
                                    <p className="text-sm whitespace-pre-line">
                                        {toText(selected.content) || <em className="text-muted-foreground">No content</em>}
                                    </p>
                                    {(selected.meta_title || selected.meta_description) && (
                                        <dl className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                                            {selected.meta_title && (
                                                <div>
                                                    <dt className="inline font-medium">SEO title: </dt>
                                                    <dd className="inline">{selected.meta_title}</dd>
                                                </div>
                                            )}
                                            {selected.meta_description && (
                                                <div>
                                                    <dt className="inline font-medium">SEO description: </dt>
                                                    <dd className="inline">{selected.meta_description}</dd>
                                                </div>
                                            )}
                                        </dl>
                                    )}
                                    <div className="mt-auto flex justify-end pt-2">
                                        <Button type="button" size="sm" disabled={restoring} onClick={() => restore(selected)}>
                                            {restoring ? <Loader2 className="animate-spin" /> : <RotateCcw />} Restore this version
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
