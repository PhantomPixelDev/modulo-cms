import { useState, useCallback, ChangeEvent } from 'react';
import { PostFormProps, MetaData } from './types';
import { getSelectedTermIds } from './utils';

export function usePostForm({ post, onSubmit, onCancel, isEditing }: PostFormProps) {
  const [title, setTitle] = useState(post?.title || '');
  const [slug, setSlug] = useState(post?.slug || '');
  const [content, setContent] = useState(post?.content || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [status, setStatus] = useState(post?.status || 'draft');
  const [postType, setPostType] = useState<string>(post?.post_type_id?.toString() || '');
  const [parentId, setParentId] = useState<string>(post?.parent_id ? post.parent_id.toString() : 'none');
  const [authorId, setAuthorId] = useState<string>(post?.author_id?.toString() || '');
  const [featuredImage, setFeaturedImage] = useState<number | null>(post?.featured_image_id || null);
  const [metaData, setMetaData] = useState<MetaData>(post?.meta_data || {});
  const [selectedTerms, setSelectedTerms] = useState<number[]>(getSelectedTermIds(post));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedAt, setPublishedAt] = useState(
    post?.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = {
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        content,
        excerpt,
        status,
        post_type_id: parseInt(postType, 10),
        parent_id: parentId && parentId !== 'none' ? parseInt(parentId, 10) : null,
        author_id: parseInt(authorId, 10),
        featured_image_id: featuredImage,
        meta_data: metaData,
        taxonomy_terms: selectedTerms,
        published_at: status === 'published' && !publishedAt ? new Date().toISOString() : publishedAt,
      };

      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTermToggle = useCallback((termId: number) => {
    setSelectedTerms(prev => 
      prev.includes(termId)
        ? prev.filter(id => id !== termId)
        : [...prev, termId]
    );
  }, []);

  const handleMetaDataChange = useCallback((newMetaData: MetaData) => {
    setMetaData(newMetaData);
  }, []);

  const handleFeaturedImageSelect = useCallback((media: any) => {
    setFeaturedImage(media.id);
  }, []);

  const handleFeaturedImageRemove = useCallback(() => {
    setFeaturedImage(null);
  }, []);

  return {
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
    onCancel,
    isEditing,
  };
}
