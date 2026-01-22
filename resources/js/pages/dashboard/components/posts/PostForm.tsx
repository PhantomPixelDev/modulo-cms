import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ActionButtonGroup } from '@/components/ui/button-groups';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Image as ImageIcon, X } from 'lucide-react';

import SlateEditor from './SlateEditor';
import MediaPickerDialog from '../media/MediaPickerDialog';
import { PostFormProps } from './types';
import { usePostForm } from './usePostForm';
import { PostTaxonomySection } from './PostTaxonomySection';
import { MetaDataSection } from './MetaDataSection';
import { toDatetimeLocalStr, slugify } from './utils';

export function PostForm({ 
  post, 
  postTypes = [], 
  groupedTerms = {}, 
  authors = [], 
  parentsByType = {}, 
  canEditAuthor = false, 
  isEditing, 
  onSubmit, 
  onCancel 
}: PostFormProps) {
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

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
      <Card className="shadow-sm border-border overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-4 px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-bold">{isEditing ? 'Edit Post' : 'Create New Post'}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Fill in the details for your content.</p>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isSubmitting} className="h-9 px-6">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 border-b bg-muted/10">
              <TabsList className="h-12 bg-transparent gap-6 p-0">
                <TabsTrigger value="content" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 text-xs font-semibold uppercase tracking-wider">Content</TabsTrigger>
                <TabsTrigger value="metadata" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 text-xs font-semibold uppercase tracking-wider">Metadata</TabsTrigger>
                <TabsTrigger value="advanced" className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 text-xs font-semibold uppercase tracking-wider">Advanced</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="content" className="mt-0 space-y-8 focus-visible:outline-none">
                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-bold">Title</Label>
                    <Input
                      id="title"
                      className="h-11 text-base"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter post title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-sm font-bold">URL Slug</Label>
                    <div className="flex gap-2">
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        onBlur={() => !slug && setSlug(slugify(title))}
                        placeholder="post-url-slug"
                        className="font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSlug(slugify(title))}
                        className="shrink-0"
                      >
                        Auto
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-bold">Featured Image</Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border bg-muted/20 border-dashed">
                      {featuredImage ? (
                        <div className="relative group">
                          <img
                            src={featuredImage.thumb || featuredImage.url}
                            alt={featuredImage.name || featuredImage.file_name || 'Featured image'}
                            className="h-20 w-20 rounded-md object-cover ring-1 ring-border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-5 w-5 rounded-full shadow-md"
                            onClick={handleFeaturedImageRemove}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center border">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowMediaPicker(true)}
                        >
                          {featuredImage ? 'Change image' : 'Select image'}
                        </Button>
                        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {featuredImage ? featuredImage.name || featuredImage.file_name : 'No image selected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt" className="text-sm font-bold">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Brief summary for listings..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-bold">Content</Label>
                    <div className="rounded-lg border shadow-xs overflow-hidden bg-input-bg">
                      <SlateEditor initialHTML={content} onHTMLChange={setContent} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="mt-0 space-y-8 focus-visible:outline-none">
                <PostTaxonomySection
                  groupedTerms={groupedTerms}
                  selectedTerms={selectedTerms}
                  onTermToggle={handleTermToggle}
                />

                <div className="space-y-6 pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h3 className="text-lg font-bold">Search Engine Optimization</h3>
                  </div>
                  
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle" className="text-sm font-bold">SEO Title</Label>
                      <Input
                        id="metaTitle"
                        value={metaData.meta_title || ''}
                        onChange={(e) =>
                          handleMetaDataChange({
                            ...metaData,
                            meta_title: e.target.value,
                          })
                        }
                        placeholder="Leave blank to use post title"
                      />
                      <p className="text-[11px] text-muted-foreground">Appears in search results and browser tabs.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="metaDescription" className="text-sm font-bold">SEO Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={metaData.meta_description || ''}
                        onChange={(e) =>
                          handleMetaDataChange({
                            ...metaData,
                            meta_description: e.target.value,
                          })
                        }
                        placeholder="Leave blank to use excerpt"
                        rows={3}
                        className="resize-none"
                      />
                      <p className="text-[11px] text-muted-foreground">Recommended length: 150-160 characters.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="mt-0 space-y-8 focus-visible:outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="postType" className="text-sm font-bold">Content Type</Label>
                      <Select
                        value={postType}
                        onValueChange={(value) => {
                          setPostType(value);
                          setParentId('');
                        }}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select type" />
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
                        <Label htmlFor="parent" className="text-sm font-bold">Parent</Label>
                        <Select value={parentId} onValueChange={setParentId}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (Top Level)</SelectItem>
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
                        <Label htmlFor="author" className="text-sm font-bold">Author</Label>
                        <Select value={authorId} onValueChange={setAuthorId}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select author" />
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
                      <Label htmlFor="publishedAt" className="text-sm font-bold">Publishing Date</Label>
                      <Input
                        id="publishedAt"
                        type="datetime-local"
                        className="h-10"
                        value={toDatetimeLocalStr(publishedAt || new Date().toISOString())}
                        onChange={(e) => setPublishedAt(e.target.value)}
                      />
                      <p className="text-[11px] text-muted-foreground">Set a future date to schedule the post.</p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-bold">Custom Fields</Label>
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

      <div className="fixed bottom-0 left-0 right-0 sm:left-64 bg-background/80 backdrop-blur-md border-t p-4 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-4">
          <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
          <div className="flex gap-3">
             <Button variant="outline" onClick={() => { setStatus('draft'); formRef.current?.requestSubmit(); }} disabled={isSubmitting}>Save Draft</Button>
             <Button type="submit" disabled={isSubmitting}>
               {isSubmitting ? 'Saving...' : (isEditing ? 'Update Post' : 'Publish Post')}
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
