import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';
import { usePage } from '@inertiajs/react';
import { Image as ImageIcon, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { CustomFieldDefinition } from '../../types';
import { normalizeFeaturedImage, type EditorContent, type EditorSubmission } from '../common/editor';
import { EditorControls } from '../common/EditorControls';
import { RevisionsDialog } from '../common/RevisionsDialog';
import { useContentEditor } from '../common/useContentEditor';
import { CustomFieldInputs } from '../posts/CustomFieldInputs';

import type { FeaturedImagePreview } from '../posts/types';

import MediaPickerDialog from '../media/MediaPickerDialog';
import { LocaleDropdown, type LocaleOption } from '../posts/LocaleDropdown';
import SlateEditor from '../posts/SlateEditor';

export interface PageFormProps {
    page?: EditorContent;
    isEditing: boolean;
    onSubmit: (data: EditorSubmission) => Promise<boolean>;
    onCancel: () => void;
    authors?: Array<{ id: number; name: string }>;
    canEditAuthor?: boolean;
    canPublish?: boolean;
    defaultStatus?: string;
    /** Pages this one can sit under */
    parents?: Array<{ id: number; title: string }>;
    /** The page type's custom fields */
    fields?: CustomFieldDefinition[];
    locales?: LocaleOption[];
    currentLocale?: string;
    translation?: unknown;
    onLocaleChange?: (code: string) => void;
    /** Fully built translation-delete URL; enables the delete item. */
    deleteTranslationRoute?: string;
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

export function PageForm({
    page,
    isEditing,
    authors = [],
    canEditAuthor = false,
    canPublish = false,
    defaultStatus = 'draft',
    parents = [],
    fields = [],
    locales = [],
    currentLocale = 'en',
    translation,
    onLocaleChange,
    deleteTranslationRoute,
    onSubmit,
    onCancel,
}: PageFormProps) {
    const { t } = useTranslation();
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const editor = useContentEditor(page, 'page', currentLocale, onSubmit, defaultStatus);
    const { form, setForm, fieldValues, setFieldValues, editorKey, handleSubmit, timezone, isSubmitting } = editor;
    const [activeTab, setActiveTab] = useState('content');
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    // Handle content changes from SlateEditor
    const handleContentChange = useCallback((html: string) => {
        setForm((f) => ({
            ...f,
            content: html,
        }));
    }, []);

    const handleFeaturedImageSelect = (media: FeaturedImagePreview) => {
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
        <form onSubmit={handleSubmit} className="space-y-6">
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
                    <LocaleDropdown
                        locales={locales}
                        currentLocale={currentLocale}
                        onLocaleChange={onLocaleChange}
                        hasTranslation={Boolean(translation)}
                        deleteRoute={deleteTranslationRoute}
                    />
                    <Select disabled value={form.status} onValueChange={(status) => setForm((f) => ({ ...f, status }))}>
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
                    {isEditing && page?.id && <RevisionsDialog postId={page.id} />}
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        {t('dashboard.common.cancel')}
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
                                <Label htmlFor="published_at">
                                    {t('dashboard.pages.form.fields.publish_date')} ({timezone})
                                </Label>
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

            <EditorControls editor={editor} postId={page?.id} locale={currentLocale} canPublish={canPublish} onCancel={onCancel} />
        </form>
    );
}
