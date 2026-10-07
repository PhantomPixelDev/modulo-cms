import type { SetStateAction } from 'react';
import { useContentEditor } from '../common/useContentEditor';
import type { CustomFieldValues } from './CustomFieldInputs';
import type { FeaturedImagePreview, MetaData, PostFormProps } from './types';

export function usePostForm({ post, onSubmit, postTypes = [], currentLocale = 'en' }: PostFormProps) {
    const editor = useContentEditor(
        post ?? { post_type_id: (postTypes.find((type) => type.name === 'post') ?? postTypes[0])?.id },
        'post',
        currentLocale,
        onSubmit,
    );
    const { form, setForm } = editor;
    const set = <K extends keyof typeof form>(key: K, value: SetStateAction<(typeof form)[K]>) => {
        setForm((previous) => ({
            ...previous,
            [key]: typeof value === 'function' ? (value as (old: (typeof form)[K]) => (typeof form)[K])(previous[key]) : value,
        }));
    };
    return {
        ...editor,
        title: form.title,
        setTitle: (value: SetStateAction<string>) => set('title', value),
        slug: form.slug,
        setSlug: (value: SetStateAction<string>) => set('slug', value),
        content: form.content,
        setContent: (value: SetStateAction<string>) => set('content', value),
        excerpt: form.excerpt,
        setExcerpt: (value: SetStateAction<string>) => set('excerpt', value),
        status: form.status,
        setStatus: (value: SetStateAction<string>) => set('status', value),
        postType: form.post_type_id,
        setPostType: (value: SetStateAction<string>) => set('post_type_id', value),
        parentId: form.parent_id,
        setParentId: (value: SetStateAction<string>) => set('parent_id', value),
        authorId: form.author_id,
        setAuthorId: (value: SetStateAction<string>) => set('author_id', value),
        publishedAt: form.published_at,
        setPublishedAt: (value: SetStateAction<string>) => set('published_at', value),
        seoTitle: form.meta_title,
        setSeoTitle: (value: SetStateAction<string>) => set('meta_title', value),
        seoDescription: form.meta_description,
        setSeoDescription: (value: SetStateAction<string>) => set('meta_description', value),
        featuredImage: form.featured_image,
        metaData: form.meta_data,
        selectedTerms: form.taxonomy_terms,
        handleTermToggle: (id: number) =>
            setForm((previous) => ({
                ...previous,
                taxonomy_terms: previous.taxonomy_terms.includes(id)
                    ? previous.taxonomy_terms.filter((term) => term !== id)
                    : [...previous.taxonomy_terms, id],
            })),
        handleMetaDataChange: (meta_data: MetaData) => setForm((previous) => ({ ...previous, meta_data })),
        handleFeaturedImageSelect: (featured_image: FeaturedImagePreview) => setForm((previous) => ({ ...previous, featured_image })),
        handleFeaturedImageRemove: () => setForm((previous) => ({ ...previous, featured_image: null })),
        setFieldValues: (values: SetStateAction<CustomFieldValues>) => editor.setFieldValues(values),
    };
}
