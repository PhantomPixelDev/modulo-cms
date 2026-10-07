import { usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import type { CustomFieldValues } from '../posts/CustomFieldInputs';
import { initialEditorState, normalizeFeaturedImage, serializeEditor, type EditorAction, type EditorContent, type EditorSubmission } from './editor';
import { useEditorRecovery } from './useEditorRecovery';

export function useContentEditor(
    item: EditorContent | undefined,
    type: 'post' | 'page',
    locale: string,
    onSubmit: (data: EditorSubmission) => Promise<boolean>,
    defaultStatus = 'draft',
) {
    const props = usePage().props;
    const timezone = String((props.settings as { timezone?: string } | undefined)?.timezone ?? 'UTC');
    const userId = (props.auth as { user?: { id: number } } | undefined)?.user?.id ?? 0;
    const [form, setForm] = useState(() => initialEditorState(item, timezone, defaultStatus));
    const [fieldValues, setFieldValues] = useState<CustomFieldValues>(item?.meta_data?.fields ?? {});
    const payload = serializeEditor(form, fieldValues);
    const recovery = useEditorRecovery(userId, item?.id, type, locale, payload);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editorKey, setEditorKey] = useState(0);
    const [actionError, setActionError] = useState('');
    const submitting = useRef(false);
    const baselineStatus = useRef(item?.status ?? defaultStatus);
    const save = async (action: EditorAction) => {
        if (submitting.current) return;
        if (action === 'schedule' && !form.published_at) {
            setActionError('Choose a publication date first.');
            return;
        }
        submitting.current = true;
        setIsSubmitting(true);
        setActionError('');
        try {
            await recovery.pause();
            const status = action === 'draft' ? 'draft' : action === 'publish' || action === 'schedule' ? 'published' : baselineStatus.current;
            const saved = await onSubmit({
                ...payload,
                status,
                published_at: action === 'draft' ? '' : action === 'publish' ? '' : payload.published_at,
                editor_action: action,
                editor_draft_id: recovery.draft.current?.id,
                editor_draft_revision: recovery.draft.current?.revision,
            });
            if (saved) {
                baselineStatus.current = status;
                const next = { ...form, status, published_at: action === 'draft' || action === 'publish' ? '' : form.published_at };
                setForm(next);
                recovery.savedExplicitly(serializeEditor(next, fieldValues));
            }
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Saving failed. Your input is still here.');
        } finally {
            recovery.resume();
            submitting.current = false;
            setIsSubmitting(false);
        }
    };
    const restore = () => {
        const recovered = recovery.recovered?.payload;
        if (!recovered) return;
        const next = {
            ...form,
            ...recovered,
            title: recovered.title ?? '',
            content: recovered.content ?? '',
            excerpt: recovered.excerpt ?? '',
            published_at: recovered.published_at ?? form.published_at,
            status: baselineStatus.current,
            post_type_id: String(recovered.post_type_id ?? form.post_type_id),
            parent_id: recovered.parent_id === undefined ? form.parent_id : String(recovered.parent_id ?? 'none'),
            author_id: String(recovered.author_id ?? form.author_id),
            featured_image: normalizeFeaturedImage(recovered.featured_image ?? form.featured_image),
        };
        const fields = recovered.meta_data?.fields ? (recovered.meta_data.fields as CustomFieldValues) : fieldValues;
        setForm(next);
        setFieldValues(fields);
        setEditorKey((value) => value + 1);
        recovery.acceptRecovered(serializeEditor(next, fields));
    };
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        void save((submitter?.value as EditorAction | undefined) ?? (item?.id ? 'update' : 'draft'));
    };
    return { form, setForm, fieldValues, setFieldValues, isSubmitting, recovery, editorKey, restore, save, handleSubmit, timezone, actionError };
}
