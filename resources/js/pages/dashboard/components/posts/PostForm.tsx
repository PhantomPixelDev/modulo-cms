import React, { useMemo, useState } from 'react';
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>{isEditing ? 'Edit Post' : 'Create New Post'}</CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Create'} Post
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter post title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      onBlur={() => !slug && setSlug(slugify(title))}
                      placeholder="post-url-slug"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSlug(slugify(title))}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Featured Image</Label>
                  <div className="mt-1 flex items-center space-x-4">
                    {featuredImage ? (
                      <div className="relative group">
                        <img
                          src={featuredImage.url}
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
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="A short excerpt for this post"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <div className="rounded-md border">
                    <SlateEditor value={content} onChange={setContent} />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-6 pt-4">
              <div className="space-y-4">
                <PostTaxonomySection
                  groupedTerms={groupedTerms}
                  selectedTerms={selectedTerms}
                  onTermToggle={handleTermToggle}
                />
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">SEO</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={metaData.meta_title || ''}
                        onChange={(e) =>
                          handleMetaDataChange({
                            ...metaData,
                            meta_title: e.target.value,
                          })
                        }
                        placeholder="SEO title (leave blank to use post title)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={metaData.meta_description || ''}
                        onChange={(e) =>
                          handleMetaDataChange({
                            ...metaData,
                            meta_description: e.target.value,
                          })
                        }
                        placeholder="SEO description (leave blank to use excerpt)"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="postType">Post Type</Label>
                    <Select
                      value={postType}
                      onValueChange={(value) => {
                        setPostType(value);
                        setParentId('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select post type" />
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
                    <div>
                      <Label htmlFor="parent">Parent</Label>
                      <Select
                        value={parentId}
                        onValueChange={setParentId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
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
                    <div>
                      <Label htmlFor="author">Author</Label>
                      <Select
                        value={authorId}
                        onValueChange={setAuthorId}
                      >
                        <SelectTrigger>
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

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="publishedAt">Publish Date</Label>
                    <Input
                      id="publishedAt"
                      type="datetime-local"
                      value={toDatetimeLocalStr(publishedAt || new Date().toISOString())}
                      onChange={(e) => setPublishedAt(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Custom Fields</Label>
                    <MetaDataSection
                      metaData={metaData}
                      onMetaDataChange={handleMetaDataChange}
                    />

                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ActionButtonGroup
        onSave={onSubmit}
        onCancel={onCancel}
        saveLabel={isEditing ? 'Update Post' : 'Create Post'}
        cancelLabel="Cancel"
        isSubmitting={isSubmitting}
        className="mt-6"
      />

      <MediaPickerDialog
        open={showMediaPicker}
        onOpenChange={setShowMediaPicker}
        onSelect={handleFeaturedImageSelect}
        title="Select Featured Image"
        accept="image/*"
      />
    </form>
  );
}
