import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useTranslation } from '@/hooks/useTranslation';
import { usePage } from '@inertiajs/react';
import { EditorControls } from '../common/EditorControls';
import { RevisionsDialog } from '../common/RevisionsDialog';
import MediaPickerDialog from '../media/MediaPickerDialog';
import { CustomFieldInputs } from './CustomFieldInputs';
import { LocaleDropdown } from './LocaleDropdown';
import { MetaDataSection } from './MetaDataSection';
import { PostTaxonomySection } from './PostTaxonomySection';
import SlateEditor from './SlateEditor';
import { PostFormProps } from './types';
import { usePostForm } from './usePostForm';
import { slugify } from './utils';

export function PostForm({
    post,
    translation,
    postTypes = [],
    groupedTerms = {},
    authors = [],
    parentsByType = {},
    locales = [],
    currentLocale = 'en',
    canEditAuthor = false,
    canPublish = false,
    isEditing,
    onSubmit,
    onCancel,
    onLocaleChange,
}: PostFormProps) {
    const { t } = useTranslation();

    const hasMultipleLocales = locales.length > 1;
    const editor = usePostForm({
        post,
        postTypes,
        groupedTerms,
        authors,
        parentsByType,
        canEditAuthor,
        isEditing,
        onSubmit,
        onCancel,
        currentLocale,
    });
    const {
        editorKey,
        timezone,
        // Form state
        title,
        setTitle,
        slug,
        setSlug,
        content,
        setContent,
        excerpt,
        setExcerpt,
        status,
        setStatus,
        postType,
        setPostType,
        parentId,
        setParentId,
        authorId,
        setAuthorId,
        featuredImage,
        publishedAt,
        setPublishedAt,
        metaData,
        seoTitle,
        setSeoTitle,
        seoDescription,
        setSeoDescription,
        fieldValues,
        setFieldValues,
        selectedTerms,

        // Handlers
        handleSubmit,
        handleTermToggle,
        handleMetaDataChange,
        handleFeaturedImageSelect,
        handleFeaturedImageRemove,
    } = editor;

    // What the chosen content type uses: its own fields, and whether it has an excerpt, image, terms
    const selectedType = postTypes.find((type) => String(type.id) === postType);
    const customFields = selectedType?.fields ?? [];
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;

    const availableParents = useMemo(() => {
        return postType ? parentsByType[postType] || [] : [];
    }, [postType, parentsByType]);

    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeTab, setActiveTab] = useState('content');

    const deleteTranslationRoute =
        isEditing && post?.id && translation
            ? route('dashboard.admin.posts.translations.destroy', { post: post.id, locale: currentLocale })
            : undefined;

    const statusOptions = useMemo(
        () => [
            { value: 'draft', label: t('common.status.draft') },
            { value: 'published', label: t('common.status.published') },
            { value: 'private', label: t('common.status.private') },
        ],
        [t],
    );

    const underlineTabClass =
        'h-11 flex-none rounded-none border-0 border-b-2 border-transparent px-0.5 text-sm text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent';

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-8 pb-20">
            <Card className="gap-0 overflow-hidden py-0">
                <CardHeader className="border-b px-6 py-5">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            {hasMultipleLocales && (
                                <LocaleDropdown
                                    locales={locales}
                                    currentLocale={currentLocale}
                                    onLocaleChange={onLocaleChange}
                                    hasTranslation={Boolean(translation)}
                                    deleteRoute={deleteTranslationRoute}
                                />
                            )}
                        </div>
                        <div className="flex w-full items-center space-x-3 sm:w-auto">
                            <Select value={status} onValueChange={setStatus} disabled>
                                <SelectTrigger className="h-9 w-full sm:w-[140px]">
                                    <SelectValue placeholder={t('dashboard.posts.post_status')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isEditing && post?.id && <RevisionsDialog postId={post.id} />}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="border-b px-6">
                            <TabsList className="h-11 gap-5 rounded-none bg-transparent p-0">
                                <TabsTrigger value="content" className={underlineTabClass}>
                                    {t('dashboard.posts.form.tabs.content')}
                                </TabsTrigger>
                                <TabsTrigger value="metadata" className={underlineTabClass}>
                                    {t('dashboard.posts.form.tabs.metadata')}
                                </TabsTrigger>
                                <TabsTrigger value="advanced" className={underlineTabClass}>
                                    {t('dashboard.posts.form.tabs.advanced')}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6">
                            <TabsContent value="content" className="mt-0 space-y-8 focus-visible:outline-none">
                                <div className="grid gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-sm font-bold">
                                            {t('dashboard.posts.post_title')}
                                        </Label>
                                        <Input
                                            id="title"
                                            className="h-11 text-base"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder={t('dashboard.posts.form.placeholders.title')}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slug" className="text-sm font-bold">
                                            {t('dashboard.posts.post_slug')}
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="slug"
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value)}
                                                onBlur={() => !slug && setSlug(slugify(title))}
                                                placeholder={t('dashboard.posts.form.placeholders.slug')}
                                                className="font-mono text-xs"
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setSlug(slugify(title))}
                                                className="shrink-0"
                                            >
                                                {t('dashboard.posts.form.buttons.auto_slug')}
                                            </Button>
                                        </div>
                                    </div>

                                    {selectedType?.has_featured_image !== false && (
                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold">{t('dashboard.posts.featured_image')}</Label>
                                            <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed bg-muted/20 p-4 sm:flex-row sm:items-center">
                                                {featuredImage ? (
                                                    <div className="group relative">
                                                        <img
                                                            src={featuredImage.thumb || featuredImage.url}
                                                            alt={featuredImage.name || featuredImage.file_name || t('dashboard.posts.featured_image')}
                                                            className="h-20 w-20 rounded-md object-cover ring-1 ring-border"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full shadow-md"
                                                            onClick={handleFeaturedImageRemove}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-muted">
                                                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                                                    </div>
                                                )}
                                                <div className="flex flex-col gap-2">
                                                    <Button type="button" variant="outline" size="sm" onClick={() => setShowMediaPicker(true)}>
                                                        {featuredImage
                                                            ? t('dashboard.posts.form.featured_image.change')
                                                            : t('dashboard.posts.form.featured_image.select')}
                                                    </Button>
                                                    <span className="max-w-[200px] truncate text-xs text-muted-foreground">
                                                        {featuredImage
                                                            ? featuredImage.name || featuredImage.file_name
                                                            : t('dashboard.posts.form.featured_image.none')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedType?.has_excerpt !== false && (
                                        <div className="space-y-2">
                                            <Label htmlFor="excerpt" className="text-sm font-bold">
                                                {t('dashboard.posts.post_excerpt')}
                                            </Label>
                                            <Textarea
                                                id="excerpt"
                                                value={excerpt}
                                                onChange={(e) => setExcerpt(e.target.value)}
                                                placeholder={t('dashboard.posts.form.placeholders.excerpt')}
                                                rows={3}
                                                className="resize-none"
                                            />
                                        </div>
                                    )}

                                    {customFields.length > 0 && (
                                        <div className="space-y-4 rounded-lg border p-4">
                                            <div>
                                                <h3 className="text-sm font-bold">
                                                    {t('dashboard.posts.form.details_title', { type: selectedType?.label ?? '' })}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">{t('dashboard.posts.form.details_hint')}</p>
                                            </div>
                                            <CustomFieldInputs fields={customFields} values={fieldValues} onChange={setFieldValues} errors={errors} />
                                        </div>
                                    )}

                                    <div className="space-y-3 pt-2">
                                        <Label className="text-sm font-bold">{t('dashboard.posts.post_content')}</Label>
                                        <div className="overflow-hidden rounded-lg border bg-input-bg shadow-xs">
                                            <SlateEditor key={editorKey} initialHTML={content} onHTMLChange={setContent} />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="metadata" className="mt-0 space-y-8 focus-visible:outline-none">
                                {selectedType?.has_taxonomies !== false && (
                                    <PostTaxonomySection groupedTerms={groupedTerms} selectedTerms={selectedTerms} onTermToggle={handleTermToggle} />
                                )}

                                <div className="space-y-6 border-t pt-6">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-1 rounded-full bg-primary" />
                                        <h3 className="text-lg font-bold">{t('dashboard.posts.form.seo.title')}</h3>
                                    </div>

                                    <div className="grid gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="metaTitle" className="text-sm font-bold">
                                                {t('dashboard.posts.form.fields.seo_title')}
                                            </Label>
                                            <Input
                                                id="metaTitle"
                                                value={seoTitle}
                                                onChange={(e) => setSeoTitle(e.target.value)}
                                                placeholder={t('dashboard.posts.form.placeholders.seo_title')}
                                            />
                                            <p className="text-[11px] text-muted-foreground">{t('dashboard.posts.form.seo.meta_hint')}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="metaDescription" className="text-sm font-bold">
                                                {t('dashboard.posts.form.fields.seo_description')}
                                            </Label>
                                            <Textarea
                                                id="metaDescription"
                                                value={seoDescription}
                                                onChange={(e) => setSeoDescription(e.target.value)}
                                                placeholder={t('dashboard.posts.form.placeholders.seo_description')}
                                                rows={3}
                                                className="resize-none"
                                            />
                                            <p className="text-[11px] text-muted-foreground">{t('dashboard.posts.form.seo.description_hint')}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="ogImage" className="text-sm font-bold">
                                                {t('dashboard.posts.form.seo.social_image')}
                                            </Label>
                                            <Input
                                                id="ogImage"
                                                value={String(metaData.og_image || '')}
                                                onChange={(e) => handleMetaDataChange({ ...metaData, og_image: e.target.value })}
                                                placeholder={t('dashboard.posts.form.seo.social_image_placeholder')}
                                            />
                                            <p className="text-[11px] text-muted-foreground">{t('dashboard.posts.form.seo.social_image_hint')}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="canonicalUrl" className="text-sm font-bold">
                                                {t('dashboard.posts.form.seo.canonical')}
                                            </Label>
                                            <Input
                                                id="canonicalUrl"
                                                value={String(metaData.canonical_url || '')}
                                                onChange={(e) => handleMetaDataChange({ ...metaData, canonical_url: e.target.value })}
                                                placeholder="https://…"
                                            />
                                            <p className="text-[11px] text-muted-foreground">{t('dashboard.posts.form.seo.canonical_hint')}</p>
                                        </div>

                                        <label className="flex items-start gap-3 rounded-md border p-3">
                                            <Checkbox
                                                checked={metaData.noindex === true || metaData.noindex === 'true'}
                                                onCheckedChange={(checked) => handleMetaDataChange({ ...metaData, noindex: checked === true })}
                                            />
                                            <span className="space-y-0.5">
                                                <span className="block text-sm font-medium">{t('dashboard.posts.form.seo.noindex')}</span>
                                                <span className="block text-[11px] text-muted-foreground">
                                                    {t('dashboard.posts.form.seo.noindex_hint')}
                                                </span>
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="advanced" className="mt-0 space-y-8 focus-visible:outline-none">
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="postType" className="text-sm font-bold">
                                                {t('dashboard.posts.form.fields.content_type')}
                                            </Label>
                                            <Select
                                                value={postType}
                                                onValueChange={(value) => {
                                                    setPostType(value);
                                                    setParentId('');
                                                }}
                                            >
                                                <SelectTrigger className="h-10">
                                                    <SelectValue placeholder={t('dashboard.posts.form.select_type_placeholder')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {postTypes.map((type) => (
                                                        <SelectItem key={type.id} value={String(type.id)}>
                                                            {type.label || type.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {availableParents.length > 0 && (
                                            <div className="space-y-2">
                                                <Label htmlFor="parent" className="text-sm font-bold">
                                                    {t('dashboard.posts.form.fields.parent')}
                                                </Label>
                                                <Select value={parentId} onValueChange={setParentId}>
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue placeholder={t('dashboard.posts.form.select_parent_none')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">{t('dashboard.posts.form.select_parent_none')}</SelectItem>
                                                        {availableParents.map((parent) => (
                                                            <SelectItem key={parent.id} value={String(parent.id)}>
                                                                {parent.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {canEditAuthor && authors.length > 0 && (
                                            <div className="space-y-2">
                                                <Label htmlFor="author" className="text-sm font-bold">
                                                    {t('dashboard.posts.form.fields.author')}
                                                </Label>
                                                <Select value={authorId} onValueChange={setAuthorId}>
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue placeholder={t('dashboard.posts.form.author_placeholder')} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {authors.map((author) => (
                                                            <SelectItem key={author.id} value={String(author.id)}>
                                                                {author.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="publishedAt" className="text-sm font-bold">
                                                {t('dashboard.posts.form.fields.publishing_date')} ({timezone})
                                            </Label>
                                            <Input
                                                id="publishedAt"
                                                type="datetime-local"
                                                className="h-10"
                                                value={publishedAt}
                                                onChange={(e) => setPublishedAt(e.target.value)}
                                            />
                                            <p className="text-[11px] text-muted-foreground">
                                                {t('dashboard.posts.form.seo.schedule_hint')} ({timezone})
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-sm font-bold">{t('dashboard.posts.form.seo.custom_fields')}</Label>
                                            <div className="rounded-lg border bg-muted/5 p-4">
                                                <MetaDataSection metaData={metaData} onMetaDataChange={handleMetaDataChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>

            <EditorControls editor={editor} postId={post?.id} locale={currentLocale} canPublish={canPublish} onCancel={onCancel} />

            <MediaPickerDialog
                open={showMediaPicker}
                onOpenChange={setShowMediaPicker}
                onSelect={(item) => {
                    handleFeaturedImageSelect(item);
                    setShowMediaPicker(false);
                }}
            />
        </form>
    );
}
