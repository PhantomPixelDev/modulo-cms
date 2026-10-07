import { ApiError, apiDelete, apiGet, apiPost } from '@/lib/api';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorPayload } from './editor';

export interface RecoveryDraft {
    id: string;
    revision: number;
    user_id: number;
    post_id: number | null;
    content_type: 'post' | 'page';
    locale: string;
    payload: Partial<EditorPayload>;
    updated_at: string;
}
export function useEditorRecovery(userId: number, postId: number | undefined, type: 'post' | 'page', locale: string, payload: EditorPayload) {
    const key = `modulo:editor:${userId}:${type}:${postId ?? 'new'}:${locale}`;
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [recovered, setRecovered] = useState<RecoveryDraft | null>(null);
    const [message, setMessage] = useState('');
    const draft = useRef<RecoveryDraft | null>(null);
    const latest = useRef(payload);
    latest.current = payload;
    const serialized = JSON.stringify(payload);
    const saved = useRef(serialized);
    const queue = useRef<Promise<void>>(Promise.resolve());
    const ready = useRef(false);
    const [loaded, setLoaded] = useState(false);
    const blocked = useRef(false);
    const awaitingRecovery = useRef(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const id = new URLSearchParams(window.location.search).get('draft') || localStorage.getItem(key);
                const found = id
                    ? (await apiGet<{ draft: RecoveryDraft }>(route('dashboard.admin.editor-drafts.show', { draft: id }))).draft
                    : (await apiGet<{ drafts: RecoveryDraft[] }>(route('dashboard.admin.editor-drafts.index'))).drafts.find(
                          (entry) => entry.post_id === (postId ?? null) && entry.content_type === type && entry.locale === locale,
                      );
                if (!cancelled && found && found.post_id === (postId ?? null) && found.locale === locale && found.content_type === type) {
                    draft.current = found;
                    localStorage.setItem(key, found.id);
                    setRecovered(found);
                    awaitingRecovery.current = true;
                }
            } catch {
                // A deleted draft identifier never prevents editing.
                localStorage.removeItem(key);
            } finally {
                if (!cancelled) {
                    ready.current = true;
                    setLoaded(true);
                }
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [key, postId, type, locale]);

    const flush = useCallback(() => {
        const operation = queue.current
            .catch(() => undefined)
            .then(async () => {
                if (!ready.current || blocked.current || awaitingRecovery.current)
                    throw new Error('Recover or discard the saved draft before previewing.');
                const body = JSON.stringify(latest.current);
                if (body === saved.current) return;
                setStatus('saving');
                try {
                    const result = await apiPost<{ draft: RecoveryDraft }>(route('dashboard.admin.editor-drafts.store'), {
                        id: draft.current?.id,
                        revision: draft.current?.revision ?? 0,
                        post_id: postId ?? null,
                        content_type: type,
                        locale,
                        payload: latest.current,
                    });
                    draft.current = result.draft;
                    localStorage.setItem(key, result.draft.id);
                    saved.current = body;
                    setSavedAt(result.draft.updated_at);
                    setMessage('');
                    setStatus('saved');
                } catch (error) {
                    if (error instanceof ApiError && error.status === 404) {
                        draft.current = null;
                        localStorage.removeItem(key);
                    }
                    if (error instanceof ApiError && error.status === 409 && error.data.draft) {
                        const newer = error.data.draft as RecoveryDraft;
                        draft.current = newer;
                        awaitingRecovery.current = true;
                        setRecovered(newer);
                    }
                    setStatus('error');
                    setMessage(error instanceof Error ? error.message : 'Could not save recovery draft');
                    throw error;
                }
            });
        queue.current = operation;
        return operation;
    }, [key, postId, type, locale]);

    useEffect(() => {
        if (!loaded || serialized === saved.current || recovered) return;
        const timer = window.setTimeout(() => {
            void flush().catch(() => undefined);
        }, 3000);
        return () => window.clearTimeout(timer);
    }, [serialized, recovered, loaded, flush]);

    useEffect(() => {
        const dirty = () => JSON.stringify(latest.current) !== saved.current;
        const unload = (event: BeforeUnloadEvent) => {
            if (dirty()) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', unload);
        const unsubscribe = router.on('before', (event) => {
            if (event.detail.visit.method === 'get' && dirty() && !window.confirm('This work has not reached the server. Leave anyway?'))
                event.preventDefault();
        });
        return () => {
            window.removeEventListener('beforeunload', unload);
            unsubscribe();
        };
    }, []);

    const discard = async () => {
        await queue.current.catch(() => undefined);
        if (draft.current) await apiDelete(route('dashboard.admin.editor-drafts.destroy', { draft: draft.current.id }));
        draft.current = null;
        awaitingRecovery.current = false;
        setRecovered(null);
        localStorage.removeItem(key);
        saved.current = JSON.stringify(latest.current);
        setStatus('idle');
    };
    const pause = async () => {
        blocked.current = true;
        await queue.current.catch(() => undefined);
    };
    const resume = () => {
        blocked.current = false;
    };
    const savedExplicitly = (payload: EditorPayload) => {
        draft.current = null;
        localStorage.removeItem(key);
        saved.current = JSON.stringify(payload);
        setRecovered(null);
        awaitingRecovery.current = false;
        setMessage('');
        setStatus('idle');
    };
    const acceptRecovered = (payload: EditorPayload) => {
        saved.current = JSON.stringify(payload);
        latest.current = payload;
        setSavedAt(draft.current?.updated_at ?? null);
        setStatus('saved');
        awaitingRecovery.current = false;
        setRecovered(null);
        setMessage('');
    };
    return { status, savedAt, recovered, setRecovered, acceptRecovered, message, flush, discard, pause, resume, savedExplicitly, draft };
}
