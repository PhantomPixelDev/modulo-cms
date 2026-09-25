import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, Globe, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { useTranslation } from '@/hooks/useTranslation';
import { RevisionsDialog } from '../common/RevisionsDialog';
import MediaPickerDialog from '../media/MediaPickerDialog';
import { MetaDataSection } from './MetaDataSection';
import { PostTaxonomySection } from './PostTaxonomySection';
import SlateEditor from './SlateEditor';
import { PostFormProps } from './types';
import { usePostForm } from './usePostForm';
import { slugify, toDatetimeLocalStr } from './utils';

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
    isEditing,
    onSubmit,
    onCancel,
    onLocaleChange,
}: PostFormProps) {
    const { t } = useTranslation();

    const currentLocaleData = locales.find((l) => l.code === currentLocale);
    const hasMultipleLocales = locales.length > 1;
    const {
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
        selectedTerms,
        isSubmitting,

        // Handlers
        handleSubmit,
        handleTermToggle,
        handleMetaDataChange,
        handleFeaturedImageSelect,
        handleFeaturedImageRemove,
    } = usePostForm({ post, postTypes, groupedTerms, authors, parentsByType, canEditAuthor, isEditing, onSubmit, onCancel });

    const availableParents = useMemo(() => {
        return postType ? parentsByType[postType] || [] : [];
    }, [postType, parentsByType]);

    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [activeTab, setActiveTab] = useState('content');
    const formRef = useRef<HTMLFormElement | null>(null);

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
        <form ref={formRef} onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-8 pb-20">
            <Card className="gap-0 overflow-hidden py-0">
                <CardHeader className="border-b px-6 py-5">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div>
                                <CardTitle className="text-lg">{isEditing ? t('dashboard.posts.edit_post') : t('dashboard.posts.add_new')}</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">{t('dashboard.posts.form.description')}</p>
                            </div>
                            {hasMultipleLocales && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="gap-2">
                                            <Globe className="h-4 w-4" />
                                            <span className="font-medium">{currentLocale.toUpperCase()}</span>
                                            <ChevronDown className="h-3 w-3 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {locales.map((locale) => (
                                            <DropdownMenuItem
                                                key={locale.code}
                                                onClick={() => onLocaleChange?.(locale.code)}
                                                className={currentLocale === locale.code ? 'bg-accent' : ''}
                                            >
                                                <span className="mr-2 font-medium">{locale.code.toUpperCase()}</span>
                                                <span className="text-muted-foreground">{locale.native_name || locale.name}</span>
                                                {locale.is_default && (
                                                    <Badge variant="secondary" className="ml-2 text-xs">
                                                        Default
                                                    </Badge>
                                                )}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                        <div className="flex w-full items-center space-x-3 sm:w-auto">
                            <Select value={status} onValueChange={setStatus}>
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
                            <Button type="submit" disabled={isSubmitting} className="h-9 px-6">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? t('dashboard.posts.form.buttons.update') : t('dashboard.posts.form.buttons.publish')}
                            </Button>
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

                                    <div className="space-y-3 pt-2">
                                        <Label className="text-sm font-bold">{t('dashboard.posts.post_content')}</Label>
                                        <div className="overflow-hidden rounded-lg border bg-input-bg shadow-xs">
                                            <SlateEditor initialHTML={content} onHTMLChange={setContent} />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="metadata" className="mt-0 space-y-8 focus-visible:outline-none">
                                <PostTaxonomySection groupedTerms={groupedTerms} selectedTerms={selectedTerms} onTermToggle={handleTermToggle} />

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
                                                value={metaData.meta_title || ''}
                                                onChange={(e) =>
                                                    handleMetaDataChange({
                                                        ...metaData,
                                                        meta_title: e.target.value,
                                                    })
                                                }
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
                                                value={metaData.meta_description || ''}
                                                onChange={(e) =>
                                                    handleMetaDataChange({
                                                        ...metaData,
                                                        meta_description: e.target.value,
                                                    })
                                                }
                                                placeholder={t('dashboard.posts.form.placeholders.seo_description')}
                                                rows={3}
                                                className="resize-none"
                                            />
                                            <p className="text-[11px] text-muted-foreground">{t('dashboard.posts.form.seo.description_hint')}</p>
                                        </div>
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
                                                {t('dashboard.posts.form.fields.publishing_date')}
                                            </Label>
                                            <Input
                                                id="publishedAt"
                                                type="datetime-local"
                                                className="h-10"
                                                value={toDatetimeLocalStr(publishedAt || new Date().toISOString())}
                                                onChange={(e) => setPublishedAt(e.target.value)}
                                            />
                                            <p className="text-[11px] text-muted-foreground">{t('dashboard.posts.form.seo.schedule_hint')}</p>
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

            <div className="fixed right-0 bottom-0 left-0 z-40 border-t bg-background/80 p-4 backdrop-blur-md sm:left-64">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
                    <Button variant="ghost" onClick={onCancel} type="button">
                        {t('dashboard.posts.form.buttons.cancel')}
                    </Button>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStatus('draft');
                                formRef.current?.requestSubmit();
                            }}
                            disabled={isSubmitting}
                        >
                            {t('dashboard.posts.form.buttons.save_draft')}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting
                                ? t('dashboard.posts.form.buttons.saving')
                                : isEditing
                                  ? t('dashboard.posts.form.buttons.update')
                                  : t('dashboard.posts.form.buttons.publish')}
                        </Button>
                    </div>
                </div>
            </div>

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
