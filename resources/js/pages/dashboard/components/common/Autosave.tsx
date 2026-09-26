import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { Check, CloudOff, Eye, History, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface AutosaveFields {
    title: string;
    excerpt: string;
    content: string;
}

interface RecoveredAutosave extends AutosaveFields {
    saved_at: string;
}

type Status = 'idle' | 'saving' | 'saved' | 'error';

/** How long typing has to pause before the draft is written. */
const DEBOUNCE_MS = 3000;

const request = (method: string, url: string, body?: unknown) =>
    fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
        },
        credentials: 'same-origin',
        body: body === undefined ? undefined : JSON.stringify(body),
    }).then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json();
    });

const formatTime = (iso: string | Date) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/**
 * Keeps the editor's unsaved text on the server (per post and user) shortly
 * after typing stops, and offers back an autosave left over from a closed
 * tab. Only for content that already exists; new posts have nothing to
 * attach it to yet.
 */
export function useAutosave(postId: number | undefined, fields: AutosaveFields, enabled = true) {
    const [status, setStatus] = useState<Status>('idle');
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [recovered, setRecovered] = useState<RecoveredAutosave | null>(null);
    const serialized = JSON.stringify(fields);
    const lastSaved = useRef(serialized);
    const latest = useRef(fields);
    latest.current = fields;
    const active = enabled && Boolean(postId);

    useEffect(() => {
        if (!active) return;
        request('GET', route('dashboard.admin.autosave.show', { postId }))
            .then((data: { autosave: RecoveredAutosave | null }) => setRecovered(data.autosave))
            .catch(() => undefined);
    }, [active, postId]);

    const flush = useCallback(async () => {
        if (!active) return;
        const body = JSON.stringify(latest.current);
        if (body === lastSaved.current) return;
        setStatus('saving');
        try {
            const data = await request('PUT', route('dashboard.admin.autosave.store', { postId }), latest.current);
            lastSaved.current = body;
            setSavedAt(data.saved_at);
            setStatus('saved');
        } catch {
            setStatus('error');
        }
    }, [active, postId]);

    useEffect(() => {
        if (!active || serialized === lastSaved.current) return;
        const timer = window.setTimeout(flush, DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [active, serialized, flush]);

    const discardRecovered = useCallback(() => {
        setRecovered(null);
        if (active) request('DELETE', route('dashboard.admin.autosave.destroy', { postId })).catch(() => undefined);
    }, [active, postId]);

    return { status, savedAt, recovered, setRecovered, discardRecovered, flush };
}

/** A quiet line next to the save button: saving, saved at, or failed. */
export function AutosaveStatus({ status, savedAt }: { status: Status; savedAt: string | null }) {
    const { t } = useTranslation();
    if (status === 'idle') return null;

    return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" role="status" aria-live="polite">
            {status === 'saving' && (
                <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('dashboard.editor.autosave.saving')}
                </>
            )}
            {status === 'saved' && savedAt && (
                <>
                    <Check className="h-3 w-3" />
                    {t('dashboard.editor.autosave.saved', { time: formatTime(savedAt) })}
                </>
            )}
            {status === 'error' && (
                <span className="inline-flex items-center gap-1 text-destructive" title={t('dashboard.editor.autosave.failed_hint')}>
                    <CloudOff className="h-3 w-3" />
                    {t('dashboard.editor.autosave.failed')}
                </span>
            )}
        </span>
    );
}

/** Offers back text that was autosaved but never saved. */
export function RecoverAutosave({
    recovered,
    onRestore,
    onDiscard,
}: {
    recovered: RecoveredAutosave | null;
    onRestore: (fields: AutosaveFields) => void;
    onDiscard: () => void;
}) {
    const { t } = useTranslation();
    if (!recovered) return null;

    return (
        <Alert>
            <History className="h-4 w-4" />
            <AlertTitle>{t('dashboard.editor.autosave.recovered_title', { time: new Date(recovered.saved_at).toLocaleString() })}</AlertTitle>
            <AlertDescription>
                <p>{t('dashboard.editor.autosave.recovered_body')}</p>
                <div className="mt-2 flex gap-2">
                    <Button type="button" size="sm" onClick={() => onRestore(recovered)}>
                        {t('dashboard.editor.autosave.restore')}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={onDiscard}>
                        {t('dashboard.editor.autosave.discard')}
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
}

/**
 * Opens the post as the theme will show it, including unsaved text: the
 * draft is written first, then a short-lived signed link is opened.
 */
export function PreviewButton({ postId, flush }: { postId: number; flush: () => Promise<void> }) {
    const { t } = useTranslation();
    const [busy, setBusy] = useState(false);

    const open = async () => {
        // Open the tab now, inside the click, or popup blockers step in
        const tab = window.open('about:blank', '_blank');
        setBusy(true);
        try {
            await flush();
            const { url } = await request('POST', route('dashboard.admin.preview.link', { postId }));
            if (tab) tab.location.href = url;
            else window.location.href = url;
        } catch {
            tab?.close();
            window.alert(t('dashboard.editor.preview_failed'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Button type="button" variant="outline" size="sm" className="h-9 gap-2" onClick={open} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            {t('dashboard.editor.preview')}
        </Button>
    );
}
