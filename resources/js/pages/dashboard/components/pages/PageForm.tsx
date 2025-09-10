import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ActionButtonGroup } from '@/components/ui/button-groups';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';

import SlateEditor from '../posts/SlateEditor';
import MediaPickerDialog from '../media/MediaPickerDialog';

export interface PageFormProps {
  page?: any;
  isEditing: boolean;
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
  authors?: Array<{ id: number; name: string }>;
  canEditAuthor?: boolean;
}

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export function PageForm({ 
  page, 
  isEditing, 
  authors = [],
  canEditAuthor = false,
  onSubmit, 
  onCancel 
}: PageFormProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      status: page?.status ?? 'draft',
      content: initialContent, // This is a string (JSON or HTML)
      excerpt: page?.excerpt ?? '',
      featured_image_id: page?.featured_image_id ?? null,
      featured_image: page?.featured_image ?? null,
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
      const formData = {
        ...form,
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
    setForm(f => ({
      ...f,
      featured_image_id: media.id,
      featured_image: media
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{isEditing ? 'Edit Page' : 'Create Page'}</h2>
        <div className="flex space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : isEditing ? 'Update Page' : 'Create Page'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6 pt-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={handleTitleChange}
                placeholder="Enter page title"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex space-x-2">
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={handleSlugChange}
                  placeholder="page-url-slug"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSlugGenerate}
                >
                  Generate
                </Button>
              </div>
            </div>

            <div>
              <Label>Featured Image</Label>
              <div className="mt-1 flex items-center space-x-4">
                {form.featured_image ? (
                  <div className="relative group">
                    <img
                      src={form.featured_image.url}
                      alt="Featured"
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
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMediaPicker(true)}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Set featured image
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value }))}
                placeholder="A short excerpt for this page"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
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
              <CardTitle>Search Engine Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={form.meta_title}
                  onChange={(e) => setForm(f => ({ ...f, meta_title: e.target.value }))}
                  placeholder="Title to show in search results"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.meta_title.length}/60 characters. Most search engines use a maximum of 60 chars for the title.
                </p>
              </div>

              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={form.meta_description}
                  onChange={(e) => setForm(f => ({ ...f, meta_description: e.target.value }))}
                  placeholder="Description to show in search results"
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.meta_description.length}/160 characters. Most search engines use a maximum of 160 chars for the description.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="private">Private</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {canEditAuthor && authors.length > 0 && (
                  <div>
                    <Label htmlFor="author">Author</Label>
                    <select
                      id="author"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.author_id}
                      onChange={(e) => setForm(f => ({ ...f, author_id: e.target.value }))}
                    >
                      <option value="">Select author</option>
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
                <Label htmlFor="published_at">Publish Date</Label>
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
        onSave={handleSubmit}
        onCancel={onCancel}
        saveLabel={isEditing ? 'Update Page' : 'Create Page'}
        cancelLabel="Cancel"
        isSubmitting={isSubmitting}
        className="mt-6"
      />
    </form>
  );
}
