import { useCallback, useState } from 'react';
import type { CustomFieldValues } from './CustomFieldInputs';
import { FeaturedImagePreview, MetaData, PostFormProps } from './types';
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
    const initialFeaturedImage: FeaturedImagePreview | null = (() => {
        const raw = post?.featured_image;

        if (!raw) return null;

        if (typeof raw === 'string') {
            return {
                url: raw,
                name: post?.title || undefined,
            };
        }

        if (typeof raw === 'object') {
            return {
                id: raw.id,
                url: raw.url ?? raw.src ?? '',
                thumb: raw.thumb,
                name: raw.name ?? raw.alt,
                mime_type: raw.mime_type,
                file_name: raw.file_name,
            };
        }

        return null;
    })();

    const [featuredImage, setFeaturedImage] = useState<FeaturedImagePreview | null>(initialFeaturedImage);
    // SEO title/description are columns of their own; older saves also left copies in meta_data
    const [seoTitle, setSeoTitle] = useState<string>(post?.meta_title || post?.meta_data?.meta_title || '');
    const [seoDescription, setSeoDescription] = useState<string>(post?.meta_description || post?.meta_data?.meta_description || '');
    const [metaData, setMetaData] = useState<MetaData>(() => {
        const rest = { ...(post?.meta_data || {}) };
        delete rest.meta_title;
        delete rest.meta_description;
        delete rest.fields;
        return rest;
    });
    const [fieldValues, setFieldValues] = useState<CustomFieldValues>(post?.meta_data?.fields || {});
    const [selectedTerms, setSelectedTerms] = useState<number[]>(getSelectedTermIds(post));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [publishedAt, setPublishedAt] = useState(post?.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : '');

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
                featured_image: featuredImage?.url ?? null,
                meta_title: seoTitle || null,
                meta_description: seoDescription || null,
                meta_data: { ...metaData, fields: fieldValues },
                taxonomy_terms: selectedTerms,
                published_at: status === 'published' && !publishedAt ? new Date().toISOString() : publishedAt,
            };

            await onSubmit(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTermToggle = useCallback((termId: number) => {
        setSelectedTerms((prev) => (prev.includes(termId) ? prev.filter((id) => id !== termId) : [...prev, termId]));
    }, []);

    const handleMetaDataChange = useCallback((newMetaData: MetaData) => {
        setMetaData(newMetaData);
    }, []);

    const handleFeaturedImageSelect = useCallback((media: any) => {
        if (!media || typeof media !== 'object') return;
        setFeaturedImage({
            id: media.id,
            url: media.url,
            thumb: media.thumb,
            name: media.name,
            mime_type: media.mime_type,
            file_name: media.file_name,
        });
    }, []);

    const handleFeaturedImageRemove = useCallback(() => {
        setFeaturedImage(null);
    }, []);

    return {
        seoTitle,
        setSeoTitle,
        seoDescription,
        setSeoDescription,
        fieldValues,
        setFieldValues,
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
