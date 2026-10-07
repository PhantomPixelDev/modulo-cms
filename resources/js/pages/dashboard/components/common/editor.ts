import type { FormDataConvertible } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import type { CustomFieldValues } from '../posts/CustomFieldInputs';
import type { FeaturedImagePreview } from '../posts/types';
import { slugify } from '../posts/utils';

export type EditorAction = 'draft' | 'publish' | 'schedule' | 'update';
export interface EditorContent {
    id?: number;
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    status?: string;
    post_type_id?: number;
    parent_id?: number | null;
    author_id?: number;
    featured_image?: string | FeaturedImagePreview | null;
    published_at?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_data?: Record<string, FormDataConvertible> & { fields?: CustomFieldValues; meta_title?: string; meta_description?: string };
    selected_terms?: number[];
    taxonomy_terms?: { id: number }[];
}
export interface EditorState {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    status: string;
    post_type_id: string;
    parent_id: string;
    author_id: string;
    featured_image: FeaturedImagePreview | null;
    published_at: string;
    meta_title: string;
    meta_description: string;
    meta_data: Record<string, FormDataConvertible>;
    taxonomy_terms: number[];
}
export interface EditorPayload extends Omit<EditorState, 'post_type_id' | 'parent_id' | 'author_id' | 'featured_image'> {
    post_type_id: number | null;
    parent_id: number | null;
    author_id: number | null;
    featured_image: string | null;
}
export interface EditorSubmission extends EditorPayload {
    [key: string]: FormDataConvertible;
    editor_action: EditorAction;
    editor_draft_id?: string;
    editor_draft_revision?: number;
}
export function normalizeFeaturedImage(source: string | FeaturedImagePreview | null | undefined): FeaturedImagePreview | null {
    return typeof source === 'string' ? { url: source } : source?.url ? source : null;
}
export function datetimeInZone(value: string | null | undefined, timezone: string): string {
    if (!value) return '';
    const date = new Date(value.endsWith('Z') || /[+-]\d\d:\d\d$/.test(value) ? value : value.replace(' ', 'T') + 'Z');
    if (Number.isNaN(date.getTime())) return '';
    const parts = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(date);
    return parts.replace(' ', 'T');
}
export function initialEditorState(item: EditorContent | undefined, timezone: string, defaultStatus = 'draft'): EditorState {
    return {
        title: item?.title ?? '',
        slug: item?.slug ?? '',
        content: item?.content ?? '',
        excerpt: item?.excerpt ?? '',
        status: item?.status ?? defaultStatus,
        post_type_id: String(item?.post_type_id ?? ''),
        parent_id: String(item?.parent_id ?? 'none'),
        author_id: String(item?.author_id ?? ''),
        featured_image: normalizeFeaturedImage(item?.featured_image),
        published_at: datetimeInZone(item?.published_at, timezone),
        meta_title: item?.meta_title ?? item?.meta_data?.meta_title ?? '',
        meta_description: item?.meta_description ?? item?.meta_data?.meta_description ?? '',
        meta_data: { ...item?.meta_data },
        taxonomy_terms: item?.selected_terms ?? item?.taxonomy_terms?.map((term) => term.id) ?? [],
    };
}
export function serializeEditor(form: EditorState, fields: CustomFieldValues): EditorPayload {
    return {
        ...form,
        slug: form.slug || slugify(form.title),
        post_type_id: Number(form.post_type_id) || null,
        parent_id: Number(form.parent_id) || null,
        author_id: Number(form.author_id) || null,
        featured_image: form.featured_image?.url ?? null,
        meta_data: { ...form.meta_data, fields },
    };
}
export function submitEditor(url: string, method: 'post' | 'put', data: EditorSubmission & { locale: string }): Promise<boolean> {
    return new Promise((resolve) => {
        let success = false;
        router[method](url, data, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                success = true;
            },
            onFinish: () => resolve(success),
        });
    });
}
