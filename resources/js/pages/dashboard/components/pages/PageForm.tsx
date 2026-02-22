import { useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ActionButtonGroup } from '@/components/ui/button-groups';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

import type { FeaturedImagePreview } from '../posts/types';

import SlateEditor from '../posts/SlateEditor';
import MediaPickerDialog from '../media/MediaPickerDialog';

export interface PageFormProps {
  page?: any;
  isEditing: boolean;
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
  authors?: Array<{ id: number; name: string }>;
  canEditAuthor?: boolean;
  defaultStatus?: string;
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
  onSubmit, 
  onCancel 
}: PageFormProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [activeTab, setActiveTab] = useState('content');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialFeaturedImage = normalizeFeaturedImage(page?.featured_image);
  const initialFeaturedImageId = page?.featured_image_id ?? initialFeaturedImage?.id ?? null;

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
      featured_image_id: initialFeaturedImageId,
      featured_image: initialFeaturedImage,
      meta_title: page?.meta_title ?? '',
      meta_description: page?.meta_description ?? '',
      author_id: page?.author_id?.toString() ?? '',
      published_at: page?.published_at ? new Date(page.published_at).toISOString().slice(0, 16) : '',
    };
  });

  // Handle content changes from SlateEditor
  const handleContentChange = useCallback((html: string) => {
    setForm(f => ({
      ...f,
      content: html
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
        featured_image_id: form.featured_image_id ?? (typeof form.featured_image === 'object' ? form.featured_image?.id ?? null : null),
        featured_image: featuredImageUrl,
        content: contentToSubmit,
        author_id: form.author_id ? parseInt(form.author_id, 10) : null,
      };

      // Log the data being submitted for debugging
      console.log('Submitting form data:', {
        ...formData,
        content: formData.content.substring(0, 100) + '...' // Truncate content for logging
      });

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
    setForm(f => ({
      ...f,
      featured_image_id: media?.id ?? normalized?.id ?? null,
      featured_image: normalized
    }));
    setShowMediaPicker(false);
  };

  const handleFeaturedImageRemove = () => {
    setForm(f => ({
      ...f,
      featured_image_id: null,
      featured_image: null
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, slug: e.target.value }));
  };

  const handleSlugGenerate = () => {
    setForm(f => ({
      ...f,
      slug: slugify(f.slug || f.title)
    }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({
      ...f,
      title: e.target.value,
      // Auto-generate meta title if not set or if it matches the previous title
      meta_title: !f.meta_title || f.meta_title === f.title ? e.target.value : f.meta_title,
      // Auto-generate slug if not manually modified
      slug: f.slug ? f.slug : slugify(e.target.value)
    }));
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 sm:flex sm:items-start sm:justify-between sm:space-y-0">
        <div className="max-w-xl text-sm text-muted-foreground">
          <p>
            {isEditing
              ? t('dashboard.pages.form.description.edit')
              : t('dashboard.pages.form.description.create')}
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-muted-foreground/90">
            <li key="content">{t('dashboard.pages.form.description.bullets.content')}</li>
            <li key="seo">{t('dashboard.pages.form.description.bullets.seo')}</li>
            <li key="publish">{t('dashboard.pages.form.description.bullets.publish')}</li>
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('dashboard.common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing
                  ? t('dashboard.pages.form.actions.saving_edit')
                  : t('dashboard.pages.form.actions.saving_create')}
              </>
            ) : isEditing
              ? t('dashboard.pages.form.actions.update')
              : t('dashboard.pages.form.actions.create')}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSlugGenerate}
                >
                  {t('dashboard.pages.form.actions.generate_slug')}
                </Button>
              </div>
            </div>

            <div>
              <Label>{t('dashboard.pages.form.fields.featured_image')}</Label>
              <div className="mt-1 flex flex-wrap items-center gap-4">
                {form.featured_image && typeof form.featured_image === 'object' && (
                  <div className="relative group">
                    <img
                      src={form.featured_image.thumb || form.featured_image.url}
                      alt={form.featured_image.name || form.title || 'Featured'}
                      className="h-24 w-24 rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleFeaturedImageRemove}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMediaPicker(true)}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {form.featured_image
                      ? t('dashboard.pages.form.actions.change_image')
                      : t('dashboard.pages.form.actions.select_image')}
                  </Button>
                  <Badge variant="outline" className="px-2">
                    {form.featured_image
                      ? form.featured_image.name ||
                        form.featured_image.file_name ||
                        (form.featured_image_id
                          ? t('dashboard.pages.form.selected_image_id', {
                              id: form.featured_image_id,
                            })
                          : t('dashboard.pages.form.selected_image'))
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
                onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))}
                placeholder={t('dashboard.pages.form.placeholders.excerpt')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('dashboard.pages.form.fields.content')}</Label>
              <div className="rounded-md border">
                <SlateEditor 
                  key={page?.id || 'new-page'}
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
                  onChange={(e) => setForm(f => ({ ...f, meta_title: e.target.value }))}
                  placeholder={t('dashboard.pages.form.placeholders.meta_title')}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.pages.form.seo.meta_title_hint', { count: form.meta_title.length })}
                </p>
              </div>

              <div>
                <Label htmlFor="meta_description">{t('dashboard.pages.form.seo.meta_description')}</Label>
                <Textarea
                  id="meta_description"
                  value={form.meta_description}
                  onChange={(e) => setForm(f => ({ ...f, meta_description: e.target.value }))}
                  placeholder={t('dashboard.pages.form.placeholders.meta_description')}
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.pages.form.seo.meta_description_hint', { count: form.meta_description.length })}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.pages.form.advanced.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">{t('dashboard.pages.form.fields.status')}</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="draft">{t('dashboard.posts.form.status.draft')}</option>
                    <option value="published">{t('dashboard.posts.form.status.published')}</option>
                    <option value="private">{t('dashboard.posts.form.status.private')}</option>
                    <option value="archived">{t('dashboard.posts.form.status.archived')}</option>
                  </select>
                </div>

                {canEditAuthor && authors.length > 0 && (
                  <div>
                    <Label htmlFor="author">{t('dashboard.pages.form.fields.author')}</Label>
                    <select
                      id="author"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.author_id}
                      onChange={(e) => setForm(f => ({ ...f, author_id: e.target.value }))}
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.published_at}
                  onChange={(e) => setForm(f => ({ ...f, published_at: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MediaPickerDialog
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={handleFeaturedImageSelect}
      />

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
