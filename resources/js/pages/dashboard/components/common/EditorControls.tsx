import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { usePage } from '@inertiajs/react';
import { AutosaveStatus, PreviewButton, RecoverAutosave } from './Autosave';
import type { useContentEditor } from './useContentEditor';

export function EditorControls({
    editor,
    postId,
    locale,
    canPublish,
    onCancel,
}: {
    editor: ReturnType<typeof useContentEditor>;
    postId?: number;
    locale: string;
    canPublish: boolean;
    onCancel: () => void;
}) {
    const { t } = useTranslation();
    const errors = usePage().props.errors;
    const published = editor.form.status === 'published';
    const recovered = editor.recovery.recovered;
    return (
        <div className="space-y-3 border-t bg-background py-4">
            <RecoverAutosave
                recovered={
                    recovered
                        ? {
                              title: recovered.payload.title ?? '',
                              excerpt: recovered.payload.excerpt ?? '',
                              content: recovered.payload.content ?? '',
                              saved_at: recovered.updated_at,
                          }
                        : null
                }
                onRestore={editor.restore}
                onDiscard={() => {
                    void editor.recovery.discard();
                }}
            />
            {(editor.actionError || editor.recovery.message) && (
                <p role="alert" className="text-sm text-destructive">
                    {editor.actionError || editor.recovery.message}
                </p>
            )}
            {Object.keys(errors ?? {}).length > 0 && (
                <ul role="alert" className="space-y-1 text-sm text-destructive">
                    {Object.entries(errors).map(([field, error]) => (
                        <li key={field}>{error}</li>
                    ))}
                </ul>
            )}
            {published && <p className="text-sm text-muted-foreground">{t('dashboard.editor.unpublish_hint')}</p>}
            <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={editor.isSubmitting}>
                    {t('dashboard.common.cancel')}
                </Button>
                <Button type="submit" name="editor_action" value="draft" variant="outline" disabled={editor.isSubmitting}>
                    {t(published ? 'dashboard.editor.unpublish' : 'dashboard.posts.form.buttons.save_draft')}
                </Button>
                {postId && (
                    <Button type="submit" name="editor_action" value="update" disabled={editor.isSubmitting}>
                        {t('dashboard.posts.form.buttons.update')}
                    </Button>
                )}
                {canPublish && (
                    <Button type="submit" name="editor_action" value="publish" disabled={editor.isSubmitting}>
                        {t('dashboard.posts.form.buttons.publish')}
                    </Button>
                )}
                {canPublish && (
                    <Button type="submit" name="editor_action" value="schedule" variant="outline" disabled={editor.isSubmitting}>
                        {t('dashboard.editor.schedule')}
                    </Button>
                )}
                {postId && (
                    <PreviewButton postId={postId} flush={editor.recovery.flush} locale={locale} getDraft={() => editor.recovery.draft.current?.id} />
                )}
                <AutosaveStatus status={editor.recovery.status} savedAt={editor.recovery.savedAt} />
            </div>
            <p className="text-xs text-muted-foreground">{t('dashboard.editor.all_languages')}</p>
            {!postId && <p className="text-xs text-muted-foreground">{t('dashboard.editor.preview_after_save')}</p>}
        </div>
    );
}
