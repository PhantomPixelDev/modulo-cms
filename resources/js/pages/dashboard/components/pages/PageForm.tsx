import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActionButtonGroup } from '@/components/ui/button-groups';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';
import { usePage } from '@inertiajs/react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import type { CustomFieldDefinition } from '../../types';
import { AutosaveStatus, PreviewButton, RecoverAutosave, useAutosave, type AutosaveFields } from '../common/Autosave';
import { RevisionsDialog } from '../common/RevisionsDialog';
import { CustomFieldInputs, type CustomFieldValues } from '../posts/CustomFieldInputs';

import type { FeaturedImagePreview } from '../posts/types';

import MediaPickerDialog from '../media/MediaPickerDialog';
import SlateEditor from '../posts/SlateEditor';

export interface PageFormProps {
    page?: any;
    isEditing: boolean;
    onSubmit: (data: any) => Promise<void> | void;
    onCancel: () => void;
    authors?: Array<{ id: number; name: string }>;
    canEditAuthor?: boolean;
    defaultStatus?: string;
    /** Pages this one can sit under */
    parents?: Array<{ id: number; title: string }>;
    /** The page type's custom fields */
    fields?: CustomFieldDefinition[];
}

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const normalizeFeaturedImage = (source: any): FeaturedImagePreview | null => {
    if (!source) return null;

    if (typeof source === 'string') {
        return { url: source };
    }

    if (typeof source === 'object') {
        const url = source.url ?? source.src ?? '';
        if (!url) return null;
        return {
            id: typeof source.id === 'number' ? source.id : undefined,
            url,
            thumb: source.thumb ?? source.preview_url ?? undefined,
            name: source.name ?? source.file_name ?? source.alt ?? undefined,
            mime_type: source.mime_type,
            file_name: source.file_name,
        };
    }

    return null;
};

export function PageForm({
    page,
    isEditing,
    authors = [],
    canEditAuthor = false,
    defaultStatus = 'draft',
    parents = [],
    fields = [],
    onSubmit,
    onCancel,
}: PageFormProps) {
    const { t } = useTranslation();
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const [fieldValues, setFieldValues] = useState<CustomFieldValues>(page?.meta_data?.fields ?? {});
    const formRef = useRef<HTMLFormElement | null>(null);
    const [activeTab, setActiveTab] = useState('content');
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialFeaturedImage = normalizeFeaturedImage(page?.featured_image);

    const [form, setForm] = useState(() => {
        // Initialize with empty content by default
        let initialContent = '';

        try {
            if (page?.content) {
                // If content is already a string, use it directly
                if (typeof page.content === 'string') {
                    // Check if it's a JSON string or HTML
                    try {
                        const parsed = JSON.parse(page.content);
                        // If it parses to an array, it's likely Slate JSON
                        if (Array.isArray(parsed)) {
                            initialContent = page.content; // Keep as JSON string
                        } else {
                            initialContent = page.content; // Use as is (might be HTML)
                        }
                    } catch (e) {
                        // If it's not valid JSON, use as is (might be HTML)
                        initialContent = page.content;
                    }
                } else {
                    // If it's an object/array, stringify it
                    initialContent = JSON.stringify(page.content);
                }
            }
        } catch (e) {
            console.error('Error parsing page content:', e);
        }

        return {
            title: page?.title ?? '',
            slug: page?.slug ?? '',
            status: page?.status ?? defaultStatus,
            content: initialContent, // This is a string (JSON or HTML)
            excerpt: page?.excerpt ?? '',
            featured_image: initialFeaturedImage,
            meta_title: page?.meta_title ?? '',
            meta_description: page?.meta_description ?? '',
            author_id: page?.author_id?.toString() ?? '',
            published_at: page?.published_at ? new Date(page.published_at).toISOString().slice(0, 16) : '',
            parent_id: page?.parent_id ? String(page.parent_id) : 'none',
            meta_data: (() => {
                const rest = { ...(page?.meta_data ?? {}) };
                delete rest.fields;
                return rest as Record<string, unknown>;
            })(),
        };
    });

    const autosave = useAutosave(page?.id, { title: form.title, excerpt: form.excerpt, content: form.content }, Boolean(isEditing));
    const [editorKey, setEditorKey] = useState(0);
    const restoreAutosave = (fields: AutosaveFields) => {
        setForm((prev) => ({ ...prev, title: fields.title ?? '', excerpt: fields.excerpt ?? '', content: fields.content ?? '' }));
        // The editor keeps its own state; remount it with the restored text
        setEditorKey((key) => key + 1);
        autosave.setRecovered(null);
    };

    // Handle content changes from SlateEditor
    const handleContentChange = useCallback((html: string) => {
        setForm((f) => ({
            ...f,
            content: html,
        }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // The content should already be a string (JSON or HTML) from the SlateEditor
            let contentToSubmit = form.content;

            // If it's not a string, try to stringify it
            if (contentToSubmit && typeof contentToSubmit !== 'string') {
                contentToSubmit = JSON.stringify(contentToSubmit);
            }

            // Prepare the form data
            const featuredImageUrl = form.featured_image
                ? typeof form.featured_image === 'string'
                    ? form.featured_image
                    : form.featured_image.url
                : null;

            const formData = {
                ...form,
                featured_image: featuredImageUrl,
                content: contentToSubmit,
                author_id: form.author_id ? parseInt(form.author_id, 10) : null,
                parent_id: form.parent_id !== 'none' ? parseInt(form.parent_id, 10) : null,
                published_at: form.published_at || null,
                meta_data: { ...form.meta_data, fields: fieldValues },
            };

            await onSubmit(formData);
        } catch (error) {
            console.error('Error submitting form:', error);
            throw error; // Re-throw to let the parent component handle the error
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFeaturedImageSelect = (media: any) => {
        const normalized = normalizeFeaturedImage(media);
        setForm((f) => ({
            ...f,
            featured_image: normalized,
        }));
        setShowMediaPicker(false);
    };

    const handleFeaturedImageRemove = () => {
        setForm((f) => ({
            ...f,
            featured_image: null,
        }));
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((f) => ({ ...f, slug: e.target.value }));
    };

    const handleSlugGenerate = () => {
        setForm((f) => ({
            ...f,
            slug: slugify(f.slug || f.title),
        }));
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((f) => ({
            ...f,
            title: e.target.value,
            // Auto-generate meta title if not set or if it matches the previous title
            meta_title: !f.meta_title || f.meta_title === f.title ? e.target.value : f.meta_title,
            // Auto-generate slug if not manually modified
            slug: f.slug ? f.slug : slugify(e.target.value),
        }));
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <RecoverAutosave recovered={autosave.recovered} onRestore={restoreAutosave} onDiscard={autosave.discardRecovered} />
            <div className="space-y-2 sm:flex sm:items-start sm:justify-between sm:space-y-0">
                <div className="max-w-xl text-sm text-muted-foreground">
                    <p>{isEditing ? t('dashboard.pages.form.description.edit') : t('dashboard.pages.form.description.create')}</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground/90">
                        <li key="content">{t('dashboard.pages.form.description.bullets.content')}</li>
                        <li key="seo">{t('dashboard.pages.form.description.bullets.seo')}</li>
                        <li key="publish">{t('dashboard.pages.form.description.bullets.publish')}</li>
                    </ul>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {isEditing && <AutosaveStatus status={autosave.status} savedAt={autosave.savedAt} />}
                    <Select value={form.status} onValueChange={(status) => setForm((f) => ({ ...f, status }))}>
                        <SelectTrigger className="h-9 w-36" aria-label={t('dashboard.pages.form.fields.status')}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {['draft', 'published', 'private', 'archived'].map((status) => (
                                <SelectItem key={status} value={status}>
                                    {t(`common.status.${status}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {isEditing && page?.id && <PreviewButton postId={page.id} flush={autosave.flush} />}
                    {isEditing && page?.id && <RevisionsDialog postId={page.id} />}
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        {t('dashboard.common.cancel')}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isEditing ? t('dashboard.pages.form.actions.saving_edit') : t('dashboard.pages.form.actions.saving_create')}
                            </>
                        ) : isEditing ? (
                            t('dashboard.pages.form.actions.update')
                        ) : (
                            t('dashboard.pages.form.actions.create')
                        )}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="content">{t('dashboard.pages.form.tabs.content')}</TabsTrigger>
                    <TabsTrigger value="seo">{t('dashboard.pages.form.tabs.seo')}</TabsTrigger>
                    <TabsTrigger value="advanced">{t('dashboard.pages.form.tabs.advanced')}</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-6 pt-4">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="title">{t('dashboard.pages.form.fields.title')}</Label>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={handleTitleChange}
                                placeholder={t('dashboard.pages.form.placeholders.title')}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="slug">{t('dashboard.pages.form.fields.slug')}</Label>
                            <div className="flex space-x-2">
                                <Input
                                    id="slug"
                                    value={form.slug}
                                    onChange={handleSlugChange}
                                    placeholder={t('dashboard.pages.form.placeholders.slug')}
                                    className="flex-1"
                                />
                                <Button type="button" variant="outline" onClick={handleSlugGenerate}>
                                    {t('dashboard.pages.form.actions.generate_slug')}
                                </Button>
                            </div>
                        </div>

                        <div>
                            <Label>{t('dashboard.pages.form.fields.featured_image')}</Label>
                            <div className="mt-1 flex flex-wrap items-center gap-4">
                                {form.featured_image && typeof form.featured_image === 'object' && (
                                    <div className="group relative">
                                        <img
                                            src={form.featured_image.thumb || form.featured_image.url}
                                            alt={form.featured_image.name || form.title || 'Featured'}
                                            className="h-24 w-24 rounded-md object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={handleFeaturedImageRemove}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowMediaPicker(true)}>
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        {form.featured_image
                                            ? t('dashboard.pages.form.actions.change_image')
                                            : t('dashboard.pages.form.actions.select_image')}
                                    </Button>
                                    <Badge variant="outline" className="px-2">
                                        {form.featured_image
                                            ? form.featured_image.name || form.featured_image.file_name || t('dashboard.pages.form.selected_image')
                                            : t('dashboard.pages.form.no_image_selected')}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="excerpt">{t('dashboard.pages.form.fields.excerpt')}</Label>
                            <Textarea
                                id="excerpt"
                                value={form.excerpt}
                                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                                placeholder={t('dashboard.pages.form.placeholders.excerpt')}
                                rows={3}
                            />
                        </div>

                        {fields.length > 0 && (
                            <div className="space-y-4 rounded-lg border p-4">
                                <div>
                                    <h3 className="text-sm font-bold">
                                        {t('dashboard.posts.form.details_title', { type: t('dashboard.pages.title') })}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">{t('dashboard.posts.form.details_hint')}</p>
                                </div>
                                <CustomFieldInputs fields={fields} values={fieldValues} onChange={setFieldValues} errors={errors} />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>{t('dashboard.pages.form.fields.content')}</Label>
                            <div className="rounded-md border">
                                <SlateEditor
                                    key={`${page?.id || 'new-page'}-${editorKey}`}
                                    initialHTML={form.content}
                                    onHTMLChange={handleContentChange}
                                />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-6 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.pages.form.seo.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="meta_title">{t('dashboard.pages.form.seo.meta_title')}</Label>
                                <Input
                                    id="meta_title"
                                    value={form.meta_title}
                                    onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                                    placeholder={t('dashboard.pages.form.placeholders.meta_title')}
                                    maxLength={60}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('dashboard.pages.form.seo.meta_title_hint', { count: form.meta_title.length })}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="meta_description">{t('dashboard.pages.form.seo.meta_description')}</Label>
                                <Textarea
                                    id="meta_description"
                                    value={form.meta_description}
                                    onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                                    placeholder={t('dashboard.pages.form.placeholders.meta_description')}
                                    rows={3}
                                    maxLength={160}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('dashboard.pages.form.seo.meta_description_hint', { count: form.meta_description.length })}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="og_image">{t('dashboard.posts.form.seo.social_image')}</Label>
                                <Input
                                    id="og_image"
                                    value={String(form.meta_data.og_image ?? '')}
                                    onChange={(e) => setForm((f) => ({ ...f, meta_data: { ...f.meta_data, og_image: e.target.value } }))}
                                    placeholder={t('dashboard.posts.form.seo.social_image_placeholder')}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.posts.form.seo.social_image_hint')}</p>
                            </div>

                            <div>
                                <Label htmlFor="canonical_url">{t('dashboard.posts.form.seo.canonical')}</Label>
                                <Input
                                    id="canonical_url"
                                    value={String(form.meta_data.canonical_url ?? '')}
                                    onChange={(e) => setForm((f) => ({ ...f, meta_data: { ...f.meta_data, canonical_url: e.target.value } }))}
                                    placeholder="https://…"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">{t('dashboard.posts.form.seo.canonical_hint')}</p>
                            </div>

                            <label className="flex items-start gap-3 rounded-md border p-3">
                                <Checkbox
                                    checked={form.meta_data.noindex === true || form.meta_data.noindex === 'true'}
                                    onCheckedChange={(checked) =>
                                        setForm((f) => ({ ...f, meta_data: { ...f.meta_data, noindex: checked === true } }))
                                    }
                                />
                                <span className="space-y-0.5">
                                    <span className="block text-sm font-medium">{t('dashboard.posts.form.seo.noindex')}</span>
                                    <span className="block text-xs text-muted-foreground">{t('dashboard.posts.form.seo.noindex_hint')}</span>
                                </span>
                            </label>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.pages.form.advanced.title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {parents.length > 0 && (
                                    <div className="space-y-1.5">
                                        <Label>{t('dashboard.pages.form.fields.parent')}</Label>
                                        <Select value={form.parent_id} onValueChange={(parent_id) => setForm((f) => ({ ...f, parent_id }))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">{t('dashboard.pages.form.no_parent')}</SelectItem>
                                                {parents.map((parent) => (
                                                    <SelectItem key={parent.id} value={String(parent.id)}>
                                                        {parent.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">{t('dashboard.pages.form.parent_hint')}</p>
                                    </div>
                                )}

                                {canEditAuthor && authors.length > 0 && (
                                    <div>
                                        <Label htmlFor="author">{t('dashboard.pages.form.fields.author')}</Label>
                                        <select
                                            id="author"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            value={form.author_id}
                                            onChange={(e) => setForm((f) => ({ ...f, author_id: e.target.value }))}
                                        >
                                            <option value="">{t('dashboard.pages.form.placeholders.author')}</option>
                                            {authors.map((author) => (
                                                <option key={author.id} value={author.id}>
                                                    {author.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="published_at">{t('dashboard.pages.form.fields.publish_date')}</Label>
                                <input
                                    type="datetime-local"
                                    id="published_at"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    value={form.published_at}
                                    onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <MediaPickerDialog open={showMediaPicker} onOpenChange={setShowMediaPicker} onSelect={handleFeaturedImageSelect} />

            <ActionButtonGroup
                onCancel={onCancel}
                saveLabel={isEditing ? t('dashboard.pages.form.actions.update') : t('dashboard.pages.form.actions.create')}
                cancelLabel={t('dashboard.common.cancel')}
                isSubmitting={isSubmitting}
                onSave={() => formRef.current?.requestSubmit()}
                className="mt-6"
            />
        </form>
    );
}
